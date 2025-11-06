import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const createStudentClass = mutation({
    args: {
        schoolId: v.id("school"),
        classCatalogId: v.id("classCatalog"),
        studentId: v.id("student"),
        enrollmentDate: v.number(),
        status: v.union(v.literal("active"), v.literal("inactive")),
        averageScore: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const exists = await ctx.db
            .query("studentClass")
            .withIndex("by_student", q => q.eq("studentId", args.studentId))
            .filter(q =>
                q.and(
                    q.eq(q.field("classCatalogId"), args.classCatalogId),
                    q.eq(q.field("schoolId"), args.schoolId)
                )
            )
            .first();

        if (exists) {
            throw "El estudiante ya está asignado a esta clase.";
        }

        return await ctx.db.insert("studentClass", args);
    },
});

export const getStudentClassesBySchool = query({
    args: { schoolId: v.id("school") },
    handler: async (ctx, args) => {
        const enrollments = await ctx.db
            .query("studentClass")
            .withIndex("by_school", q => q.eq("schoolId", args.schoolId))
            .collect();

        const result = await Promise.all(
            enrollments.map(async (enrollment) => {
                const [student, classCatalog] = await Promise.all([
                    ctx.db.get(enrollment.studentId),
                    ctx.db.get(enrollment.classCatalogId),
                ]);

                if (!student || !classCatalog) {
                    return null;
                }

                const [subject, teacher, group, schoolCycle] = await Promise.all([
                    ctx.db.get(classCatalog.subjectId),
                    ctx.db.get(classCatalog.teacherId),
                    classCatalog.groupId ? ctx.db.get(classCatalog.groupId) : Promise.resolve(null),
                    ctx.db.get(classCatalog.schoolCycleId),
                ]);

                return {
                    _id: enrollment._id,
                    enrollmentDate: enrollment.enrollmentDate,
                    averageScore: enrollment.averageScore,
                    status: enrollment.status,
                    student: {
                        _id: student._id,
                        name: student.name,
                        lastName: student.lastName,
                        enrollment: student.enrollment,
                        tutorId: student.tutorId,
                    },
                    classCatalog: {
                        _id: classCatalog._id,
                        name: classCatalog.name,
                        subject: subject?.name || "No subject",
                        teacher: teacher ? `${teacher.name} ${teacher.lastName}` : "No teacher",
                        teacherId: teacher?._id,
                        group: group?.name || "No group",
                        grade: group?.grade || "No grade",
                    },
                    schoolCycle: {
                        _id: schoolCycle?._id,
                        name: schoolCycle?.name || "No cycle",
                        startDate: schoolCycle?.startDate,
                        endDate: schoolCycle?.endDate,
                    }
                };
            })
        );

        return result.filter(Boolean);
    },
});

export const getStudentClassesBySchoolWithRoleFilter = query({
    args: {
        schoolId: v.id("school"),
        canViewAll: v.boolean(),
        tutorId: v.optional(v.id("user")),
        teacherId: v.optional(v.id("user")),
    },
    handler: async (ctx, args) => {
        let enrollments = [];

        // 🔹 1. Si el usuario puede ver todos (admin/superadmin)
        if (args.canViewAll) {
            enrollments = await ctx.db
                .query("studentClass")
                .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
                .collect();
        }
        // 🔹 2. Si es tutor → solo estudiantes de los hijos asociados a ese tutor
        else if (args.tutorId) {
            const students = await ctx.db
                .query("student")
                .withIndex("by_schoolId", (q) => q.eq("schoolId", args.schoolId))
                .filter((q) => q.eq(q.field("tutorId"), args.tutorId))
                .collect();

            const studentIds = new Set(students.map((s) => s._id));

            enrollments = await ctx.db
                .query("studentClass")
                .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
                .filter((q) => q.or(...[...studentIds].map((id) => q.eq(q.field("studentId"), id))))
                .collect();
        }
        // 🔹 3. Si es maestro → estudiantes solo de las clases que imparte
        else if (args.teacherId) {
            const teacherClasses = await ctx.db
                .query("classCatalog")
                .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId!))
                .filter((q) =>
                    q.and(
                        q.eq(q.field("schoolId"), args.schoolId),
                        q.eq(q.field("status"), "active")
                    )
                )
                .collect();

            const teacherClassIds = new Set(teacherClasses.map((c) => c._id));

            enrollments = await ctx.db
                .query("studentClass")
                .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
                .filter((q) => q.or(...[...teacherClassIds].map((id) => q.eq(q.field("classCatalogId"), id))))
                .collect();
        }
        // 🔹 4. Si no tiene permisos
        else {
            return [];
        }

        // 🔹 5. Construimos la respuesta enriquecida (igual que tu código original)
        const result = await Promise.all(
            enrollments.map(async (enrollment) => {
                const [student, classCatalog] = await Promise.all([
                    ctx.db.get(enrollment.studentId),
                    ctx.db.get(enrollment.classCatalogId),
                ]);

                if (!student || !classCatalog) return null;

                const [subject, teacher, group, schoolCycle] = await Promise.all([
                    ctx.db.get(classCatalog.subjectId),
                    ctx.db.get(classCatalog.teacherId),
                    classCatalog.groupId ? ctx.db.get(classCatalog.groupId) : Promise.resolve(null),
                    ctx.db.get(classCatalog.schoolCycleId),
                ]);

                return {
                    _id: enrollment._id,
                    enrollmentDate: enrollment.enrollmentDate,
                    averageScore: enrollment.averageScore,
                    status: enrollment.status,
                    student: {
                        _id: student._id,
                        name: student.name,
                        lastName: student.lastName,
                        enrollment: student.enrollment,
                        tutorId: student.tutorId,
                    },
                    classCatalog: {
                        _id: classCatalog._id,
                        name: classCatalog.name,
                        subject: subject?.name || "No subject",
                        teacher: teacher ? `${teacher.name} ${teacher.lastName}` : "No teacher",
                        teacherId: teacher?._id,
                        group: group?.name || "No group",
                        grade: group?.grade || "No grade",
                    },
                    schoolCycle: {
                        _id: schoolCycle?._id,
                        name: schoolCycle?.name || "No cycle",
                        startDate: schoolCycle?.startDate,
                        endDate: schoolCycle?.endDate,
                    },
                };
            })
        );

        return result.filter(Boolean);
    },
});

