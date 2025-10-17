import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "../auth/verifyToken";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { env } from "~/server/env";
import { checkAndConsumeAICredits } from "~/server/utils/entitlements";

export const analyzeVoice = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      projectId: z.number().optional(),
      name: z.string(),
      content: z.string().min(500, "Sample must be at least 500 characters"),
    })
  )
  .mutation(async ({ input }) => {
    const userId = await verifyToken(input.authToken);

    // Verify project ownership if projectId provided
    if (input.projectId) {
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
    }

    // Check and consume AI credits (1 credit per voice analysis)
    await checkAndConsumeAICredits(userId, 1);

    if (!env.OPENROUTER_API_KEY) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "AI service not configured",
      });
    }

    // Analyze writing style using AI
    const openrouter = createOpenRouter({
      apiKey: env.OPENROUTER_API_KEY,
    });

    const model = openrouter("openai/gpt-4o");

    const systemPrompt = `You are a literary analyst specializing in writing style analysis. Analyze the provided text sample and extract detailed characteristics about the author's writing style.`;

    const userPrompt = `Analyze this writing sample and provide a detailed JSON analysis with the following structure:

{
  "sentenceStructure": {
    "avgLength": number,
    "complexity": "simple" | "moderate" | "complex",
    "variety": "low" | "moderate" | "high",
    "patterns": ["description of common patterns"]
  },
  "vocabulary": {
    "level": "casual" | "moderate" | "advanced" | "academic",
    "favoriteWords": ["list of frequently used words"],
    "technicalTerms": ["list if any"],
    "descriptiveness": "sparse" | "moderate" | "rich"
  },
  "tone": {
    "overall": "formal" | "conversational" | "academic" | "casual" | "humorous" | "serious",
    "consistency": "very consistent" | "mostly consistent" | "varies",
    "emotion": "detached" | "neutral" | "warm" | "passionate"
  },
  "pacing": {
    "speed": "fast" | "moderate" | "slow",
    "rhythm": "staccato" | "flowing" | "varied",
    "transitions": "abrupt" | "smooth" | "mixed"
  },
  "voice": {
    "perspective": "first-person" | "second-person" | "third-person",
    "intimacy": "distant" | "professional" | "friendly" | "intimate",
    "authority": "tentative" | "balanced" | "confident" | "authoritative"
  },
  "stylistic": {
    "metaphors": "rare" | "occasional" | "frequent",
    "humor": "none" | "subtle" | "moderate" | "prominent",
    "storytelling": "factual" | "narrative" | "anecdotal" | "story-driven",
    "paragraphLength": "short" | "medium" | "long" | "varied"
  },
  "summary": "A 2-3 sentence summary of the author's unique voice"
}

Writing Sample:
${input.content}

Respond with ONLY the JSON object, no additional text.`;

    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.3, // Lower temperature for more consistent analysis
    });

    // Parse the JSON response
    let analysis;
    try {
      analysis = JSON.parse(text);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to parse voice analysis",
      });
    }

    // Create voice sample record
    const voiceSample = await db.voiceSample.create({
      data: {
        userId,
        projectId: input.projectId,
        name: input.name,
        content: input.content,
        analysis: JSON.stringify(analysis),
      },
    });

    return {
      ...voiceSample,
      analysis,
    };
  });
