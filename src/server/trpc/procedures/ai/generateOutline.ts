import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "../auth/verifyToken";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { env } from "~/server/env";
import { checkAndConsumeAICredits } from "~/server/utils/entitlements";

export const generateOutline = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      projectId: z.number(),
      structureType: z.enum(["linear", "story_arc", "framework", "anthology"]).optional(),
      chapterCount: z.number().min(3).max(50).optional().default(12),
    })
  )
  .mutation(async ({ input }) => {
    const userId = await verifyToken(input.authToken);

    // Verify ownership
    const project = await db.project.findFirst({
      where: {
        id: input.projectId,
        userId,
      },
    });

    if (!project) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Project not found",
      });
    }

    // Check and consume AI credits (1 credit per outline generation)
    await checkAndConsumeAICredits(userId, 1);

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

    const structureType = input.structureType || project.structureType || "linear";

    const structureDescriptions = {
      linear: "traditional linear progression with clear beginning, middle, and end",
      story_arc: "narrative story arc with character development, rising action, climax, and resolution",
      framework: "framework-based with systems, tactics, and actionable steps",
      anthology: "collection of related but independent pieces or stories",
    };

    const systemPrompt = `You are an expert book structure consultant who creates compelling, well-paced outlines for ${project.genre} books. You understand narrative structure, pacing, and how to keep readers engaged.`;

    const userPrompt = `Create a detailed book outline for the following project:

Title: ${project.title}
Description: ${project.description || "No description provided"}
Genre: ${project.genre}
Language: ${project.language}
Structure Type: ${structureType} (${structureDescriptions[structureType]})
Target Chapter Count: ${input.chapterCount}

Generate a JSON outline with this structure:

{
  "bookStructure": "${structureType}",
  "overallArc": "Brief description of the book's overall narrative or thematic arc",
  "targetAudience": "Who this book is for",
  "keyThemes": ["theme1", "theme2", "theme3"],
  "chapters": [
    {
      "order": 1,
      "title": "Chapter title",
      "synopsis": "2-3 sentence summary of what happens in this chapter",
      "keyPoints": ["point 1", "point 2", "point 3"],
      "emotionalBeat": "The emotional tone or journey of this chapter",
      "estimatedWordCount": number,
      "notes": "Any special considerations for this chapter"
    }
  ],
  "pacingNotes": "Notes about pacing and flow between chapters",
  "alternativeStructures": [
    {
      "type": "alternative structure type",
      "description": "Why this alternative might work"
    }
  ]
}

Make the outline compelling, well-paced, and appropriate for the ${project.genre} genre. Ensure chapters flow naturally and build upon each other. Respond with ONLY the JSON object.`;

    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });

    // Parse the JSON response
    let outline;
    try {
      outline = JSON.parse(text);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to parse outline",
      });
    }

    // Update project with outline
    await db.project.update({
      where: { id: input.projectId },
      data: {
        outline: JSON.stringify(outline),
        structureType: outline.bookStructure,
      },
    });

    return outline;
  });
