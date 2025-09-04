// convex/assignments.ts
import { query } from "../_generated/server";
import { v } from "convex/values";

// The function is correctly exported and wrapped in `query`.
export const getAssignmentsByClassAndTerm = query({
  args: {
    classCatalogId: v.id("classCatalog"),
    termId: v.id("term"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assignment")
      .withIndex("by_classCatalogId", (q) =>
        q.eq("classCatalogId", args.classCatalogId)
      )
      .filter((q) => q.eq(q.field("termId"), args.termId))
      .collect();
  },
});