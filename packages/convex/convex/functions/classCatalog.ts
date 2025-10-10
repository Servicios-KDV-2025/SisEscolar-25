import { v } from "convex/values";
import { mutation, query, internalMutation } from "../_generated/server";


// ++ NUEVA FUNCIÓN INTERNA PARA CREAR ++
export const internalCreateClassCatalog = internalMutation({
  args: {
    schoolId: v.id("school"),
    schoolCycleId: v.id("schoolCycle"),
    subjectId: v.id("subject"),
    classroomId: v.id("classroom"),
    teacherId: v.id("user"),
    groupId: v.id("group"),
    name: v.string(),
    status: v.union(v.literal('active'), v.literal('inactive')),
    createdBy: v.optional(v.id("user"))
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("classCatalog", {
        ...args,
        updatedAt: Date.now()
    });
    return id;
  },
});

// ++ NUEVA FUNCIÓN INTERNA PARA ELIMINAR (para el rollback) ++
export const internalDeleteClassCatalog = internalMutation({
    args: { classCatalogId: v.id("classCatalog") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.classCatalogId);
    }
});

// Create
export const createClassCatalog = mutation({
  args: {
    schoolId: v.id("school"),
    schoolCycleId: v.id("schoolCycle"),
    subjectId: v.id("subject"),
    classroomId: v.id("classroom"),
    teacherId: v.id("user"),
    groupId: v.id("group"),
    name: v.string(),
    status: v.union(v.literal('active'), v.literal('inactive')),
    createdBy: v.optional(v.id("user"))
  },
  handler: async (ctx, args) => {
    try {
      // Validación básica
      if (!args.name.trim()) {
        throw new Error('El nombre no puede estar vacío');
      }

      // Verificar que todos los IDs existan
      const [school, schoolCycle, subject, classroom, teacher] = await Promise.all([
        ctx.db.get(args.schoolId),
        ctx.db.get(args.schoolCycleId),
        ctx.db.get(args.subjectId),
        ctx.db.get(args.classroomId),
        ctx.db.get(args.teacherId),
      ]);

      if (!school) throw new Error(`School not found: ${args.schoolId}`);
      if (!schoolCycle) throw new Error(`SchoolCycle not found: ${args.schoolCycleId}`);
      if (!subject) throw new Error(`Subject not found: ${args.subjectId}`);
      if (!classroom) throw new Error(`Classroom not found: ${args.classroomId}`);
      if (!teacher) throw new Error(`Teacher not found: ${args.teacherId}`);

      if (args.groupId) {
        const group = await ctx.db.get(args.groupId);
        if (!group) throw new Error(`Group not found: ${args.groupId}`);
      }

      const id = await ctx.db.insert("classCatalog", {
        ...args,
        updatedAt: Date.now()
      });

      return id;

    } catch (error) {
      console.error('Error in createClassCatalog:', error);
      // Relanzar el error para que llegue al frontend
      throw error;
    }
  },
});

