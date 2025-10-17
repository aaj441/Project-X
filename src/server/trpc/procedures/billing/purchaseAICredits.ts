import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "~/server/trpc/procedures/auth/verifyToken";
import { db } from "~/server/db";
import { TRPCError } from "@trpc/server";

export const purchaseAICredits = baseProcedure
  .input(
    z.object({
      token: z.string(),
      amount: z.number().min(1).max(1000), // Number of credits to purchase
      // In a real implementation, this would include payment details
      // paymentMethodId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const userId = await verifyToken(input.token);

    // TODO: In a real implementation, process payment here using Stripe or similar
    // For now, this is a placeholder that just adds credits

    const user = await db.user.update({
      where: { id: userId },
      data: {
        aiCredits: {
          increment: input.amount,
        },
        lifetimeCredits: {
          increment: input.amount,
        },
      },
      select: {
        aiCredits: true,
        lifetimeCredits: true,
      },
    });

    return {
      success: true,
      newBalance: user.aiCredits,
      lifetimeCredits: user.lifetimeCredits,
    };
  });
