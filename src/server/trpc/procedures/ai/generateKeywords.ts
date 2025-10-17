import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "../auth/verifyToken";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { env } from "~/server/env";
import { checkAndConsumeAICredits } from "~/server/utils/entitlements";

export const generateKeywords = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      projectId: z.number(),
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
      include: {
        chapters: {
          orderBy: { order: "asc" },
          take: 3, // First 3 chapters for context
        },
      },
    });

    if (!project) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Project not found",
      });
    }

    // Check and consume AI credits (1 credit for keyword generation)
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

    // Build context from project
    const contentSample = project.chapters
      .slice(0, 3)
      .map((ch) => ch.content.substring(0, 500))
      .join("\n\n");

    const systemPrompt = `You are an Amazon KDP keyword optimization expert. Your job is to generate highly effective keywords that will help books rank well in Amazon search results and reach the right audience. Consider:
- Search volume and competition
- Relevance to the book's content and genre
- Specific phrases readers might search for
- Long-tail keywords that are less competitive
- Keywords that describe the book's themes, topics, and benefits`;

    const userPrompt = `Generate exactly 7 optimized keywords for this book to use on Amazon KDP. These should be highly relevant, searchable terms that will help readers discover this book.

Book Title: ${project.title}
Genre: ${project.genre}
Description: ${project.description || "Not provided"}
${project.categories ? `Categories: ${project.categories}` : ""}
${contentSample ? `Content Sample:\n${contentSample}` : ""}

Return ONLY a JSON array of exactly 7 keyword strings. Each keyword can be 1-3 words. Focus on discoverability and relevance.
Example format: ["keyword one", "keyword two", "keyword three", ...]`;

    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });

    // Parse the JSON response
    let keywords: string[];
    try {
      keywords = JSON.parse(text);
      
      // Validate that we got an array of strings
      if (!Array.isArray(keywords) || keywords.length !== 7) {
        throw new Error("Invalid keyword format");
      }
      
      // Ensure all items are strings
      keywords = keywords.map(k => String(k).trim()).filter(k => k.length > 0);
      
      // If we don't have exactly 7 after cleaning, throw error
      if (keywords.length !== 7) {
        throw new Error("Did not receive exactly 7 keywords");
      }
    } catch (error) {
      console.error("Failed to parse AI keywords response:", text);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate valid keywords. Please try again.",
      });
    }

    return {
      keywords,
      keywordsString: keywords.join(", "),
    };
  });
