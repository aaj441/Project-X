import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "../auth/verifyToken";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";
import { env } from "~/server/env";
import { checkAndConsumeAICredits } from "~/server/utils/entitlements";

export const rewriteTextStream = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      chapterId: z.number(),
      selectedText: z.string(),
      instruction: z.string(),
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

    // Check and consume AI credits (1 credit for rewrite)
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
        voiceGuidance = `\n\nMaintain the author's voice:
- Sentence structure: ${analysis.sentenceStructure?.complexity || "moderate"} complexity
- Vocabulary: ${analysis.vocabulary?.level || "moderate"} level
- Tone: ${analysis.tone?.overall || "conversational"}
- Pacing: ${analysis.pacing?.speed || "moderate"}`;
      } catch (error) {
        // Continue without voice guidance
      }
    }

    const systemPrompt = `You are a professional editor helping to rewrite text for "${chapter.project.title}" (${chapter.project.genre} genre).

Your task is to rewrite the selected text according to the user's instruction while:
1. Maintaining the author's unique voice and style${voiceGuidance}
2. Keeping the core meaning and intent
3. Ensuring it fits naturally with surrounding context
4. Using markdown formatting where appropriate

Provide ONLY the rewritten text, no explanations or meta-commentary.`;

    const userPrompt = `${input.surroundingContext ? `Context:\n${input.surroundingContext}\n\n` : ""}Selected text to rewrite:
"${input.selectedText}"

Instruction: ${input.instruction}

Rewritten text:`;

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
