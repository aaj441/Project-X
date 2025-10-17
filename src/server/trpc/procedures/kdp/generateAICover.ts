import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "../auth/verifyToken";
import { experimental_generateImage as generateImage } from "ai";
import { openai } from "@ai-sdk/openai";
import { minioClient, minioBaseUrl } from "~/server/minio";
import { Buffer } from "buffer";
import { checkAndConsumeAICredits } from "~/server/utils/entitlements";

export const generateAICover = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      projectId: z.number(),
      prompt: z.string().min(1),
      style: z.string().optional(), // e.g., "professional", "artistic", "minimalist"
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
    });

    if (!project) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Project not found",
      });
    }

    // Check and consume AI credits (2 credits for AI image generation)
    await checkAndConsumeAICredits(userId, 2);

    // Construct enhanced prompt for book cover
    const styleGuide = input.style || "professional and eye-catching";
    const enhancedPrompt = `Create a ${styleGuide} book cover design for a ${project.genre} book titled "${project.title}". ${input.prompt}. The design should be suitable for Amazon Kindle Direct Publishing, with clear typography space and professional quality.`;

    try {
      // Generate image using AI
      const { image } = await generateImage({
        model: openai.image("dall-e-3"),
        prompt: enhancedPrompt,
        size: "1024x1792", // Portrait orientation suitable for book covers
      });

      // Convert base64 to buffer
      const imageBuffer = Buffer.from(image.base64, "base64");

      // Generate unique filename
      const timestamp = Date.now();
      const objectName = `ai-${input.projectId}-${timestamp}.png`;

      // Upload to MinIO
      await minioClient.putObject(
        "cover-images",
        objectName,
        imageBuffer,
        imageBuffer.length,
        {
          "Content-Type": "image/png",
        }
      );

      // Construct public URL
      const publicUrl = `${minioBaseUrl}/cover-images/${objectName}`;

      return {
        coverUrl: publicUrl,
      };
    } catch (error) {
      console.error("AI cover generation error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate cover image. Please try again.",
      });
    }
  });
