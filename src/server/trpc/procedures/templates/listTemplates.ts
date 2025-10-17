import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

export const listTemplates = baseProcedure.query(async () => {
  const templates = await db.template.findMany({
    orderBy: { name: "asc" },
  });

  return templates;
});
