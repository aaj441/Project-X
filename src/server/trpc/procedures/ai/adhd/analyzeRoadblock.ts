import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "../../auth/verifyToken";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { env } from "~/server/env";

export const analyzeRoadblock = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      projectId: z.number().optional(),
      currentContent: z.string().optional(),
      timeStuck: z.number().optional(), // minutes
      description: z.string().optional(),
    })
  )
  .query(async ({ input }) => {
    const userId = await verifyToken(input.authToken);

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        uxProfile: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    if (!env.OPENROUTER_API_KEY) {
      return {
        analysis: "It looks like you might be stuck. Try taking a short break, or try writing about something else for a few minutes.",
        suggestions: [
          "Take a 5-minute break",
          "Write a different section",
          "Brainstorm with bullet points",
          "Talk it out loud",
        ],
        encouragement: "Remember, getting stuck is part of the creative process!",
      };
    }

    const openrouter = createOpenRouter({
      apiKey: env.OPENROUTER_API_KEY,
    });

    const model = openrouter("openai/gpt-4o-mini");

    // Get project context if available
    let projectContext = "";
    if (input.projectId) {
      const project = await db.project.findFirst({
        where: {
          id: input.projectId,
          userId,
        },
        select: {
          title: true,
          genre: true,
          description: true,
        },
      });

      if (project) {
        projectContext = `Project: ${project.title} (${project.genre})
Description: ${project.description || "N/A"}`;
      }
    }

    const systemPrompt = `You are an ADHD Copilot specialized in helping writers overcome creative roadblocks. You understand:
- Executive dysfunction and decision paralysis
- Perfectionism and fear of "not good enough"
- Hyperfocus crashes and energy management
- The importance of breaking tasks into tiny steps

Provide practical, actionable advice that acknowledges the emotional aspect while focusing on concrete next steps.`;

    const userPrompt = `The user is stuck and needs help moving forward.

${projectContext}

Current situation:
${input.description ? `User says: "${input.description}"` : "User is experiencing writer's block"}
${input.timeStuck ? `They've been stuck for about ${input.timeStuck} minutes` : ""}
${input.currentContent ? `Last thing they wrote:\n"${input.currentContent.slice(-300)}"` : ""}

Provide:
1. A brief analysis of what might be causing the roadblock (2-3 sentences)
2. 4-5 specific, actionable suggestions to try (each should be a short, concrete action)
3. A brief encouraging statement

Format your response as JSON:
{
  "analysis": "brief analysis here",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4"],
  "encouragement": "encouraging statement here"
}`;

    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
      maxTokens: 400,
    });

    // Parse JSON response
    try {
      const result = JSON.parse(text);
      return result;
    } catch (e) {
      // If JSON parsing fails, return a default response
      return {
        analysis: "It seems like you might be overthinking things. Sometimes the best way forward is to just write something - anything - even if it's not perfect.",
        suggestions: [
          "Write the worst possible version first",
          "Skip this part and write what comes next",
          "Set a 10-minute timer and write without stopping",
          "Describe what you want to write in plain language",
          "Take a 5-minute walk and come back",
        ],
        encouragement: "You've got this! Every writer gets stuck sometimes.",
      };
    }
  });
