import { z } from "zod";
import { publicProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import jwt from "jsonwebtoken";

export const getModuleStats = publicProcedure
  .input(
    z.object({
      authToken: z.string(),
    })
  )
  .query(async ({ input }) => {
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

    // Get projects with agent assignments
    const projectsWithAgents = await db.project.findMany({
      where: {
        userId,
        agentId: { not: null },
      },
      include: {
        agent: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    const agentAssignments = projectsWithAgents.map((project) => ({
      projectId: project.id,
      projectTitle: project.title,
      agentName: project.agent?.name || "Unknown",
      agentType: project.agent?.type || "unknown",
    }));

    // Get recent module runs (projects that were recently updated)
    const recentProjects = await db.project.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    const recentRuns = recentProjects
      .filter((p) => p.lastRunAt)
      .map((project) => ({
        projectId: project.id,
        projectTitle: project.title,
        timestamp: project.lastRunAt!.toISOString(),
        status: project.healthStatus === "active" ? "completed" : project.healthStatus,
      }));

    // Calculate trending workflows (most used categories)
    const categoryStats = await db.project.groupBy({
      by: ["workflowCategory"],
      where: {
        userId,
        workflowCategory: { not: null },
      },
      _count: true,
    });

    const trendingWorkflows = categoryStats
      .map((stat) => ({
        name: `${stat.workflowCategory} Workflow`,
        category: stat.workflowCategory || "Unknown",
        usageCount: stat._count,
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);

    return {
      agentAssignments,
      recentRuns,
      trendingWorkflows,
    };
  });
