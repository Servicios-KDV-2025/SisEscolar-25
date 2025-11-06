import { internal } from "../_generated/api";
import { mutation, query } from "./../_generated/server";
import { v } from "convex/values";

export const getBillingsConfigs = query({
  args: {
    schoolId: v.id("school")
  },
  handler: async (ctx, args) => {
    let configs = await ctx.db
      .query("billingConfig")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    return configs.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const createBillingConfig = mutation({
  args: {
    schoolId: v.id("school"),
    schoolCycleId: v.id("schoolCycle"),
    scope: v.union(
      v.literal("all_students"),
      v.literal("specific_groups"),
      v.literal("specific_grades"),
      v.literal("specific_students")
    ),
    targetGroup: v.optional(v.array(v.id("group"))),
    targetGrade: v.optional(v.array(v.string())),
    targetStudent: v.optional(v.array(v.id("student"))),
    recurrence_type: v.union(
      v.literal("cuatrimestral"),
      v.literal("semestral"),
      v.literal("sabatino"),
      v.literal("mensual"),
      v.literal("diario"),
      v.literal("semanal"),
      v.literal("anual"),
      v.literal("unico")
    ),
    type: v.union(
      v.literal("inscripción"),
      v.literal("colegiatura"),
      v.literal("examen"),
      v.literal("material-escolar"),
      v.literal("seguro-vida"),
      v.literal("plan-alimenticio"),
      v.literal("otro")
    ),
    amount: v.number(),
    ruleIds: v.optional(v.array(v.id("billingRule"))),
    startDate: v.number(),
    endDate: v.number(),
    createdBy: v.id("user"),
    updatedBy: v.id("user"),
    status: v.union(
      v.literal("required"),
      v.literal("optional"),
      v.literal("inactive")
    ),
  },
  handler: async (ctx, args) => {
    if (args.amount < 0) {
      throw new Error("El monto no puede ser negativo");
    }

    if (args.startDate > args.endDate) {
      throw new Error("La fecha de inicio debe ser anterior a la fecha de fin");
    }

    if (args.scope === "specific_groups" && !args.targetGroup?.length) {
      throw new Error("Debes especificar al menos un grupo");
    }

    if (args.scope === "specific_grades" && !args.targetGrade?.length) {
      throw new Error("Debes especificar al menos un grado");
    }

    if (args.scope === "specific_students" && !args.targetStudent?.length) {
      throw new Error("Debes especificar al menos un estudiante");
    }

    switch (args.scope) {
      case 'all_students':
        args.targetGrade = [];
        args.targetGroup = [];
        args.targetStudent = [];
        break;
      case 'specific_grades':
        args.targetGroup = [];
        args.targetStudent = [];
        break;
      case 'specific_groups':
        args.targetGrade = [];
        args.targetStudent = [];
        break;
      case 'specific_students':
        args.targetGrade = [];
        args.targetGroup = [];
        break;
    }

    const now = Date.now();

    const configId = await ctx.db.insert("billingConfig", {
      schoolId: args.schoolId,
      schoolCycleId: args.schoolCycleId,
      scope: args.scope,
      targetGroup: args.targetGroup,
      targetGrade: args.targetGrade,
      targetStudent: args.targetStudent,
      recurrence_type: args.recurrence_type,
      type: args.type,
      amount: args.amount,
      ruleIds: args.ruleIds,
      startDate: args.startDate,
      endDate: args.endDate,
      createdBy: args.createdBy,
      updatedBy: args.updatedBy,
      status: args.status,
      createdAt: now,
      updatedAt: now,
    });

    const billings: unknown = await ctx.runMutation(internal.functions.billing.generateBillingsForConfig, { billingConfigId: configId })
    await ctx.runMutation(internal.functions.billingRule.applyBillingPolicies, {});
    return billings;
  },
});

export const updateBillingConfig = mutation({
  args: {
    id: v.id("billingConfig"),
    schoolId: v.id("school"),
    schoolCycleId: v.optional(v.id("schoolCycle")),
    scope: v.optional(v.union(
      v.literal("all_students"),
      v.literal("specific_groups"),
      v.literal("specific_grades"),
      v.literal("specific_students")
    )),
    targetGroup: v.optional(v.array(v.id("group"))),
    targetGrade: v.optional(v.array(v.string())),
    targetStudent: v.optional(v.array(v.id("student"))),
    recurrence_type: v.optional(v.union(
      v.literal("cuatrimestral"),
      v.literal("semestral"),
      v.literal("sabatino"),
      v.literal("mensual"),
      v.literal("diario"),
      v.literal("semanal"),
      v.literal("anual"),
      v.literal("unico")
    )),
    type: v.optional(v.union(
      v.literal("inscripción"),
      v.literal("colegiatura"),
      v.literal("examen"),
      v.literal("material-escolar"),
      v.literal("seguro-vida"),
      v.literal("plan-alimenticio"),
      v.literal("otro")
    )),
    amount: v.optional(v.number()),
    ruleIds: v.optional(v.array(v.id("billingRule"))),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal("required"),
      v.literal("optional"),
      v.literal("inactive")
    )),
    updatedBy: v.id("user"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);

    if (!existing) {
      throw new Error("Configuración de cobro no encontrada");
    }

    if (existing.schoolId !== args.schoolId) {
      throw new Error("No tienes permiso para modificar esta configuración");
    }

    const newAmount = args.amount ?? existing.amount;
    if (newAmount < 0) {
      throw new Error("El monto no puede ser negativo");
    }

    const newStartDate = args.startDate ?? existing.startDate;
    const newEndDate = args.endDate ?? existing.endDate;
    if (newStartDate > newEndDate) {
      throw new Error("La fecha de inicio debe ser anterior a la fecha de fin");
    }
    const updateData: Partial<typeof existing> = {
      updatedAt: Date.now(),
      updatedBy: args.updatedBy,
    };

    if (args.schoolCycleId !== undefined) updateData.schoolCycleId = args.schoolCycleId;
    if (args.scope !== undefined) updateData.scope = args.scope;
    if (args.targetGroup !== undefined) updateData.targetGroup = args.targetGroup;
    if (args.targetGrade !== undefined) updateData.targetGrade = args.targetGrade;
    if (args.targetStudent !== undefined) updateData.targetStudent = args.targetStudent;
    if (args.recurrence_type !== undefined) updateData.recurrence_type = args.recurrence_type;
    if (args.type !== undefined) updateData.type = args.type;
    if (args.amount !== undefined) updateData.amount = args.amount;
    if (args.ruleIds !== undefined) updateData.ruleIds = args.ruleIds;
    if (args.startDate !== undefined) updateData.startDate = args.startDate;
    if (args.endDate !== undefined) updateData.endDate = args.endDate;
    if (args.status !== undefined) updateData.status = args.status;

    switch (args.scope) {
      case 'all_students':
        updateData.targetGrade = [];
        updateData.targetGroup = [];
        updateData.targetStudent = [];
        break;
      case 'specific_grades':
        updateData.targetGroup = [];
        updateData.targetStudent = [];
        break;
      case 'specific_groups':
        updateData.targetGrade = [];
        updateData.targetStudent = [];
        break;
      case 'specific_students':
        updateData.targetGrade = [];
        updateData.targetGroup = [];
        break;
    }

    await ctx.db.patch(args.id, updateData);

    const billings: unknown = await ctx.runMutation(internal.functions.billing.generateBillingsForConfig, { billingConfigId: args.id });
    await ctx.runMutation(internal.functions.billingRule.applyBillingPolicies, {});

    return billings;
  },
});

export const deleteBillingConfig = mutation({
  args: {
    id: v.id("billingConfig"),
    schoolId: v.id("school"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);

    if (!existing) {
      throw new Error("Configuración de cobro no encontrada");
    }

    if (existing.schoolId !== args.schoolId) {
      throw new Error("No tienes permiso para eliminar esta configuración");
    }

    await ctx.db.patch(args.id, {
      status: "inactive",
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

