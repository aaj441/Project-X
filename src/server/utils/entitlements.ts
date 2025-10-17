import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";

export type SubscriptionTier = "FREE" | "PRO" | "ENTERPRISE";

export const TIER_LIMITS = {
  FREE: {
    maxProjects: 3,
    maxExportsPerMonth: 5,
    maxChaptersPerProject: 20,
    aiCreditsPerMonth: 10,
    canExportPDF: false,
    canExportEPUB: true,
    canExportMOBI: false,
    hasWatermark: true,
    canAccessTemplateMarketplace: false,
    canAccessPremiumTemplates: false,
    maxStorageVersions: 3,
  },
  PRO: {
    maxProjects: 20,
    maxExportsPerMonth: 50,
    maxChaptersPerProject: 100,
    aiCreditsPerMonth: 100,
    canExportPDF: true,
    canExportEPUB: true,
    canExportMOBI: true,
    hasWatermark: false,
    canAccessTemplateMarketplace: true,
    canAccessPremiumTemplates: true,
    maxStorageVersions: 20,
  },
  ENTERPRISE: {
    maxProjects: -1, // unlimited
    maxExportsPerMonth: -1, // unlimited
    maxChaptersPerProject: -1, // unlimited
    aiCreditsPerMonth: 500,
    canExportPDF: true,
    canExportEPUB: true,
    canExportMOBI: true,
    hasWatermark: false,
    canAccessTemplateMarketplace: true,
    canAccessPremiumTemplates: true,
    maxStorageVersions: -1, // unlimited
  },
} as const;

export async function checkAndConsumeAICredits(
  userId: number,
  creditsRequired: number = 1
): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { aiCredits: true, subscriptionTier: true },
  });

  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User not found",
    });
  }

  if (user.aiCredits < creditsRequired) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Insufficient AI credits. You need ${creditsRequired} credits but only have ${user.aiCredits}. Please upgrade your subscription or purchase more credits.`,
    });
  }

  // Deduct credits
  await db.user.update({
    where: { id: userId },
    data: {
      aiCredits: {
        decrement: creditsRequired,
      },
    },
  });
}

export async function checkTierEntitlement(
  userId: number,
  requiredTier: SubscriptionTier
): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true, subscriptionExpiresAt: true },
  });

  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User not found",
    });
  }

  // Check if subscription is expired
  if (user.subscriptionExpiresAt && user.subscriptionExpiresAt < new Date()) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Your subscription has expired. Please renew to continue using premium features.",
    });
  }

  const tierOrder: SubscriptionTier[] = ["FREE", "PRO", "ENTERPRISE"];
  const userTierIndex = tierOrder.indexOf(user.subscriptionTier as SubscriptionTier);
  const requiredTierIndex = tierOrder.indexOf(requiredTier);

  if (userTierIndex < requiredTierIndex) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `This feature requires a ${requiredTier} subscription. Please upgrade to continue.`,
    });
  }
}

export async function getUserTierLimits(userId: number) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true, subscriptionExpiresAt: true },
  });

  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User not found",
    });
  }

  // If subscription is expired, return FREE tier limits
  if (user.subscriptionExpiresAt && user.subscriptionExpiresAt < new Date()) {
    return TIER_LIMITS.FREE;
  }

  return TIER_LIMITS[user.subscriptionTier as SubscriptionTier] || TIER_LIMITS.FREE;
}

export async function checkProjectCountLimit(userId: number): Promise<void> {
  const limits = await getUserTierLimits(userId);
  
  if (limits.maxProjects === -1) {
    return; // unlimited
  }

  const projectCount = await db.project.count({
    where: { userId },
  });

  if (projectCount >= limits.maxProjects) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `You have reached your project limit of ${limits.maxProjects}. Please upgrade to create more projects.`,
    });
  }
}

export async function checkExportFormatEntitlement(
  userId: number,
  format: string
): Promise<boolean> {
  const limits = await getUserTierLimits(userId);
  
  switch (format.toLowerCase()) {
    case "pdf":
      return limits.canExportPDF;
    case "epub":
      return limits.canExportEPUB;
    case "mobi":
      return limits.canExportMOBI;
    default:
      return false;
  }
}
