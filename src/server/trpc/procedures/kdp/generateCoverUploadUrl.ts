import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "../auth/verifyToken";
import { minioClient, minioBaseUrl } from "~/server/minio";

export const generateCoverUploadUrl = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      projectId: z.number(),
      fileExtension: z.string(), // e.g., "jpg", "png"
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

    // Generate unique filename
    const timestamp = Date.now();
    const objectName = `${input.projectId}-${timestamp}.${input.fileExtension}`;
    
    // Generate presigned URL for upload (valid for 1 hour)
    const uploadUrl = await minioClient.presignedPutObject(
      "cover-images",
      objectName,
      60 * 60
    );

    // Construct public URL where the image will be accessible
    const publicUrl = `${minioBaseUrl}/cover-images/${objectName}`;

    return {
      uploadUrl,
      publicUrl,
    };
  });
