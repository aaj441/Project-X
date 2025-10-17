import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "../../auth/verifyToken";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { env } from "~/server/env";

export const getEncouragement = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      context: z.enum([
        "writing_session_start",
        "writing_session_active",
        "distraction_detected",
        "milestone_reached",
        "stuck_detected",
        "break_reminder",
        "general_check_in",
      ]),
      sessionDuration: z.number().optional(), // minutes
      wordsWritten: z.number().optional(),
      currentTask: z.string().optional(),
    })
  )
  .query(async ({ input }) => {
    const userId = await verifyToken(input.authToken);

    // Get user profile and preferences
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        uxProfile: true,
        preferences: true,
        streakCount: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Only generate encouragement for ADHD-friendly profile users
    // (but can be extended to other profiles)
    const isAdhdFriendly = user.uxProfile === "adhd-friendly";

    if (!env.OPENROUTER_API_KEY) {
      // Return a simple default message if AI is not configured
      return {
        message: "You're doing great! Keep up the good work!",
        tone: "encouraging" as const,
        actionable: false,
      };
    }

    const openrouter = createOpenRouter({
      apiKey: env.OPENROUTER_API_KEY,
    });

    const model = openrouter("openai/gpt-4o-mini"); // Use mini for faster, cheaper responses

    // Parse preferences
    let preferences: any = {};
    try {
      if (user.preferences) {
        preferences = typeof user.preferences === "string" 
          ? JSON.parse(user.preferences) 
          : user.preferences;
      }
    } catch (e) {
      // Ignore parsing errors
    }

    // Build context-aware prompt
    const contextDescriptions = {
      writing_session_start: "The user is just starting a writing session",
      writing_session_active: `The user has been writing for ${input.sessionDuration || 0} minutes and has written ${input.wordsWritten || 0} words`,
      distraction_detected: "The user seems to be distracted or off-task",
      milestone_reached: `The user just reached a milestone: ${input.currentTask || "completed a task"}`,
      stuck_detected: "The user seems stuck or experiencing writer's block",
      break_reminder: `The user has been working for ${input.sessionDuration || 30} minutes`,
      general_check_in: "Just a friendly check-in with the user",
    };

    const systemPrompt = `You are an ADHD Copilot - a friendly, encouraging AI companion designed to help people with ADHD stay focused and productive. Your personality is:
- Warm, supportive, and non-judgmental
- Upbeat but not overwhelming
- Understanding of ADHD challenges (executive dysfunction, hyperfocus, time blindness)
- Practical and action-oriented
- Uses gentle humor when appropriate
- Celebrates small wins

${isAdhdFriendly ? "This user has selected the ADHD-friendly profile, so be especially mindful of their needs." : ""}

Respond with a SHORT message (1-3 sentences max) that is appropriate for the context. Be genuine and specific, not generic.`;

    const userPrompt = `Context: ${contextDescriptions[input.context]}
User name: ${user.name}
Current streak: ${user.streakCount} days
${input.currentTask ? `Current task: ${input.currentTask}` : ""}

Generate a brief, encouraging message that:
1. Acknowledges their current situation
2. Provides gentle motivation or guidance
3. Is specific to their context (not generic)
4. Feels personal and supportive

Keep it SHORT - 1-3 sentences maximum.`;

    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.8, // Higher temperature for more varied, natural responses
      maxTokens: 150,
    });

    // Determine tone and actionability
    const tone = input.context === "milestone_reached" 
      ? "celebratory" 
      : input.context === "stuck_detected" || input.context === "distraction_detected"
      ? "supportive"
      : "encouraging";

    const actionable = input.context === "break_reminder" || input.context === "stuck_detected";

    return {
      message: text.trim(),
      tone,
      actionable,
      context: input.context,
    };
  });
