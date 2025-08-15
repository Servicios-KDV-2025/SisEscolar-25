import { v } from "convex/values";
import schema from "./schema";
import {
  internalMutation,
  internalQuery,
} from "./_generated/server";

const assignmentFields = schema.tables.assignment.validator.fields;

export const create = internalMutation({
  args: assignmentFields,
  handler: (ctx, args) => ctx.db.insert("assignment", args),
});

export const read = internalQuery({
  args: { id: v.id("assignment") },
  handler: (ctx, args) => ctx.db.get(args.id),
});

export const update = internalMutation({
  args: {
    id: v.id("assignment"),
    patch: v.object(
      // Permite actualizar cualquier campo de la tabla
      Object.fromEntries(
        Object.entries(assignmentFields).map(([k, val]) => [k, v.optional(val)])
      )
    ),
  },
  handler: (ctx, args) => ctx.db.patch(args.id, args.patch),
});

export const delete_ = internalMutation({
  args: { id: v.id("assignment") },
  handler: (ctx, args) => ctx.db.delete(args.id),
});