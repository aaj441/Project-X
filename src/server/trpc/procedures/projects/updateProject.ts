import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "../auth/verifyToken";

export const updateProject = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      projectId: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.string().optional(),
      coverImage: z.string().optional(),
      // KDP Metadata fields
      isbn: z.string().optional(),
      authorName: z.string().optional(),
      publisherName: z.string().optional(),
      publicationDate: z.string().optional(), // will be converted to DateTime
      categories: z.string().optional(), // JSON string
      keywords: z.string().optional(), // JSON string
      seriesName: z.string().optional(),
      seriesNumber: z.number().optional(),
      price: z.number().optional(),
      currency: z.string().optional(),
      ageRangeMin: z.number().optional(),
      ageRangeMax: z.number().optional(),
      enableDRM: z.boolean().optional(),
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

    const updated = await db.project.update({
      where: { id: input.projectId },
      data: {
        title: input.title,
        description: input.description,
        status: input.status,
        coverImage: input.coverImage,
        // KDP Metadata fields
        isbn: input.isbn,
        authorName: input.authorName,
        publisherName: input.publisherName,
        publicationDate: input.publicationDate ? new Date(input.publicationDate) : undefined,
        categories: input.categories,
        keywords: input.keywords,
        seriesName: input.seriesName,
        seriesNumber: input.seriesNumber,
        price: input.price,
        currency: input.currency,
        ageRangeMin: input.ageRangeMin,
        ageRangeMax: input.ageRangeMax,
        enableDRM: input.enableDRM,
      },
    });

    return updated;
  });
