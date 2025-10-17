import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "../../auth/verifyToken";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { env } from "~/server/env";
import { checkAndConsumeAICredits } from "~/server/utils/entitlements";

export const processIdeaPot = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      ingredients: z.array(
        z.object({
          type: z.enum(["text", "keyword", "image_description", "voice_transcript"]),
          content: z.string(),
        })
      ),
      outputType: z.enum([
        "story_directions",
        "chapter_outline",
        "cover_concepts",
        "marketing_angles",
        "all",
      ]),
      genre: z.string().optional(),
      tone: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const userId = await verifyToken(input.authToken);

    if (input.ingredients.length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No ingredients provided",
      });
    }

    // Check and consume AI credits (2 credits for idea pot processing)
    await checkAndConsumeAICredits(userId, 2);

    if (!env.OPENROUTER_API_KEY) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "AI service not configured",
      });
    }

    const openrouter = createOpenRouter({
      apiKey: env.OPENROUTER_API_KEY,
    });

    const model = openrouter("openai/gpt-4o");

    // Build ingredients description
    const ingredientsText = input.ingredients
      .map((ing, idx) => `${idx + 1}. [${ing.type}] ${ing.content}`)
      .join("\n");

    const systemPrompt = `You are a creative brainstorming AI that helps authors and creators develop their ideas. You excel at:
- Synthesizing disparate ideas into cohesive concepts
- Generating unexpected creative connections
- Providing multiple perspectives and angles
- Balancing commercial appeal with artistic vision
- Thinking in terms of story, marketing, and visual design

You take random ingredients (keywords, voice notes, images, doodles) and transform them into actionable creative directions.`;

    const outputInstructions = {
      story_directions: `Generate 5 unique story direction ideas. Each should include:
- A compelling logline (1-2 sentences)
- Key themes and emotional beats
- Potential character archetypes
- Unique twist or hook`,
      chapter_outline: `Generate a chapter-by-chapter outline with:
- 8-12 chapters
- Chapter titles
- Brief synopsis for each
- Narrative arc and pacing notes`,
      cover_concepts: `Generate 5 cover design concepts. Each should include:
- Visual style and mood
- Color palette
- Key imagery and symbolism
- Typography suggestions
- Target audience appeal`,
      marketing_angles: `Generate 5 marketing angles. Each should include:
- Target audience segment
- Key selling points
- Emotional hooks
- Platform-specific strategies (Amazon, social media, etc.)
- Tagline or hook phrase`,
      all: `Generate creative outputs across all categories:
1. 3 story directions
2. A brief chapter outline (5-7 chapters)
3. 3 cover concepts
4. 3 marketing angles`,
    };

    const userPrompt = `Here are the ingredients dropped into the Idea Pot:

${ingredientsText}

${input.genre ? `Genre: ${input.genre}` : ""}
${input.tone ? `Desired tone: ${input.tone}` : ""}

${outputInstructions[input.outputType]}

Respond with a JSON object with the following structure:
{
  "storyDirections": [
    {
      "title": "Story title/concept name",
      "logline": "Compelling one-sentence description",
      "themes": ["theme1", "theme2"],
      "hook": "What makes this unique"
    }
  ],
  "chapterOutline": {
    "overallArc": "Brief description",
    "chapters": [
      {
        "number": 1,
        "title": "Chapter title",
        "synopsis": "What happens"
      }
    ]
  },
  "coverConcepts": [
    {
      "name": "Concept name",
      "style": "Visual style",
      "colors": ["color1", "color2"],
      "imagery": "Key visual elements",
      "mood": "Overall mood/feeling"
    }
  ],
  "marketingAngles": [
    {
      "angle": "Angle name",
      "audience": "Target audience",
      "hook": "Emotional hook",
      "tagline": "Catchy tagline"
    }
  ]
}

Only include the sections relevant to the requested output type. Be creative and synthesize the ingredients in unexpected ways!`;

    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.9, // High temperature for maximum creativity
      maxTokens: 2000,
    });

    // Parse JSON response
    let result;
    try {
      result = JSON.parse(text);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to parse AI response",
      });
    }

    return {
      outputs: result,
      ingredientsUsed: input.ingredients.length,
      creditsConsumed: 2,
    };
  });
