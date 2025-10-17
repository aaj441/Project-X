import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import jwt from "jsonwebtoken";

export const listAgents = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      type: z.string().optional(), // Filter by agent type
    })
  )
  .query(async ({ input }) => {
    // Verify token
    try {
      jwt.verify(input.authToken, process.env.JWT_SECRET || "your-secret-key");
    } catch {
      throw new Error("Invalid authentication token");
    }

    // Fetch agents
    const agents = await db.agent.findMany({
      where: input.type ? { type: input.type } : undefined,
      orderBy: { name: "asc" },
    });

    return agents;
  });
