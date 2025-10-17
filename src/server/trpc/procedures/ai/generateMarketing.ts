import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "../auth/verifyToken";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { env } from "~/server/env";
import { checkAndConsumeAICredits } from "~/server/utils/entitlements";

export const generateMarketing = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      projectId: z.number(),
      assetTypes: z.array(
        z.enum([
          "social-twitter",
          "social-instagram",
          "social-linkedin",
          "email-announcement",
          "amazon-description",
          "press-release",
        ])
      ),
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

    // Check and consume AI credits (1 credit per asset type)
    await checkAndConsumeAICredits(userId, input.assetTypes.length);

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

    const assets = [];

    for (const assetType of input.assetTypes) {
      let systemPrompt = "";
      let userPrompt = "";

      switch (assetType) {
        case "social-twitter":
          systemPrompt =
            "You are a social media marketing expert specializing in book promotion on Twitter/X.";
          userPrompt = `Create 5 engaging Twitter/X posts to promote this book. Each should be under 280 characters, use relevant hashtags, and create curiosity or provide value.

Book: ${project.title}
Description: ${project.description || ""}
Genre: ${project.genre}

Format as JSON array of strings.`;
          break;

        case "social-instagram":
          systemPrompt =
            "You are a social media marketing expert specializing in Instagram book promotion.";
          userPrompt = `Create 3 Instagram captions for promoting this book. Include engaging hooks, relevant hashtags, and calls-to-action.

Book: ${project.title}
Description: ${project.description || ""}
Genre: ${project.genre}

Format as JSON array of strings.`;
          break;

        case "social-linkedin":
          systemPrompt =
            "You are a professional content creator specializing in LinkedIn book promotion.";
          userPrompt = `Create 2 professional LinkedIn posts announcing this book. Focus on value, expertise, and professional appeal.

Book: ${project.title}
Description: ${project.description || ""}
Genre: ${project.genre}

Format as JSON array of strings.`;
          break;

        case "email-announcement":
          systemPrompt =
            "You are an email marketing copywriter specializing in book launches.";
          userPrompt = `Create an engaging email announcement for this book launch. Include:
- Compelling subject line
- Hook that grabs attention
- What the book is about
- Who it's for
- Call-to-action

Book: ${project.title}
Description: ${project.description || ""}
Genre: ${project.genre}

Format as JSON with keys: subject, body`;
          break;

        case "amazon-description":
          systemPrompt =
            "You are an expert at writing compelling Amazon book descriptions that convert browsers into buyers.";
          userPrompt = `Create a compelling Amazon book description for this book. It should:
- Hook readers in the first sentence
- Clearly explain what the book is about
- Highlight key benefits/takeaways
- Use bullet points for key features
- End with a strong call-to-action
- Be optimized for Amazon's algorithm (use relevant keywords)

Book: ${project.title}
Description: ${project.description || ""}
Genre: ${project.genre}
Keywords: ${project.keywords || ""}

Format as a single string with HTML formatting (<b>, <i>, <br>).`;
          break;

        case "press-release":
          systemPrompt =
            "You are a professional press release writer for book launches.";
          userPrompt = `Write a professional press release announcing this book. Include:
- Attention-grabbing headline
- Dateline
- Lead paragraph with key information
- Body paragraphs with details
- Author quote
- Boilerplate about the author
- Contact information placeholder

Book: ${project.title}
Description: ${project.description || ""}
Genre: ${project.genre}
Author: ${project.authorName || "Author"}

Format as a single string.`;
          break;
      }

      const { text } = await generateText({
        model,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.8,
      });

      // Parse if JSON, otherwise use as-is
      let content;
      try {
        content = JSON.parse(text);
      } catch {
        content = text;
      }

      // Store in database
      const asset = await db.marketingAsset.create({
        data: {
          projectId: input.projectId,
          type: assetType.split("-")[0], // social, email, amazon, press
          platform: assetType.includes("-") ? assetType.split("-")[1] : null,
          content: typeof content === "string" ? content : JSON.stringify(content),
        },
      });

      assets.push({
        ...asset,
        parsedContent: content,
      });
    }

    return assets;
  });
