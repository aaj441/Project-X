import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "~/server/trpc/procedures/auth/verifyToken";
import { db } from "~/server/db";
import { TRPCError } from "@trpc/server";
import { TIER_LIMITS } from "~/server/utils/entitlements";

export const upgradeSubscription = baseProcedure
  .input(
    z.object({
      token: z.string(),
      newTier: z.enum(["PRO", "ENTERPRISE"]),
      // In a real implementation, this would include payment details
      // paymentMethodId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const userId = await verifyToken(input.token);

    const currentUser = await db.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    });

    if (!currentUser) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Prevent downgrading (for now)
    const tierOrder = ["FREE", "PRO", "ENTERPRISE"];
    const currentIndex = tierOrder.indexOf(currentUser.subscriptionTier);
    const newIndex = tierOrder.indexOf(input.newTier);

    if (newIndex <= currentIndex) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot downgrade subscription through this endpoint",
      });
    }

    // TODO: In a real implementation, process payment here using Stripe or similar

    // Calculate subscription expiration (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Get monthly credits for new tier
    const monthlyCredits = TIER_LIMITS[input.newTier].aiCreditsPerMonth;

    const user = await db.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: input.newTier,
        subscriptionExpiresAt: expiresAt,
        aiCredits: {
          increment: monthlyCredits, // Add monthly credits immediately
        },
      },
      select: {
        subscriptionTier: true,
        aiCredits: true,
        subscriptionExpiresAt: true,
      },
    });

    return {
      success: true,
      subscriptionTier: user.subscriptionTier,
      aiCredits: user.aiCredits,
      subscriptionExpiresAt: user.subscriptionExpiresAt?.toISOString() || null,
    };
  });