export const getStudentClassesByStudentId = query({
    args: {
        schoolId: v.id("school"),
        studentId: v.id("student")
    },
    handler: async (ctx, args) => {
        const enrollments = await ctx.db
            .query("studentClass")
            .withIndex("by_student", q => q.eq("studentId", args.studentId))
            .filter(q => q.eq(q.field("schoolId"), args.schoolId))
            .collect();

        const result = await Promise.all(
            enrollments.map(async (enrollment) => {
                const classCatalog = await ctx.db.get(enrollment.classCatalogId);
                if (!classCatalog) return null;

                const [subject, teacher, group] = await Promise.all([
                    ctx.db.get(classCatalog.subjectId),
                    ctx.db.get(classCatalog.teacherId),
                    classCatalog.groupId ? ctx.db.get(classCatalog.groupId) : Promise.resolve(null),
                ]);

                return {
                    _id: enrollment._id,
                    enrollmentDate: enrollment.enrollmentDate,
                    status: enrollment.status,
                    averageScore: enrollment.averageScore,
                    class: {
                        _id: classCatalog._id,
                        name: classCatalog.name,
                        subject: subject?.name || "No subject",
                        teacher: teacher ? `${teacher.name} ${teacher.lastName}` : "No teacher",
                        group: group?.name || "No group",
                    },
                };
            })
        );

        return result.filter(Boolean);
    },
});

export const getStudentsByClass = query({
    args: {
        schoolId: v.id("school"),
        classCatalogId: v.id("classCatalog")
    },
    handler: async (ctx, args) => {
        const enrollments = await ctx.db
            .query("studentClass")
            .withIndex("by_class_catalog", q => q.eq("classCatalogId", args.classCatalogId))
            .filter(q => q.eq(q.field("schoolId"), args.schoolId))
            .collect();

        const result = await Promise.all(
            enrollments.map(async (enrollment) => {
                const student = await ctx.db.get(enrollment.studentId);
                if (!student) return null;

                return {
                    _id: enrollment._id,
                    enrollmentDate: enrollment.enrollmentDate,
                    status: enrollment.status,
                    averageScore: enrollment.averageScore,
                    student: {
                        _id: student._id,
                        name: student.name,
                        lastName: student.lastName,
                        enrollment: student.enrollment,
                    },
                };
            })
        );

        return result.filter(Boolean);
    },
});

export const updateStudentClass = mutation({
    args: {
        _id: v.id("studentClass"),
        schoolId: v.id("school"),
        classCatalogId: v.id("classCatalog"),
        studentId: v.id("student"),
        enrollmentDate: v.number(),
        status: v.union(v.literal("active"), v.literal("inactive")),
        averageScore: v.number(),
    },
    handler: async (ctx, args) => {
        const enrollment = await ctx.db.get(args._id);
        if (!enrollment || enrollment.schoolId !== args.schoolId) {
            throw "Enrollment not found or doesn't belong to the school.";
        }

        if (enrollment.studentId !== args.studentId || enrollment.classCatalogId !== args.classCatalogId) {
            const exists = await ctx.db
                .query("studentClass")
                .withIndex("by_student", q => q.eq("studentId", args.studentId))
                .filter(q =>
                    q.and(
                        q.eq(q.field("classCatalogId"), args.classCatalogId),
                        q.eq(q.field("schoolId"), args.schoolId)
                    )
                )
                .first();

            if (exists) {
                throw "El estudiante ya esta inscripto a esa clase.";
            }
        }

        return ctx.db.patch(args._id, {
            classCatalogId: args.classCatalogId,
            studentId: args.studentId,
            enrollmentDate: args.enrollmentDate,
            status: args.status,
            averageScore: args.averageScore,
        });
    },
});

