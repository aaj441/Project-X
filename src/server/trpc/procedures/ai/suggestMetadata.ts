import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "../auth/verifyToken";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { env } from "~/server/env";
import { checkAndConsumeAICredits } from "~/server/utils/entitlements";

const metadataSuggestionsSchema = z.object({
  genre: z.object({
    primary: z.string().describe("The primary genre that best fits this book"),
    secondary: z.string().optional().describe("A secondary genre if applicable"),
    confidence: z.enum(["high", "medium", "low"]).describe("Confidence in this genre classification"),
    reasoning: z.string().describe("Why this genre was chosen"),
  }),
  bisacCategories: z.array(
    z.object({
      code: z.string().describe("The BISAC category code (e.g., FIC031000)"),
      name: z.string().describe("The human-readable category name"),
      relevance: z.enum(["primary", "secondary", "tertiary"]).describe("How relevant this category is"),
    })
  ).min(2).max(5).describe("2-5 most relevant BISAC categories"),
  targetAudience: z.object({
    ageRangeMin: z.number().int().min(0).max(100).describe("Minimum recommended age"),
    ageRangeMax: z.number().int().min(0).max(100).describe("Maximum recommended age"),
    reasoning: z.string().describe("Why this age range is appropriate"),
    audienceDescription: z.string().describe("Description of the ideal reader"),
  }),
  additionalTags: z.array(z.string()).max(5).describe("Additional descriptive tags for the book"),
});

export const suggestMetadata = baseProcedure
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
          take: 3,
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

    // Check and consume AI credits (1 credit for metadata generation)
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
      .map((ch) => {
        const text = ch.synopsis || ch.content?.substring(0, 1000);
        return text;
      })
      .filter(Boolean)
      .join("\n\n");

    const systemPrompt = `You are an expert book metadata specialist and publishing consultant with deep knowledge of:
- BISAC (Book Industry Standards and Communications) category codes
- Genre classification and market positioning
- Target audience analysis
- Amazon KDP and other publishing platform requirements

You provide accurate, strategic metadata recommendations that maximize discoverability and ensure proper categorization.`;

    const userPrompt = `Analyze this book project and provide comprehensive metadata recommendations:

Title: ${project.title}
Current Genre: ${project.genre || "Not specified"}
Description: ${project.description || "Not provided"}
Language: ${project.language}
${project.ageRangeMin && project.ageRangeMax ? `Current Age Range: ${project.ageRangeMin}-${project.ageRangeMax}` : ""}
${contentSample ? `\n\nContent Sample:\n${contentSample}` : ""}

Provide:
1. **Genre Classification**: Primary (and optional secondary) genre with confidence level and reasoning
2. **BISAC Categories**: 2-5 most relevant BISAC codes with names and relevance ranking
3. **Target Audience**: Recommended age range with reasoning and ideal reader description
4. **Additional Tags**: Up to 5 descriptive tags for better categorization

Consider:
- Market positioning and competition
- Search optimization
- Platform-specific requirements (Amazon KDP, etc.)
- Content appropriateness for age groups
- Genre conventions and reader expectations`;

    const { object } = await generateObject({
      model,
      schema: metadataSuggestionsSchema,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.3, // Lower temperature for more consistent metadata
    });

    return {
      suggestions: object,
      currentMetadata: {
        genre: project.genre,
        categories: project.categories,
        ageRangeMin: project.ageRangeMin,
        ageRangeMax: project.ageRangeMax,
      },
    };
  });
