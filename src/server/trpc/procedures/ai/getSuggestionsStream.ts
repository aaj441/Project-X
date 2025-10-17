import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "../auth/verifyToken";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";
import { env } from "~/server/env";
import { checkAndConsumeAICredits } from "~/server/utils/entitlements";

export const getSuggestionsStream = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      chapterId: z.number(),
      currentContent: z.string(),
      cursorPosition: z.number().optional(),
    })
  )
  .query(async function* ({ input }) {
    const userId = await verifyToken(input.authToken);

    // Verify ownership and get context
    const chapter = await db.chapter.findUnique({
      where: { id: input.chapterId },
      include: {
        project: {
          include: {
            chapters: {
              orderBy: { order: "asc" },
            },
            voiceSamples: {
              where: { projectId: { not: null } },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!chapter || chapter.project.userId !== userId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Chapter not found",
      });
    }

    // Check and consume AI credits (0.5 credits for suggestions)
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

    // Build context
    const previousChapters = chapter.project.chapters
      .filter((ch) => ch.order < chapter.order && ch.content)
      .slice(-2)
      .map((ch) => `Chapter ${ch.order}: ${ch.title}\n${ch.content.substring(0, 300)}...`)
      .join("\n\n");

    // Get voice guidance
    const voiceSample = chapter.project.voiceSamples[0];
    let voiceGuidance = "";
    
    if (voiceSample?.analysis) {
      try {
        const analysis = JSON.parse(voiceSample.analysis);
        voiceGuidance = `\n\nAuthor's Voice Profile:
- Tone: ${analysis.tone?.overall || "conversational"}
- Vocabulary: ${analysis.vocabulary?.level || "moderate"}
- Pacing: ${analysis.pacing?.speed || "moderate"}`;
      } catch (error) {
        // Continue without voice guidance
      }
    }

    const systemPrompt = `You are a professional writing assistant helping an author write "${chapter.project.title}" (${chapter.project.genre} genre).

Your role is to provide helpful, contextual suggestions for continuing or improving the current text. Provide suggestions that:
1. Match the author's established voice and style${voiceGuidance}
2. Flow naturally from the existing content
3. Are specific and actionable
4. Maintain consistency with previous chapters

Provide 2-3 brief, practical suggestions.`;

    const userPrompt = `${previousChapters ? `Previous context:\n${previousChapters}\n\n` : ""}Current chapter: ${chapter.title}

Current content (last 500 chars):
${input.currentContent.slice(-500)}

Provide 2-3 helpful suggestions for what to write next or how to improve the current text. Each suggestion should be brief (1-2 sentences) and actionable.`;

    const { textStream } = streamText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });

    let buffer = "";
    let suggestionCount = 0;

    for await (const textPart of textStream) {
      buffer += textPart;
      
      // Check if we have complete suggestions (looking for numbered patterns or line breaks)
      const lines = buffer.split("\n");
      
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (line.length > 10) {
          suggestionCount++;
          yield {
            id: suggestionCount,
            text: line,
            type: "continuation" as const,
            timestamp: Date.now(),
          };
        }
      }
      
      // Keep the last incomplete line in the buffer
      buffer = lines[lines.length - 1];
    }

    // Yield any remaining content
    if (buffer.trim().length > 10) {
      suggestionCount++;
      yield {
        id: suggestionCount,
        text: buffer.trim(),
        type: "continuation" as const,
        timestamp: Date.now(),
      };
    }
  });