export const deleteStudentClass = mutation({
    args: {
        id: v.id("studentClass"),
        schoolId: v.id("school"),
    },
    handler: async (ctx, args) => {
        const enrollment = await ctx.db.get(args.id);
        if (!enrollment || enrollment.schoolId !== args.schoolId) {
            throw new Error("Matrícula no encontrada o no pertenece al colegio.");
        }

        await ctx.db.delete(args.id);
    },
});

export const getEnrollmentsBySchoolCycler = query({
    args: {
        schoolId: v.id("school"),
        schoolCycle: v.id("schoolCycle")
    },
    handler: async (ctx, args) => {
        const classCatalogs = await ctx.db
            .query("classCatalog")
            .withIndex("by_cycle", q => q.eq("schoolCycleId", args.schoolCycle))
            .filter(q => q.eq(q.field("schoolId"), args.schoolId))
            .collect();

        const catalogIds = classCatalogs.map((c) => c._id);

        const allStudentClasses = await ctx.db.query("studentClass").collect();

        const enrollments = allStudentClasses.filter(sc =>
            catalogIds.includes(sc.classCatalogId)
        );

        const result = await Promise.all(
            enrollments.map(async (enrollment) => {
                const [student, classCatalog] = await Promise.all([
                    ctx.db.get(enrollment.studentId),
                    ctx.db.get(enrollment.classCatalogId),
                ]);

                if (!student || !classCatalog) {
                    return null;
                }

                const [subject, teacher, group] = await Promise.all([
                    ctx.db.get(classCatalog.subjectId),
                    ctx.db.get(classCatalog.teacherId),
                    classCatalog.groupId ? ctx.db.get(classCatalog.groupId) : Promise.resolve(null),
                ]);

                return {
                    _id: enrollment._id,
                    enrollmentDate: enrollment.enrollmentDate,
                    status: enrollment.status,
                    student: {
                        _id: student._id,
                        name: student.name,
                        lastName: student.lastName,
                        enrollment: student.enrollment,
                    },
                    class: {
                        _id: classCatalog._id,
                        name: classCatalog.name,
                        subject: subject?.name || "No subject",
                        teacher: teacher ? `${teacher.name} ${teacher.lastName}` : "No teacher",
                        group: group?.name || "No group",
                    },
                };
            })
        );

        return result.filter(Boolean);
    },
});

export const getEnrollmentStatistics = query({
    args: { schoolId: v.id("school") },
    handler: async (ctx, args) => {
        const enrollments = await ctx.db
            .query("studentClass")
            .withIndex("by_school", q => q.eq("schoolId", args.schoolId))
            .collect();

        const students = await ctx.db
            .query("student")
            .withIndex("by_schoolId", q => q.eq("schoolId", args.schoolId))
            .collect();

        const classCatalogs = await ctx.db
            .query("classCatalog")
            .withIndex("by_school", q => q.eq("schoolId", args.schoolId))
            .collect();

        const activeEnrollments = enrollments.filter(e => e.status === "active").length;
        const totalStudents = students.length;
        const totalClasses = classCatalogs.filter(c => c.status === "active").length;

        return {
            totalEnrollments: enrollments.length,
            activeEnrollments,
            totalStudents,
            totalClasses,
            averageClassesPerStudent: totalStudents > 0 ? (activeEnrollments / totalStudents).toFixed(1) : "0",
        };
    },
});

/**
* Actualiza únicamente el promedio de un estudiante en una clase específica.
*/
export const updateStudentClassAverage = mutation({
    args: {
        studentClassId: v.id("studentClass"),
        averageScore: v.number(),
        schoolId: v.id("school"),
    },
    handler: async (ctx, args) => {
        const studentClass = await ctx.db.get(args.studentClassId);
        if (!studentClass) {
            throw new Error("La inscripción del estudiante no fue encontrada.");
        }
        if (studentClass.schoolId !== args.schoolId) {
            throw new Error("No tienes permiso para actualizar esta inscripción.");
        }
        await ctx.db.patch(args.studentClassId, {
            averageScore: args.averageScore,
        });
        return { success: true };
    },
});