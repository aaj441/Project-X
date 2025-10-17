import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "../auth/verifyToken";

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;

  // Count vowel groups
  const vowelGroups = word.match(/[aeiouy]+/g);
  let syllables = vowelGroups ? vowelGroups.length : 1;

  // Adjust for silent e
  if (word.endsWith("e")) {
    syllables--;
  }

  // Adjust for special cases
  if (word.endsWith("le") && word.length > 2) {
    syllables++;
  }

  return Math.max(1, syllables);
}

export function calculateReadabilityMetrics(text: string) {
  // Remove markdown formatting for accurate analysis
  const cleanText = text
    .replace(/[#*_`~\[\]]/g, "")
    .replace(/\n+/g, " ")
    .trim();

  // Count sentences (periods, exclamation marks, question marks)
  const sentences = cleanText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = sentences.length || 1;

  // Count words
  const words = cleanText.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length || 1;

  // Count syllables (approximate)
  const syllableCount = words.reduce((total, word) => {
    return total + countSyllables(word);
  }, 0);

  // Average sentence length
  const avgSentenceLength = wordCount / sentenceCount;

  // Average word length in characters
  const avgWordLength =
    words.reduce((sum, word) => sum + word.length, 0) / wordCount;

  // Flesch Reading Ease: 206.835 - 1.015(words/sentences) - 84.6(syllables/words)
  const fleschReading =
    206.835 - 1.015 * avgSentenceLength - 84.6 * (syllableCount / wordCount);

  // Flesch-Kincaid Grade Level: 0.39(words/sentences) + 11.8(syllables/words) - 15.59
  const fleschKincaid =
    0.39 * avgSentenceLength + 11.8 * (syllableCount / wordCount) - 15.59;

  // Estimate grade level (simplified)
  let gradeLevel = Math.round(fleschKincaid);
  if (gradeLevel < 1) gradeLevel = 1;
  if (gradeLevel > 18) gradeLevel = 18;

  return {
    fleschReading: Math.round(fleschReading * 10) / 10,
    fleschKincaid: Math.round(fleschKincaid * 10) / 10,
    gradeLevel,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    avgWordLength: Math.round(avgWordLength * 10) / 10,
    wordCount,
  };
}

export const calculateReadability = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      chapterId: z.number(),
    })
  )
  .mutation(async ({ input }) => {
    const userId = await verifyToken(input.authToken);

    // Verify ownership through project
    const chapter = await db.chapter.findUnique({
      where: { id: input.chapterId },
      include: { project: true },
    });

    if (!chapter || chapter.project.userId !== userId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Chapter not found",
      });
    }

    if (!chapter.content || chapter.content.trim().length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Chapter has no content to analyze",
      });
    }

    // Calculate readability metrics
    const metrics = calculateReadabilityMetrics(chapter.content);

    // Update or create readability score
    const score = await db.readabilityScore.upsert({
      where: { chapterId: input.chapterId },
      update: {
        ...metrics,
        calculatedAt: new Date(),
      },
      create: {
        chapterId: input.chapterId,
        ...metrics,
      },
    });

    // Update chapter word count
    await db.chapter.update({
      where: { id: input.chapterId },
      data: { wordCount: metrics.wordCount },
    });

    return score;
  });