// Read
export const getAllClassCatalog = query({
  args: {
    schoolId: v.id("school"),
    canViewAll: v.boolean(),
    tutorId: v.optional(v.id("user")),
    teacherId: v.optional(v.id("user")),
  },
  handler: async (ctx, args) => {
    let classCatalogs;

    // Si puede ver todos, devolver todas las clases de la escuela
    if (args.canViewAll) {
      classCatalogs = await ctx.db
        .query("classCatalog")
        .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();
    }
    // Si es tutor, devolver solo las clases de sus estudiantes
    else if (args.tutorId) {
      // Primero obtenemos los estudiantes del tutor
      const tutorStudents = await ctx.db
        .query("student")
        .withIndex("by_schoolId", (q) => q.eq("schoolId", args.schoolId))
        .filter((q) => q.eq(q.field("tutorId"), args.tutorId))
        .collect();

      if (tutorStudents.length === 0) return [];

      // Obtenemos las studentClass de estos estudiantes
      const studentClassPromises = tutorStudents.map(async (student) => {
        return await ctx.db
          .query("studentClass")
          .withIndex("by_student", (q) => q.eq("studentId", student._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();
      });

      const allStudentClasses = (await Promise.all(studentClassPromises)).flat();
      
      if (allStudentClasses.length === 0) return [];

      // Obtenemos los IDs únicos de classCatalog
      const uniqueClassCatalogIds = [...new Set(allStudentClasses.map(sc => sc.classCatalogId))];

      // Obtenemos la información completa de las clases
      const classCatalogPromises = uniqueClassCatalogIds.map(async (classCatalogId) => {
        return await ctx.db.get(classCatalogId);
      });

      const classCatalogResults = await Promise.all(classCatalogPromises);

      // Filtramos las clases nulas y verificamos que estén activas y pertenezcan a la escuela
      classCatalogs = classCatalogResults
        .filter((classCatalog) => 
          classCatalog !== null && 
          classCatalog.schoolId === args.schoolId && 
          classCatalog.status === "active"
        );
    }
    // Si es maestro, devolver solo sus clases
    else if (args.teacherId) {
      classCatalogs = await ctx.db
        .query("classCatalog")
        .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId!))
        .filter((q) =>
          q.and(
            q.eq(q.field("schoolId"), args.schoolId),
            q.eq(q.field("status"), "active")
          )
        )
        .collect();
    }
    // Si no tiene permisos específicos, devolver array vacío
    else {
      return [];
    }

    if (!classCatalogs || classCatalogs.length === 0) return [];

    // Enriquecer los datos como en la función original
    const res = await Promise.all(
      classCatalogs.map(async (clase) => {
        const [cycle, subject, classroom, teacher, group, createData] = await Promise.all([
          clase!.schoolCycleId ? ctx.db.get(clase!.schoolCycleId) : null,
          clase!.subjectId ? ctx.db.get(clase!.subjectId) : null,
          clase!.classroomId ? ctx.db.get(clase!.classroomId) : null,
          clase!.teacherId ? ctx.db.get(clase!.teacherId) : null,
          clase!.groupId ? ctx.db.get(clase!.groupId) : null,
          clase!.createdBy ? ctx.db.get(clase!.createdBy) : null,
        ]);

        return {
          // Propiedades base de ClassCatalog
          _id: clase!._id,
          schoolId: clase!.schoolId,
          schoolCycleId: clase!.schoolCycleId,
          subjectId: clase!.subjectId,
          classroomId: clase!.classroomId,
          teacherId: clase!.teacherId,
          groupId: clase!.groupId,
          name: clase!.name,
          status: clase!.status,
          createdBy: clase!.createdBy,
          updatedAt: clase!.updatedAt,

          // Propiedades extendidas con objetos completos
          schoolCycle: cycle,
          subject: subject,
          classroom: classroom,
          teacher: teacher,
          group: group,
          createData: createData,
        }
      }),
    );

    return res;
  },
});

export const getClassCatalog = query({
  args: {
    schoolId: v.id("school"),
    _id: v.id("classCatalog")
  },
  handler: async (ctx, args) => {
    const catalog = await ctx.db.get(args._id);

    if (!catalog || catalog.schoolId !== args.schoolId) return null;
    return catalog;
  }
});

// Update
export const updateClassCatalog = mutation({
  args: {
    _id: v.id("classCatalog"),
    schoolId: v.id("school"),
    schoolCycleId: v.id("schoolCycle"),
    subjectId: v.id("subject"),
    classroomId: v.id("classroom"),
    teacherId: v.id("user"),
    groupId: v.optional(v.id("group")),
    name: v.string(),
    status: v.union(
      v.literal('active'),
      v.literal('inactive')
    ),
    createdBy: v.optional(v.id("user")),
    updatedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const catalog = await ctx.db.get(args._id);

    if (!catalog || catalog.schoolId !== args.schoolId) return null;

    const { _id, ...data } = args;
    await ctx.db.patch(_id, data);
  }
});

export const deleteClassCatalog = mutation({
  args: {
    _id: v.id("classCatalog"),
    schoolId: v.id("school"),
  },
  handler: async (ctx, args) => {
    const catalog = await ctx.db.get(args._id);
    if (!catalog || catalog.schoolId !== args.schoolId) return null;
    await ctx.db.delete(args._id);
  }
});

//borrar si es necesario


