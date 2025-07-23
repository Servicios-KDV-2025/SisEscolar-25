import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const applicationTable = defineSchema({
    user: defineTable({
        name: v.string(),
    })
});

export default applicationTable;