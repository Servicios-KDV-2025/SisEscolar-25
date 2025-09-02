// convex/student.ts
import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// CREATE
export const createStudent = mutation({
  args: {
    schoolId: v.id("school"),
    groupId: v.id("group"),
    tutorId: v.id("user"),
    enrollment: v.string(),
    name: v.string(),
    lastName: v.optional(v.string()),
    birthDate: v.optional(v.number()),
    admissionDate: v.optional(v.number()),
    imgUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validar matrícula única por escuela
    const existingStudent = await ctx.db
      .query("student")
      .withIndex("by_schoolId_and_enrollment", (q) =>
        q.eq("schoolId", args.schoolId).eq("enrollment", args.enrollment)
      )
      .unique();

    if (existingStudent) {
      throw new Error(
        "Ya existe un estudiante con esta matrícula en la escuela."
      );
    }

    // Insertar el nuevo estudiante con datos de auditoría
    const now = Date.now();
    return await ctx.db.insert("student", {
      ...args,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

// READ (uno por ID)
export const getStudentById = query({
  args: { id: v.id("student") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
// R: Listar y filtrar estudiantes
// export const listStudentsWithFilters = query({
//   args: {
//     schoolId: v.id("school"),
//     groupId: v.optional(v.id("group")),
//     tutorId: v.optional(v.id("user")),
//     status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
//   },
//   handler: async (ctx, args) => {
//     let studentsQuery = ctx.db
//       .query("student")
//       .withIndex("by_schoolId", (q) => q.eq("schoolId", args.schoolId));

//     if (args.groupId) {
//       studentsQuery = studentsQuery.filter((q)=> q.eq("groupId", args.groupId))
//     }
//     if (args.tutorId) {
//       studentsQuery = studentsQuery.filter((q) => q.eq("tutorId", args.tutorId));
//     }
//     if (args.status) {
//       studentsQuery = studentsQuery.filter((q) => q.eq("status", args.status));
//     }

//     return await studentsQuery.collect();
//   },
// });

// READ (todos por escuela)
export const listStudentsBySchool = query({
  args: { schoolId: v.id("school") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("student")
      .withIndex("by_schoolId_and_enrollment", (q) =>
        q.eq("schoolId", args.schoolId)
      )
      .collect();
  },
});

// READ (Por grupo)
export const getStudentsByGroup = query({
  args: { groupId: v.id("group") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("student")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();
  },
});

//Actualizar los datos de un estudiante.
export const updateStudent = mutation({
  args: {
    studentId: v.id("student"),
    patch: v.object({
      name: v.optional(v.string()),
      lastName: v.optional(v.string()),
      enrollment: v.optional(v.string()),
      groupId: v.optional(v.id("group")),
      tutorId: v.optional(v.id("user")),
      birthDate: v.optional(v.number()),
      admissionDate: v.optional(v.number()),
      imgUrl: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const { studentId, patch } = args;

    // Actualiza solo los campos presentes en el objeto 'patch'
    await ctx.db.patch(studentId, {
      ...patch,
      updatedAt: Date.now(), // Registra la fecha de actualización
    });

    return studentId;
  },
});

// D: Baja Lógica (actualizar estado)
export const updateStudentStatus = mutation({
  args: {
    studentId: v.id("student"),
    status: v.union(v.literal("active"), v.literal("inactive")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.studentId, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return args.studentId;
  },
});

// DELETE
export const deleteStudent = mutation({
  args: { id: v.id("student") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getStudentsByClass = query({
  args: {
    classCatalogId: v.id('classCatalog')
  },
  handler: async (ctx, args) => {
    // Obtener estudantes de la clase
    const studentClasses = await ctx.db
      .query('studentClass')
      .withIndex('by_class_catalog', (q) => q.eq('classCatalogId', args.classCatalogId))
      .collect()
    const studentsWithDetails = await Promise.all(
      studentClasses.map(async (sc) => {
        const student = await ctx.db.get(sc.studentId)
        const classCatalog = await ctx.db.get(sc.classCatalogId)
        return {
          ...sc,
          student,
          className: classCatalog?.name || 'Unknow'
        }
      })
    )

    return studentsWithDetails
  },
})
