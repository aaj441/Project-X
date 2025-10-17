import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "../auth/verifyToken";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { env } from "~/server/env";
import { checkAndConsumeAICredits } from "~/server/utils/entitlements";

export const generateChapter = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      chapterId: z.number(),
      prompt: z.string().min(1),
      context: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const userId = await verifyToken(input.authToken);

    // Verify ownership through project and get full context
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

    // Check and consume AI credits (1 credit per chapter generation)
    await checkAndConsumeAICredits(userId, 1);

    if (!env.OPENROUTER_API_KEY) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "AI service not configured",
      });
    }

    // Generate content using AI
    const openrouter = createOpenRouter({
      apiKey: env.OPENROUTER_API_KEY,
    });

    const model = openrouter("openai/gpt-4o");

    // Build context from previous chapters
    const previousChapters = chapter.project.chapters
      .filter((ch) => ch.order < chapter.order && ch.content)
      .slice(-3) // Last 3 chapters for context
      .map((ch) => `Chapter ${ch.order}: ${ch.title}\n${ch.content.substring(0, 500)}...`)
      .join("\n\n");

    // Get voice sample analysis if available
    const voiceSample = chapter.project.voiceSamples[0];
    let voiceGuidance = "";
    
    if (voiceSample?.analysis) {
      try {
        const analysis = JSON.parse(voiceSample.analysis);
        voiceGuidance = `\n\nIMPORTANT - Match the author's unique voice:
- Sentence structure: ${analysis.sentenceStructure?.complexity || "moderate"} complexity, ${analysis.sentenceStructure?.variety || "moderate"} variety
- Vocabulary level: ${analysis.vocabulary?.level || "moderate"}
- Tone: ${analysis.tone?.overall || "conversational"}, ${analysis.tone?.emotion || "neutral"}
- Pacing: ${analysis.pacing?.speed || "moderate"} speed, ${analysis.pacing?.rhythm || "flowing"} rhythm
- Voice: ${analysis.voice?.intimacy || "professional"} intimacy, ${analysis.voice?.authority || "balanced"} authority
- Style: ${analysis.stylistic?.storytelling || "narrative"} storytelling, ${analysis.stylistic?.humor || "subtle"} humor
- Summary: ${analysis.summary || ""}

Write in THIS specific voice, not generic AI writing.`;
      } catch (error) {
        // If parsing fails, continue without voice guidance
      }
    }

    // Get outline context if available
    let outlineContext = "";
    if (chapter.project.outline) {
      try {
        const outline = JSON.parse(chapter.project.outline);
        const chapterOutline = outline.chapters?.find(
          (ch: any) => ch.order === chapter.order
        );
        if (chapterOutline) {
          outlineContext = `\n\nChapter Outline:
- Synopsis: ${chapterOutline.synopsis}
- Key Points: ${chapterOutline.keyPoints?.join(", ") || ""}
- Emotional Beat: ${chapterOutline.emotionalBeat || ""}
- Notes: ${chapterOutline.notes || ""}`;
        }
      } catch (error) {
        // If parsing fails, continue without outline context
      }
    }

    const systemPrompt = `You are a professional writer helping to create content for an e-book titled "${chapter.project.title}" in the ${chapter.project.genre} genre. The language is ${chapter.project.language}.

Target tone: ${chapter.project.tone || "conversational"}
${chapter.project.readingLevel ? `Target reading level: Grade ${chapter.project.readingLevel}` : ""}${voiceGuidance}`;

    const userPrompt = `${previousChapters ? `Previous chapters for context:\n${previousChapters}\n\n` : ""}Chapter Title: ${chapter.title}${outlineContext}

User Request: ${input.prompt}${input.context ? `\n\nAdditional Context: ${input.context}` : ""}

Please write engaging, high-quality content for this chapter that:
1. Flows naturally from previous chapters
2. Matches the established voice and tone
3. Addresses the user's request
4. Uses markdown formatting for structure (headings, lists, emphasis)
5. Is appropriate for the target reading level

Write the complete chapter content now:`;

    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });

    // Update chapter with generated content
    const updated = await db.chapter.update({
      where: { id: input.chapterId },
      data: {
        content: text,
        status: "ai-generated",
      },
    });

    // Calculate readability score asynchronously (don't wait for it)
    calculateReadabilityForChapter(input.chapterId).catch((error) => {
      console.error("Failed to calculate readability:", error);
    });

    return updated;
  });

// Helper function to calculate readability
async function calculateReadabilityForChapter(chapterId: number) {
  const chapter = await db.chapter.findUnique({
    where: { id: chapterId },
  });

  if (!chapter?.content) return;

  // Import the readability calculation logic
  const { calculateReadabilityMetrics } = await import("./calculateReadability");
  const metrics = calculateReadabilityMetrics(chapter.content);

  await db.readabilityScore.upsert({
    where: { chapterId },
    update: {
      ...metrics,
      calculatedAt: new Date(),
    },
    create: {
      chapterId,
      ...metrics,
    },
  });

  await db.chapter.update({
    where: { id: chapterId },
    data: { wordCount: metrics.wordCount },
  });
}
