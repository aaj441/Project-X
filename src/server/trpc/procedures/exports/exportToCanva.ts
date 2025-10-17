import { z } from "zod";
import { publicProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import jwt from "jsonwebtoken";

export const exportToCanva = publicProcedure
  .input(
    z.object({
      authToken: z.string(),
      projectId: z.number(),
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

    // Fetch project with all details
    const project = await db.project.findUnique({
      where: { id: input.projectId },
      include: {
        chapters: {
          orderBy: { order: "asc" },
        },
        agent: true,
      },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    if (project.userId !== userId) {
      throw new Error("You don't have permission to export this project");
    }

    // Generate Canva-compatible export data
    const canvaExport = {
      version: "1.0",
      type: "ebook-template",
      metadata: {
        title: project.title,
        description: project.description,
        genre: project.genre,
        language: project.language,
        workflowCategory: project.workflowCategory,
        author: project.authorName || "Unknown Author",
        exportedAt: new Date().toISOString(),
      },
      design: {
        coverImage: project.coverImage,
        theme: {
          primaryColor: "#6366f1", // Indigo
          secondaryColor: "#a855f7", // Purple
          accentColor: "#ec4899", // Pink
        },
      },
      content: {
        chapters: project.chapters.map((chapter) => ({
          title: chapter.title,
          content: chapter.content,
          order: chapter.order,
          wordCount: chapter.wordCount,
        })),
        totalChapters: project.chapters.length,
        totalWords: project.chapters.reduce((sum, ch) => sum + ch.wordCount, 0),
      },
      configuration: {
        status: project.status,
        healthStatus: project.healthStatus,
        agent: project.agent
          ? {
              name: project.agent.name,
              type: project.agent.type,
            }
          : null,
      },
    };

    // Return the export data as a downloadable JSON
    return {
      success: true,
      exportData: canvaExport,
      downloadUrl: `data:application/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(canvaExport, null, 2)
      )}`,
      filename: `${project.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_canva_export.json`,
    };
  });