export const getTeacherClasses = query({
  args: {
    schoolId: v.id("school"),
    canViewAll: v.boolean(),
    tutorId: v.optional(v.id("user")),
    teacherId: v.optional(v.id("user"))
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No estás autenticado.");

    const user = await ctx.db
      .query("user")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("Usuario no encontrado.");

    let classes = [];

    if (args.canViewAll) {
      // Superadmin, Admin, Auditor: ver todas las clases de la escuela
      classes = await ctx.db
        .query("classCatalog")
        .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
        .collect();
    } else if (args.teacherId) {
      // Teacher: ver solo sus clases
      classes = await ctx.db
        .query("classCatalog")
        .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId!))
        .filter((q) => q.eq(q.field("schoolId"), args.schoolId))
        .collect();
    } else if (args.tutorId) {
      // Tutor: ver clases donde tiene estudiantes
      const tutorStudentClasses = await ctx.db
        .query("studentClass")
        .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      const tutorStudents = await ctx.db
        .query("student")
        .withIndex("by_schoolId", (q) => q.eq("schoolId", args.schoolId))
        .filter((q) => q.eq(q.field("tutorId"), args.tutorId))
        .collect();

      const tutorStudentIds = tutorStudents.map(s => s._id);
      
      const tutorClassIds = tutorStudentClasses
        .filter(sc => tutorStudentIds.includes(sc.studentId))
        .map(sc => sc.classCatalogId);

      const uniqueTutorClassIds = [...new Set(tutorClassIds)];

      // Obtener información de las clases
      const classPromises = uniqueTutorClassIds.map(async (classId) => {
        return await ctx.db.get(classId);
      });

      classes = (await Promise.all(classPromises)).filter(c => c !== null);
    } else {
      // Sin permisos, devolver array vacío
      return [];
    }

    // Enriquecer con información adicional
    const enrichedClasses = await Promise.all(
      classes.map(async (clase) => {
        const [subject, group] = await Promise.all([
          ctx.db.get(clase.subjectId),
          clase.groupId ? ctx.db.get(clase.groupId) : null,
        ]);

        return {
          _id: clase._id,
          name: clase.name,
          subject: subject?.name || "Sin asignar",
          group: group?.name || "Sin asignar",
          status: clase.status,
          schoolCycleId: clase.schoolCycleId,
        };
      })
    );

    return enrichedClasses;
  },
});

//  Obtener todos los periodos disponibles
export const getAllTerms = query({
  args: { schoolId: v.id("school") },
  handler: async (ctx, args) => {
    const terms = await ctx.db
      .query("term")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) => q.eq(q.field("schoolId"), args.schoolId))
      .collect();

    return terms;
  },
});

// Obtener periodos disponibles para una clase
export const getTermsForClass = query({
  args: {
    classCatalogId: v.id("classCatalog"),
  },
  handler: async (ctx, args) => {
    const classCatalog = await ctx.db.get(args.classCatalogId);
    if (!classCatalog) throw new Error("Clase no encontrada.");

    // Obtener todos los periodos activos
    const terms = await ctx.db
      .query("term")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    return terms;
  },
});

// Obtener clases por ciclo escolar
export const getClassesBySchoolCycle = query({
  args: {
    schoolId: v.id("school"),
    schoolCycleId: v.id("schoolCycle"),
    canViewAll: v.boolean(),
    tutorId: v.optional(v.id("user")),
    teacherId: v.optional(v.id("user"))
  },
  handler: async (ctx, args) => {
    let classes = [];

    if (args.canViewAll) {
      // Superadmin, Admin, Auditor: ver todas las clases del ciclo
      classes = await ctx.db
        .query("classCatalog")
        .withIndex("by_cycle", (q) => q.eq("schoolCycleId", args.schoolCycleId))
        .filter((q) => q.eq(q.field("schoolId"), args.schoolId))
        .collect();
    } else if (args.teacherId) {
      // Teacher: ver solo sus clases del ciclo
      classes = await ctx.db
        .query("classCatalog")
        .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId!))
        .filter((q) => 
          q.and(
            q.eq(q.field("schoolId"), args.schoolId),
            q.eq(q.field("schoolCycleId"), args.schoolCycleId)
          )
        )
        .collect();
    } else if (args.tutorId) {
      // Tutor: ver clases del ciclo donde tiene estudiantes
      const tutorStudentClasses = await ctx.db
        .query("studentClass")
        .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      const tutorStudents = await ctx.db
        .query("student")
        .withIndex("by_schoolId", (q) => q.eq("schoolId", args.schoolId))
        .filter((q) => q.eq(q.field("tutorId"), args.tutorId))
        .collect();

      const tutorStudentIds = tutorStudents.map(s => s._id);
      
      const tutorClassIds = tutorStudentClasses
        .filter(sc => tutorStudentIds.includes(sc.studentId))
        .map(sc => sc.classCatalogId);

      const uniqueTutorClassIds = [...new Set(tutorClassIds)];

      // Obtener información de las clases del ciclo específico
      const classPromises = uniqueTutorClassIds.map(async (classId) => {
        const clase = await ctx.db.get(classId);
        return clase && clase.schoolCycleId === args.schoolCycleId ? clase : null;
      });

      classes = (await Promise.all(classPromises)).filter(c => c !== null);
    } else {
      return [];
    }

    return classes;
  },
});

