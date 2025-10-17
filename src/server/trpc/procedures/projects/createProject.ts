import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "../auth/verifyToken";
import { checkProjectCountLimit } from "~/server/utils/entitlements";

export const createProject = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      title: z.string().min(1),
      description: z.string().optional(),
      genre: z.string(),
      language: z.string().default("English"),
      workflowCategory: z.string().default("Content"),
      coverImage: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const userId = await verifyToken(input.authToken);

    // Check if user has reached their project limit
    await checkProjectCountLimit(userId);

    const project = await db.project.create({
      data: {
        userId,
        title: input.title,
        description: input.description,
        genre: input.genre,
        language: input.language,
        workflowCategory: input.workflowCategory,
        coverImage: input.coverImage,
      },
    });

    return project;
  });
