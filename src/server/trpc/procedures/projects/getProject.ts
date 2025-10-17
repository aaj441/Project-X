import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "../auth/verifyToken";

export const getProject = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      projectId: z.number(),
    })
  )
  .query(async ({ input }) => {
    const userId = await verifyToken(input.authToken);

    const project = await db.project.findFirst({
      where: {
        id: input.projectId,
        userId,
      },
      include: {
        chapters: {
          orderBy: { order: "asc" },
        },
        exports: {
          orderBy: { generatedAt: "desc" },
        },
      },
    });

    if (!project) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Project not found",
      });
    }

    return project;
  });
