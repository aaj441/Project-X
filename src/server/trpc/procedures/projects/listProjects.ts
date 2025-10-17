import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "../auth/verifyToken";

export const listProjects = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
    })
  )
  .query(async ({ input }) => {
    const userId = await verifyToken(input.authToken);

    const projects = await db.project.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            chapters: true,
            exports: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return projects;
  });
