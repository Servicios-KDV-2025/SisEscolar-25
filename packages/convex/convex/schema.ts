import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const applicationTable = defineSchema({
    user: defineTable({
        name: v.string(),
        lastName: v.optional(v.string()),
        email: v.string(),
        phone: v.optional(v.string()),
        address: v.optional(v.string()),
        birthDate: v.optional(v.string()),
        admissionDate: v.optional(v.string()),
        imgUrl: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
        clerkId: v.string(),
        status: v.union(
            v.literal('active'),
            v.literal('inactive')
        ),
    }).index("byClerkId", ["clerkId"]),


    userSchool: defineTable({
        userId: v.id('user'),
        schoolId: v.id('school'),
        role: v.array(
            v.union(
                v.literal('admin'),
                v.literal('personal'),
                v.literal('tutor'),
                v.literal('student'),
            )
        ),
        status: v.union(
            v.literal('active'),
            v.literal('inactive')
        ),
        createdAt: v.number(),
        updatedAt: v.number(),
    }),

    school: defineTable({
        name: v.string(),
        shortName: v.string(),
        cctCode: v.string(),
        address: v.string(),
        description: v.string(),
        imgUrl: v.string(),
        phone: v.string(),
        email: v.string(),
        status: v.union(
            v.literal('active'),
            v.literal('inactive')
        ),
        createdAt: v.number(),
        updatedAt: v.number(),
    }),

    tutor: defineTable({
        userSchoolId: v.id('userSchool'),
        createdAt: v.number(),
        updatedAt: v.number(),
    }),

    student: defineTable({
        userSchoolId: v.id('userSchool'),
        createdAt: v.number(),
        updatedAt: v.number(),
    }),

    personal: defineTable({
        userSchoolId: v.id('userSchool'),
        createdAt: v.number(),
        updatedAt: v.number(),
    }),

    admin: defineTable({
        userSchoolId: v.id('userSchool'),
        createdAt: v.number(),
        updatedAt: v.number(),
    }),

});

export default applicationTable;