import { z } from "zod";
import { db } from "~/server/db";
import { TRPCError } from "@trpc/server";
import { experimental_generateImage as generateImage } from "ai";
import { openai } from "@ai-sdk/openai";
import { minioClient, MINIO_BUCKET } from "~/server/minio";
import { getMinioBaseUrl } from "~/server/utils/base-url";

export const generateMultipleAICoversInputSchema = z.object({
  authToken: z.string(),
  projectId: z.number(),
  prompt: z.string(),
  count: z.number().min(1).max(5).default(5),
  style: z.string().optional(),
});

export async function generateMultipleAICovers(
  input: z.infer<typeof generateMultipleAICoversInputSchema>
) {
  // Verify authentication
  const user = await db.user.findFirst({
    where: { id: parseInt(input.authToken) },
  });

  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid authentication token",
    });
  }

  // Check AI credits
  if (user.aiCredits < input.count) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Insufficient AI credits. You need ${input.count} credits to generate ${input.count} covers.`,
    });
  }

  // Get project details
  const project = await db.project.findUnique({
    where: { id: input.projectId },
  });

  if (!project) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Project not found",
    });
  }

  if (project.userId !== user.id) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to modify this project",
    });
  }

  const coverUrls: string[] = [];
  const styleModifiers = [
    "professional and clean",
    "artistic and creative",
    "bold and dramatic",
    "elegant and sophisticated",
    "modern and minimalist",
  ];

  // Generate multiple covers with variations
  for (let i = 0; i < input.count; i++) {
    try {
      // Create variation in prompt
      const styleModifier = input.style || styleModifiers[i % styleModifiers.length];
      const enhancedPrompt = `${input.prompt}, ${styleModifier} style, book cover design for "${project.title}", ${project.genre} genre`;

      // Generate image using AI
      const { image } = await generateImage({
        model: openai.image("dall-e-3"),
        prompt: enhancedPrompt,
        size: "1024x1024",
      });

      // Convert to buffer
      const imageBuffer = Buffer.from(image.uint8Array);

      // Upload to MinIO
      const fileName = `covers/${project.id}/ai-cover-${Date.now()}-${i}.png`;
      await minioClient.putObject(MINIO_BUCKET, fileName, imageBuffer, {
        "Content-Type": "image/png",
      });

      // Get public URL
      const minioBaseUrl = getMinioBaseUrl();
      const publicUrl = `${minioBaseUrl}/${MINIO_BUCKET}/${fileName}`;
      coverUrls.push(publicUrl);
    } catch (error) {
      console.error(`Failed to generate cover ${i + 1}:`, error);
      // Continue generating other covers even if one fails
    }
  }

  if (coverUrls.length === 0) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to generate any covers. Please try again.",
    });
  }

  // Deduct AI credits (only for successfully generated covers)
  await db.user.update({
    where: { id: user.id },
    data: {
      aiCredits: user.aiCredits - coverUrls.length,
      lifetimeCredits: user.lifetimeCredits + coverUrls.length,
    },
  });

  return {
    coverUrls,
    creditsUsed: coverUrls.length,
    creditsRemaining: user.aiCredits - coverUrls.length,
  };
}
