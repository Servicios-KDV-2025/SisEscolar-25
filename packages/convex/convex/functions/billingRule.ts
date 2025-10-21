import { v } from "convex/values";
import { mutation, query, internalMutation } from "../_generated/server";
import { Doc } from "../_generated/dataModel";
import { internal } from "../_generated/api";

export const getAllBillingRulesBySchool = query({
    args: {
        schoolId: v.id('school')
    },
    handler: async (ctx, args) => {
        const school = await ctx.db.get(args.schoolId);
        if (!school) {
            throw new Error('La escuela no existe');
        }

        return await ctx.db
            .query("billingRule")
            .withIndex("by_school", q => q.eq("schoolId", args.schoolId))
            .collect();
    },
});

export const getBillingRuleByIdAndSchool = query({
    args: {
        _id: v.id('billingRule'),
        schoolId: v.id('school')
    },
    handler: async (ctx, args) => {
        const billingRule = await ctx.db.get(args._id);
        const school = await ctx.db.get(args.schoolId);
        if (!billingRule || !school) {
            throw new Error("La política no se encuentra o no pertenece a esta escuela.");
        }
        return billingRule;
    }
});

export const createBillingRuleWithSchoolId = mutation({
    args: {
        schoolId: v.id("school"),
        name: v.string(),
        description: v.optional(v.string()),
        type: v.union(
            v.literal("late_fee"),
            v.literal("early_discount"),
            v.literal("cutoff")
        ),
        scope: v.union(
            v.literal("estandar"),
            v.literal("becarios"),
            v.literal("all_students")
        ),
        status: v.union(v.literal("active"), v.literal("inactive")),
        lateFeeType: v.optional(v.union(v.literal("percentage"), v.literal("fixed"))),
        lateFeeValue: v.optional(v.number()),
        startDay: v.optional(v.number()),
        endDay: v.optional(v.number()),
        maxUses: v.optional(v.number()),
        usedCount: v.optional(v.number()),
        cutoffAfterDays: v.optional(v.number()),
        createdBy: v.id("user"),
        updatedBy: v.id("user"),
    },
    handler: async (ctx, args) => {
        const existSchool = await ctx.db.get(args.schoolId);
        if (!existSchool) {
            throw new Error(
                "No se pudo crear la política."
            );
        }

        const existingBillingRule = await ctx.db
            .query("billingRule")
            .withIndex("by_school", q =>
                q.eq("schoolId", args.schoolId)
            )
            .filter(q => q.eq(q.field("name"), args.name))
            .first();

        if (existingBillingRule) {
            throw new Error("Ya existe una política con el mismo nombre en esta escuela");
        }

        switch (args.type) {
            case 'late_fee':
            case 'early_discount':
                args.cutoffAfterDays = undefined;
                break;
            case 'cutoff':
                args.lateFeeType = undefined;
                args.lateFeeValue = undefined;
                args.startDay = undefined;
                args.endDay = undefined;
                break;
        }

        const now = Date.now();
        return await ctx.db.insert("billingRule", {
            ...args,
            createdAt: now,
            updatedAt: now,
        });
    }
});

