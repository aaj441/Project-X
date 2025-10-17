import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import jwt from "jsonwebtoken";

export const assignAgent = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      projectId: z.number(),
      agentId: z.number().nullable(),
    })
  )
  .mutation(async ({ input }) => {
    // Verify token and get user
    let userId: number;
    try {
      const decoded = jwt.verify(
        input.authToken,
        process.env.JWT_SECRET || "your-secret-key"
      ) as { userId: number };
      userId = decoded.userId;
    } catch {
      throw new Error("Invalid authentication token");
    }

    // Verify project ownership
    const project = await db.project.findUnique({
      where: { id: input.projectId },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    if (project.userId !== userId) {
      throw new Error("You don't have permission to modify this project");
    }

    // Verify agent exists if agentId is provided
    if (input.agentId !== null) {
      const agent = await db.agent.findUnique({
        where: { id: input.agentId },
      });

      if (!agent) {
        throw new Error("Agent not found");
      }
    }

    // Update project with agent assignment
    const updatedProject = await db.project.update({
      where: { id: input.projectId },
      data: {
        agentId: input.agentId,
      },
      include: {
        agent: true,
        _count: {
          select: {
            chapters: true,
            exports: true,
          },
        },
      },
    });

    return updatedProject;
  });
