import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "../auth/verifyToken";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { env } from "~/server/env";
import { checkAndConsumeAICredits } from "~/server/utils/entitlements";

const blurbSchema = z.object({
  short: z.object({
    text: z.string().describe("A short blurb (100-150 words) for quick previews"),
    wordCount: z.number().describe("Actual word count"),
  }),
  medium: z.object({
    text: z.string().describe("A medium blurb (200-300 words) for standard book descriptions"),
    wordCount: z.number().describe("Actual word count"),
  }),
  long: z.object({
    text: z.string().describe("A long blurb (350-500 words) for detailed descriptions"),
    wordCount: z.number().describe("Actual word count"),
  }),
  hookLine: z.string().describe("A single compelling hook sentence to grab attention"),
  targetKeywords: z.array(z.string()).max(10).describe("Keywords naturally incorporated into the blurbs"),
});

export const generateBlurb = baseProcedure
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
          take: 5,
          select: {
            content: true,
            synopsis: true,
            title: true,
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

    // Check and consume AI credits (1 credit for blurb generation)
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

    // Build rich context from project data
    const chapterSummaries = project.chapters
      .map((ch, idx) => `Chapter ${idx + 1}${ch.title ? ` - ${ch.title}` : ""}: ${ch.synopsis || ch.content?.substring(0, 300) || "No content"}`)
      .join("\n");

    const systemPrompt = `You are an expert book marketing copywriter specializing in Amazon KDP and book platform descriptions. You write blurbs that:
- Hook readers immediately with compelling opening lines
- Create emotional resonance and curiosity
- Highlight unique selling points and benefits
- Use genre-appropriate language and tone
- Incorporate keywords naturally for SEO
- Drive conversions from browsers to buyers
- Follow proven copywriting formulas (AIDA, PAS, etc.)`;

    const userPrompt = `Create compelling book blurbs in three lengths (short, medium, long) for this book:

**Book Details:**
Title: ${project.title}
Genre: ${project.genre}
Author: ${project.authorName || "Author"}
Description: ${project.description || "Not provided"}
Language: ${project.language}
Target Audience: ${project.ageRangeMin && project.ageRangeMax ? `Ages ${project.ageRangeMin}-${project.ageRangeMax}` : "General audience"}
Current Keywords: ${project.keywords || "None"}

**Chapter Overview:**
${chapterSummaries || "No chapters yet"}

**Requirements:**
1. **Short Blurb** (100-150 words): Perfect for quick previews, social media, back cover
2. **Medium Blurb** (200-300 words): Standard Amazon description length
3. **Long Blurb** (350-500 words): Detailed description for dedicated book pages

Each blurb should:
- Open with a powerful hook
- Build intrigue and emotional connection
- Highlight what makes this book unique
- End with a compelling call-to-action
- Naturally incorporate relevant keywords
- Match the genre conventions and tone

Also provide:
- A single-sentence hook line
- List of keywords naturally woven into the blurbs`;

    const { object } = await generateObject({
      model,
      schema: blurbSchema,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.8, // Good balance for creative but focused copy
    });

    // Store the generated blurbs as marketing assets
    await db.marketingAsset.create({
      data: {
        projectId: input.projectId,
        type: "amazon",
        platform: "description",
        content: JSON.stringify({
          short: object.short.text,
          medium: object.medium.text,
          long: object.long.text,
          hookLine: object.hookLine,
        }),
      },
    });

    return {
      blurbs: object,
      projectTitle: project.title,
      genre: project.genre,
    };
  });