// Obtener clases por maestro
export const getClassesByTeacher = query({
  args: {
    schoolId: v.id("school"),
    teacherId: v.id("user"),
  },
  handler: async (ctx, args) => {
    const classes = await ctx.db
      .query("classCatalog")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .filter((q) => q.eq(q.field("schoolId"), args.schoolId))
      .collect();

    return classes;
  },
});

// Obtener clases por aula
export const getClassesByClassroom = query({
  args: {
    schoolId: v.id("school"),
    classroomId: v.id("classroom"),
  },
  handler: async (ctx, args) => {
    const classes = await ctx.db
      .query("classCatalog")
      .withIndex("by_classroom", (q) => q.eq("classroomId", args.classroomId))
      .filter((q) => q.eq(q.field("schoolId"), args.schoolId))
      .collect();

    return classes;
  },
}); 

export const getClassCatalogWithRoleFilter = query({
  args: {
    schoolId: v.id("school"),
    canViewAll: v.boolean(),
    tutorId: v.optional(v.id("user")),
    teacherId: v.optional(v.id("user")),
  },
  handler: async (ctx, args) => {
    // Si puede ver todos, devolver todas las clases de la escuela
    if (args.canViewAll) {
      return await ctx.db
        .query("classCatalog")
        .withIndex("by_school", (q) =>
          q.eq("schoolId", args.schoolId)
        )
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();
    }

    // Si es tutor, devolver solo las clases de sus estudiantes
    if (args.tutorId) {
      // Primero obtenemos los estudiantes del tutor
      const tutorStudents = await ctx.db
        .query("student")
        .withIndex("by_schoolId", (q) => q.eq("schoolId", args.schoolId))
        .filter((q) => q.eq(q.field("tutorId"), args.tutorId))
        .collect();

      if (tutorStudents.length === 0) return [];

      // Obtenemos las studentClass de estos estudiantes
      const studentClassPromises = tutorStudents.map(async (student) => {
        return await ctx.db
          .query("studentClass")
          .withIndex("by_student", (q) => q.eq("studentId", student._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();
      });

      const allStudentClasses = (await Promise.all(studentClassPromises)).flat();
      
      if (allStudentClasses.length === 0) return [];

      // Obtenemos los IDs únicos de classCatalog
      const uniqueClassCatalogIds = [...new Set(allStudentClasses.map(sc => sc.classCatalogId))];

      // Obtenemos la información completa de las clases
      const classCatalogPromises = uniqueClassCatalogIds.map(async (classCatalogId) => {
        return await ctx.db.get(classCatalogId);
      });

      const classCatalogs = await Promise.all(classCatalogPromises);

      // Filtramos las clases nulas y verificamos que estén activas y pertenezcan a la escuela
      return classCatalogs
        .filter((classCatalog) => 
          classCatalog !== null && 
          classCatalog.schoolId === args.schoolId && 
          classCatalog.status === "active"
        );
    }

    // Si es maestro, devolver solo sus clases
    if (args.teacherId) {
      return await ctx.db
        .query("classCatalog")
        .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId!))
        .filter((q) =>
          q.and(
            q.eq(q.field("schoolId"), args.schoolId),
            q.eq(q.field("status"), "active")
          )
        )
        .collect();
    }

    // Si no tiene permisos específicos, devolver array vacío
    return [];
  },
});
