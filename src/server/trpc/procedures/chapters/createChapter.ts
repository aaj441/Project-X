import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "../auth/verifyToken";

export const createChapter = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      projectId: z.number(),
      title: z.string().min(1),
      content: z.string().default(""),
    })
  )
  .mutation(async ({ input }) => {
    const userId = await verifyToken(input.authToken);

    // Verify project ownership
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

    // Get the highest order number
    const lastChapter = await db.chapter.findFirst({
      where: { projectId: input.projectId },
      orderBy: { order: "desc" },
    });

    const order = lastChapter ? lastChapter.order + 1 : 1;

    const chapter = await db.chapter.create({
      data: {
        projectId: input.projectId,
        title: input.title,
        content: input.content,
        order,
      },
    });

    return chapter;
  });
