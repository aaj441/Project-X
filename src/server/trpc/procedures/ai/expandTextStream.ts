import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "../auth/verifyToken";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";
import { env } from "~/server/env";
import { checkAndConsumeAICredits } from "~/server/utils/entitlements";

export const expandTextStream = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      chapterId: z.number(),
      selectedText: z.string(),
      expandType: z.enum(["detail", "examples", "dialogue", "description"]).optional(),
      surroundingContext: z.string().optional(),
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

    // Check and consume AI credits (1 credit for expansion)
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

    // Get voice guidance
    const voiceSample = chapter.project.voiceSamples[0];
    let voiceGuidance = "";
    
    if (voiceSample?.analysis) {
      try {
        const analysis = JSON.parse(voiceSample.analysis);
        voiceGuidance = `\n\nMatch the author's voice:
- Sentence structure: ${analysis.sentenceStructure?.complexity || "moderate"} complexity
- Vocabulary: ${analysis.vocabulary?.level || "moderate"} level
- Tone: ${analysis.tone?.overall || "conversational"}
- Descriptiveness: ${analysis.vocabulary?.descriptiveness || "moderate"}`;
      } catch (error) {
        // Continue without voice guidance
      }
    }

    const expandInstructions = {
      detail: "Add more specific details, sensory descriptions, and nuance",
      examples: "Include concrete examples, anecdotes, or case studies",
      dialogue: "Expand with realistic dialogue and character interactions",
      description: "Enhance with vivid descriptions and imagery",
    };

    const systemPrompt = `You are a professional writer helping to expand content for "${chapter.project.title}" (${chapter.project.genre} genre).

Your task is to expand the selected text by ${input.expandType ? expandInstructions[input.expandType] : "adding more depth and detail"} while:
1. Maintaining the author's unique voice and style${voiceGuidance}
2. Keeping the core message intact
3. Ensuring smooth flow with surrounding context
4. Using markdown formatting where appropriate

Provide ONLY the expanded text, no explanations or meta-commentary.`;

    const userPrompt = `${input.surroundingContext ? `Context:\n${input.surroundingContext}\n\n` : ""}Text to expand:
"${input.selectedText}"

Expanded version with more ${input.expandType || "detail"}:`;

    const { textStream } = streamText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });

    for await (const textPart of textStream) {
      yield {
        content: textPart,
        done: false,
      };
    }

    yield {
      content: "",
      done: true,
    };
  });