export const updateBillingRuleWithSchoolId = mutation({
    args: {
        _id: v.id("billingRule"),
        schoolId: v.id("school"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        type: v.optional(v.union(
            v.literal("late_fee"),
            v.literal("early_discount"),
            v.literal("cutoff")
        )),
        scope: v.optional(v.union(
            v.literal("estandar"),
            v.literal("becarios"),
            v.literal("all_students")
        )),
        status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
        lateFeeType: v.optional(v.union(v.literal("percentage"), v.literal("fixed"))),
        lateFeeValue: v.optional(v.number()),
        startDay: v.optional(v.number()),
        endDay: v.optional(v.number()),
        maxUses: v.optional(v.number()),
        usedCount: v.optional(v.number()),
        cutoffAfterDays: v.optional(v.number()),
        updatedBy: v.id("user"),
        updatedAt: v.number(),
    },
    handler: async (ctx, args) => {
        const { _id, schoolId, ...data } = args;
        switch (data.type) {
            case 'late_fee':
            case 'early_discount':
                data.cutoffAfterDays = undefined;
                break;
            case 'cutoff':
                data.lateFeeType = undefined;
                data.lateFeeValue = undefined;
                data.startDay = undefined;
                data.endDay = undefined;
                break;
        }

        const existBillingRule = await ctx.db.get(_id);
        if (!existBillingRule || existBillingRule.schoolId !== schoolId) {
            throw new Error(
                "BillingRule no se encuentra o no pertenece a la escuela especificada."
            );
        }

        await ctx.db.patch(_id, data);
        await ctx.runMutation(internal.functions.billingRule.applyBillingPolicies);
        return await ctx.db.get(_id);
    }
});

export const deleteBillingRuleWithSchoolId = mutation({
    args: {
        _id: v.id("billingRule"),
        schoolId: v.id("school")
    },
    handler: async (ctx, args) => {
        const { _id, schoolId, ...data } = args;

        const existBillingRule = await ctx.db.get(_id);
        if (!existBillingRule || existBillingRule.schoolId !== schoolId) {
            throw new Error(
                "BillingRule no se encuentra o no pertenece a la escuela especificada."
            );
        }
        await ctx.db.delete(args._id);
        await ctx.runMutation(internal.functions.billingRule.applyBillingPolicies);
        return {
            deleted: true,
            message: 'BillingRule borrado correctamente'
        };
    },
});

export const applyBillingPolicies = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const billingConfigs = await ctx.db
            .query("billingConfig")
            .collect();

        console.log(`Procesando ${billingConfigs.length} configuraciones de cobro`);

        for (const config of billingConfigs) {
            await processConfigBillings(ctx, config, now);
        }
    },
});

async function processConfigBillings(
    ctx: any,
    config: Doc<"billingConfig">,
    now: number
) {
    const rules = config.ruleIds
        ? await Promise.all(config.ruleIds.map((id) => ctx.db.get(id)))
        : []; 

    const activeRules = rules.filter((rule) => rule && rule.status === "active");

    const billings = await ctx.db
        .query("billing")
        .withIndex("by_billingConfig", (q: any) => q.eq("billingConfigId", config._id))
        .filter((q: any) => q.neq(q.field("status"), "Pago cumplido"))
        .collect();

    console.log(`Procesando ${billings.length} cobros para config ${config._id}`);

    for (const billing of billings) {
        await applyPoliciesToBilling(ctx, billing, config, activeRules, now);
    }
}

async function applyPoliciesToBilling(
    ctx: any,
    billing: Doc<"billing">,
    config: Doc<"billingConfig">,
    rules: Doc<"billingRule">[],
    now: number
) {
    const student = await ctx.db.get(billing.studentId);
    if (!student) return;

    const appliedDiscounts: Array<{
        ruleId?: any;
        reason: string;
        amount: number;
        percentage?: number;
        type: "scholarship" | "rule";
    }> = [];

    let totalDiscount = 0;
    let lateFee = 0;
    let lateFeeRuleId = undefined;

    const scholarshipDiscount = calculateScholarshipDiscount(student, billing.amount);
    if (scholarshipDiscount.amount > 0) {
        appliedDiscounts.push(scholarshipDiscount);
        totalDiscount += scholarshipDiscount.amount;
    }

    for (const rule of rules) {
        if (!ruleAppliesToStudent(rule, student)) continue;

        if (rule.type === "early_discount") {

            const discount = await applyEarlyDiscount(rule, billing, now, config.startDate);
            if (discount.amount > 0) {
                appliedDiscounts.push(discount);
                totalDiscount += discount.amount;
            }
        } else if (rule.type === "late_fee") {
            const fee = applyLateFee(rule, billing, now, config.endDate);
            if (fee > 0) {
                const daysUntilDue = Math.floor((now - config.endDate) / (1000 * 60 * 60 * 24));
                lateFee = fee * daysUntilDue;
                lateFeeRuleId = rule._id;
            }
        }
    }

    const totalAmount = Math.max(0, billing.amount - totalDiscount + lateFee);

    const newStatus = determineStatus(billing, now, totalAmount, config.endDate);

    await ctx.db.patch(billing._id, {
        appliedDiscounts: appliedDiscounts.length > 0 ? appliedDiscounts : undefined,
        totalDiscount: totalDiscount > 0 ? totalDiscount : undefined,
        lateFee: lateFee > 0 ? lateFee : undefined,
        lateFeeRuleId,
        totalAmount,
        status: newStatus,
        updatedAt: now,
    });

    console.log(
        `Billing ${billing._id}: $${billing.amount} - $${totalDiscount} + $${lateFee} = $${totalAmount}`
    );
}

