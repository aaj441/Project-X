import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "~/server/trpc/procedures/auth/verifyToken";
import { db } from "~/server/db";
import { getUserTierLimits } from "~/server/utils/entitlements";

export const getUserBillingInfo = baseProcedure
  .input(
    z.object({
      token: z.string(),
    })
  )
  .query(async ({ input }) => {
    const userId = await verifyToken(input.token);

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        aiCredits: true,
        subscriptionExpiresAt: true,
        lifetimeCredits: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const limits = await getUserTierLimits(userId);

    // Get usage statistics
    const projectCount = await db.project.count({
      where: { userId },
    });

    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const exportsThisMonth = await db.export.count({
      where: {
        project: {
          userId,
        },
        generatedAt: {
          gte: currentMonth,
        },
      },
    });

    return {
      subscriptionTier: user.subscriptionTier,
      aiCredits: user.aiCredits,
      subscriptionExpiresAt: user.subscriptionExpiresAt?.toISOString() || null,
      lifetimeCredits: user.lifetimeCredits,
      limits,
      usage: {
        projects: projectCount,
        exportsThisMonth,
      },
    };
  });
