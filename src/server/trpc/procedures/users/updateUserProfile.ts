import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "../auth/verifyToken";

const uxProfileSchema = z.enum([
  "novice",
  "expert",
  "minimalist",
  "fast-publish",
  "adhd-friendly",
]);

const userPreferencesSchema = z.object({
  theme: z.enum(["light", "dark", "auto"]).optional(),
  autoSave: z.boolean().optional(),
  autoSaveInterval: z.number().min(1).max(60).optional(), // seconds
  showTooltips: z.boolean().optional(),
  keyboardShortcuts: z.boolean().optional(),
  aiSuggestions: z.enum(["always", "on-demand", "never"]).optional(),
  focusMode: z.boolean().optional(),
  wordCountGoal: z.number().min(0).optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    achievements: z.boolean().optional(),
    collaboration: z.boolean().optional(),
  }).optional(),
});

export const updateUserProfile = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      uxProfile: uxProfileSchema.optional(),
      preferences: userPreferencesSchema.optional(),
    })
  )
  .mutation(async ({ input }) => {
    const userId = await verifyToken(input.authToken);

    const updateData: any = {};

    if (input.uxProfile) {
      updateData.uxProfile = input.uxProfile;
    }

    if (input.preferences) {
      // Merge with existing preferences
      const existingUser = await db.user.findUnique({
        where: { id: userId },
        select: { preferences: true },
      });

      let existingPreferences = {};
      if (existingUser?.preferences) {
        try {
          existingPreferences = JSON.parse(existingUser.preferences);
        } catch (e) {
          // Invalid JSON, start fresh
        }
      }

      const mergedPreferences = {
        ...existingPreferences,
        ...input.preferences,
      };

      updateData.preferences = JSON.stringify(mergedPreferences);
    }

    if (Object.keys(updateData).length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No update data provided",
      });
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        uxProfile: true,
        preferences: true,
        subscriptionTier: true,
        aiCredits: true,
      },
    });

    return {
      user: {
        ...updatedUser,
        preferences: updatedUser.preferences
          ? JSON.parse(updatedUser.preferences)
          : null,
      },
    };
  });