function calculateScholarshipDiscount(
    student: Doc<"student">,
    amount: number
) {
    if (!student.scholarshipType || student.scholarshipType === "none") {
        return { amount: 0, reason: "", type: "scholarship" as const };
    }

    if (student.scholarshipType === "full") {
        return {
            reason: "Beca 100%",
            amount: amount,
            percentage: 100,
            type: "scholarship" as const,
        };
    }

    if (student.scholarshipType === "partial" && student.scholarshipPercentage) {
        return {
            reason: `Beca ${student.scholarshipPercentage}%`,
            amount: amount * (student.scholarshipPercentage / 100),
            percentage: student.scholarshipPercentage,
            type: "scholarship" as const,
        };
    }

    return { amount: 0, reason: "", type: "scholarship" as const };
}

function ruleAppliesToStudent(
    rule: Doc<"billingRule">,
    student: Doc<"student">
): boolean {
    if (rule.scope === "all_students") return true;

    if (rule.scope === "becarios") {
        return student.scholarshipType !== "none" && !!student.scholarshipType;
    }

    if (rule.scope === "estandar") {
        return !student.scholarshipType || student.scholarshipType === "none";
    }

    return false;
}

async function applyEarlyDiscount(
    rule: Doc<"billingRule">,
    billing: Doc<"billing">,
    now: number,
    startDate: number,
) {
    if (!startDate || !rule.endDay) {
        return { amount: 0, reason: "", ruleId: rule._id, type: "rule" as const };
    }
    const date = new Date(startDate)
    const ruleEndDate = date.setDate(date.getDate() + rule.endDay);

    if (now <= ruleEndDate) {
        if (rule.lateFeeType === "percentage" && rule.lateFeeValue) {
            return {
                ruleId: rule._id,
                reason: `${rule.name} (${rule.lateFeeValue}%)`,
                amount: billing.amount * (rule.lateFeeValue / 100),
                percentage: rule.lateFeeValue,
                type: "rule" as const,
            };
        } else if (rule.lateFeeType === "fixed" && rule.lateFeeValue) {
            return {
                ruleId: rule._id,
                reason: rule.name,
                amount: rule.lateFeeValue,
                type: "rule" as const,
            };
        }
    }

    return { amount: 0, reason: "", ruleId: rule._id, type: "rule" as const };
}

function applyLateFee(
    rule: Doc<"billingRule">,
    billing: Doc<"billing">,
    now: number,
    endDate: number
): number {
    if (!endDate || !rule.startDay || !rule.endDay) return 0;

    const date = new Date(endDate)
    const ruleStartDate = date.setDate(date.getDate() + rule.startDay);
    const ruleEndDate = date.setDate(date.getDate() + rule.endDay);

    if (rule.startDay !== undefined && now < ruleStartDate) return 0;
    if (rule.endDay !== undefined && now > ruleEndDate) return 0;

    if (rule.lateFeeType === "percentage" && rule.lateFeeValue) {
        return billing.amount * (rule.lateFeeValue / 100);
    } else if (rule.lateFeeType === "fixed" && rule.lateFeeValue) {
        return rule.lateFeeValue;
    }

    return 0;
}

function determineStatus(
    billing: Doc<"billing">,
    now: number,
    totalAmount: number,
    dueDate: number
): Doc<"billing">["status"] {
    if (billing.status === "Pago cumplido") return "Pago cumplido";
    if (billing.paidAt) return "Pago cumplido";
    if (totalAmount === 0) return "Pago cumplido";
    if (!dueDate) return "Pago pendiente";

    const daysLate = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));

    if (daysLate > 30) return "Pago vencido";
    if (daysLate > 0) return "Pago retrasado";

    return "Pago pendiente";
}