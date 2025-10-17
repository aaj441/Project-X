import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "../auth/verifyToken";

export const updateChapter = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      chapterId: z.number(),
      title: z.string().optional(),
      content: z.string().optional(),
      status: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const userId = await verifyToken(input.authToken);

    // Verify ownership through project
    const chapter = await db.chapter.findUnique({
      where: { id: input.chapterId },
      include: { project: true },
    });

    if (!chapter || chapter.project.userId !== userId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Chapter not found",
      });
    }

    const updated = await db.chapter.update({
      where: { id: input.chapterId },
      data: {
        title: input.title,
        content: input.content,
        status: input.status,
      },
    });

    return updated;
  });
