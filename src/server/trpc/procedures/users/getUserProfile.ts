import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "../auth/verifyToken";

export const getUserProfile = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
    })
  )
  .query(async ({ input }) => {
    const userId = await verifyToken(input.authToken);

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        uxProfile: true,
        preferences: true,
        subscriptionTier: true,
        aiCredits: true,
        subscriptionExpiresAt: true,
        lifetimeCredits: true,
        streakCount: true,
        longestStreak: true,
        lastActivityDate: true,
        totalWordsWritten: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return {
      user: {
        ...user,
        preferences: user.preferences ? JSON.parse(user.preferences) : null,
      },
    };
  });
