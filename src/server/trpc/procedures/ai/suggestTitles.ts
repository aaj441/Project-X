import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "../auth/verifyToken";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { env } from "~/server/env";
import { checkAndConsumeAICredits } from "~/server/utils/entitlements";

const titleSuggestionsSchema = z.object({
  suggestions: z.array(
    z.object({
      title: z.string().describe("The suggested book title"),
      rationale: z.string().describe("Why this title would work well for the book"),
      marketability: z.enum(["high", "medium", "low"]).describe("How marketable this title is"),
    })
  ).length(5),
});

export const suggestTitles = baseProcedure
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
          take: 2,
          select: {
            content: true,
            synopsis: true,
          },
        },
      },
    });

    if (!project) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Project not found",
      });
    }

    // Check and consume AI credits (1 credit for title generation)
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

    // Build context from available project data
    const contentSample = project.chapters
      .map((ch) => ch.synopsis || ch.content?.substring(0, 500))
      .filter(Boolean)
      .join("\n\n");

    const systemPrompt = `You are an expert book title creator and publishing consultant. You understand what makes titles memorable, searchable, and marketable across different genres. You create titles that:
- Capture the essence of the book
- Appeal to the target audience
- Are optimized for search and discoverability
- Stand out in their genre
- Are memorable and shareable`;

    const userPrompt = `Generate 5 compelling book title suggestions for this project.

Current Title: ${project.title}
Genre: ${project.genre}
Language: ${project.language}
Description: ${project.description || "Not provided"}
Target Audience: ${project.ageRangeMin && project.ageRangeMax ? `Ages ${project.ageRangeMin}-${project.ageRangeMax}` : "General audience"}
${contentSample ? `\n\nContent Sample:\n${contentSample}` : ""}

For each title suggestion, provide:
1. The title itself
2. A rationale explaining why it works
3. A marketability rating (high/medium/low)

Focus on titles that are:
- Genre-appropriate
- Memorable and unique
- Search-optimized
- Emotionally resonant with the target audience`;

    const { object } = await generateObject({
      model,
      schema: titleSuggestionsSchema,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.9, // Higher temperature for more creative titles
    });

    return {
      suggestions: object.suggestions,
      currentTitle: project.title,
    };
  });
