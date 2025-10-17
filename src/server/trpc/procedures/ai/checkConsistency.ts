import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "../auth/verifyToken";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { env } from "~/server/env";
import { checkAndConsumeAICredits } from "~/server/utils/entitlements";

export const checkConsistency = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      projectId: z.number(),
    })
  )
  .mutation(async ({ input }) => {
    const userId = await verifyToken(input.authToken);

    // Verify ownership and get all chapters
    const project = await db.project.findFirst({
      where: {
        id: input.projectId,
        userId,
      },
      include: {
        chapters: {
          orderBy: { order: "asc" },
        },
        entities: true,
      },
    });

    if (!project) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Project not found",
      });
    }

    if (project.chapters.length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Project has no chapters to analyze",
      });
    }

    // Check and consume AI credits (1 credit per consistency check)
    await checkAndConsumeAICredits(userId, 1);

    if (!env.OPENROUTER_API_KEY) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "AI service not configured",
      });
    }

    const openrouter = createOpenRouter({
      apiKey: env.OPENROUTER_API_KEY,
    });

    const model = openrouter("openai/gpt-4o");

    // Build chapter summaries for analysis
    const chapterSummaries = project.chapters.map((ch) => ({
      order: ch.order,
      title: ch.title,
      content: ch.content.substring(0, 2000), // First 2000 chars for context
    }));

    const systemPrompt = `You are a meticulous editor who specializes in finding consistency issues, plot holes, and contradictions in manuscripts. You have an exceptional memory for details across hundreds of pages.`;

    const userPrompt = `Analyze this ${project.genre} book for consistency issues. Check for:
1. Character inconsistencies (names, traits, motivations, backstory)
2. Timeline contradictions (events happening out of order, age/date mismatches)
3. Location/setting inconsistencies
4. Factual contradictions (statements that contradict earlier claims)
5. Plot holes (unresolved threads, logic gaps)
6. Tone/voice shifts that seem unintentional

Book Title: ${project.title}
Genre: ${project.genre}

Chapters:
${JSON.stringify(chapterSummaries, null, 2)}

Respond with a JSON object:
{
  "overallConsistency": "excellent" | "good" | "fair" | "poor",
  "issues": [
    {
      "type": "character" | "timeline" | "location" | "fact" | "plot" | "tone",
      "severity": "minor" | "moderate" | "major",
      "description": "Clear description of the issue",
      "chapters": [chapter numbers where issue appears],
      "suggestion": "How to fix it"
    }
  ],
  "entities": [
    {
      "type": "character" | "location" | "fact" | "event",
      "name": "Entity name",
      "firstMention": chapter number,
      "attributes": ["key attributes or facts about this entity"]
    }
  ],
  "strengths": ["What's working well in terms of consistency"],
  "summary": "Overall assessment"
}

Respond with ONLY the JSON object.`;

    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.3,
    });

    // Parse the JSON response
    let analysis;
    try {
      analysis = JSON.parse(text);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to parse consistency analysis",
      });
    }

    // Store extracted entities in database
    if (analysis.entities && analysis.entities.length > 0) {
      // Clear existing entities for this project
      await db.bookEntity.deleteMany({
        where: { projectId: input.projectId },
      });

      // Create new entities
      for (const entity of analysis.entities) {
        const firstChapter = project.chapters.find(
          (ch) => ch.order === entity.firstMention
        );

        await db.bookEntity.create({
          data: {
            projectId: input.projectId,
            type: entity.type,
            name: entity.name,
            attributes: JSON.stringify(entity.attributes),
            firstMentionedChapterId: firstChapter?.id,
          },
        });
      }
    }

    return analysis;
  });
