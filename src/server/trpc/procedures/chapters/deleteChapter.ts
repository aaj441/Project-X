import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "../auth/verifyToken";

export const deleteChapter = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      chapterId: z.number(),
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

    await db.chapter.delete({
      where: { id: input.chapterId },
    });

    return { success: true };
  });
