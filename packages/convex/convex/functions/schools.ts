import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

/*
EJEMPLOS DE USO:

// Obtener todas las escuelas de un usuario
const userSchools = await ctx.runQuery(api.schools.getUserSchools, { 
    userId: "user_id_here" 
});

// Obtener solo las escuelas activas de un usuario
const activeSchools = await ctx.runQuery(api.schools.getUserActiveSchools, { 
    userId: "user_id_here" 
});

// Obtener escuelas donde el usuario es admin
const adminSchools = await ctx.runQuery(api.schools.getUserSchools, { 
    userId: "user_id_here",
    role: "admin" 
});

// Asignar un usuario a una escuela
const userSchoolId = await ctx.runMutation(api.schools.assignUserToSchool, {
    userId: "user_id_here",
    schoolId: "school_id_here",
    role: ["teacher"],
    department: "technology"
});

// Actualizar roles de un usuario en una escuela
await ctx.runMutation(api.schools.updateUserSchool, {
    userSchoolId: "user_school_id_here",
    role: ["admin", "teacher"]
});
*/

// Obtener las escuelas que pertenecen a un usuario
export const getUserSchools = query({
    args: { 
        userId: v.id("user"),
        status: v.optional(v.union(
            v.literal('active'),
            v.literal('inactive')
        )),
        role: v.optional(v.union(
            v.literal('superadmin'),
            v.literal('admin'),
            v.literal('auditor'),
            v.literal('teacher'),
            v.literal('tutor'),
        )),
    },
    handler: async (ctx, args) => {
        // Obtener todas las relaciones usuario-escuela para el usuario
        const userSchools = await ctx.db
            .query("userSchool")
            .filter((q) => q.eq(q.field("userId"), args.userId))
            .collect();

        // Filtrar por status si se proporciona
        let filteredUserSchools = userSchools;
        if (args.status) {
            filteredUserSchools = userSchools.filter(us => us.status === args.status);
        }

        // Filtrar por rol si se proporciona
        if (args.role) {
            filteredUserSchools = filteredUserSchools.filter(us => 
                us.role.includes(args.role!)
            );
        }

        // Obtener los detalles de las escuelas
        const schoolsWithDetails = await Promise.all(
            filteredUserSchools.map(async (userSchool) => {
                const school = await ctx.db.get(userSchool.schoolId);
                if (!school) {
                    return null;
                }

                return {
                    userSchoolId: userSchool._id,
                    school: school,
                    role: userSchool.role,
                    status: userSchool.status,
                    department: userSchool.department,
                    createdAt: userSchool.createdAt,
                    updatedAt: userSchool.updatedAt,
                };
            })
        );

        // Filtrar resultados nulos y retornar
        return schoolsWithDetails.filter(result => result !== null);
    }
});

// Obtener las escuelas activas que pertenecen a un usuario
export const getUserActiveSchools = query({
    args: { 
        userId: v.id("user"),
        role: v.optional(v.union(
            v.literal('superadmin'),
            v.literal('admin'),
            v.literal('auditor'),
            v.literal('teacher'),
            v.literal('tutor'),
        )),
    },
    handler: async (ctx, args) => {
        // Obtener solo las relaciones activas
        const userSchools = await ctx.db
            .query("userSchool")
            .filter((q) => 
                q.and(
                    q.eq(q.field("userId"), args.userId),
                    q.eq(q.field("status"), "active")
                )
            )
            .collect();

        // Filtrar por rol si se proporciona
        let filteredUserSchools = userSchools;
        if (args.role) {
            filteredUserSchools = userSchools.filter(us => 
                us.role.includes(args.role!)
            );
        }

        // Obtener los detalles de las escuelas (solo activas)
        const schoolsWithDetails = await Promise.all(
            filteredUserSchools.map(async (userSchool) => {
                const school = await ctx.db.get(userSchool.schoolId);
                if (!school || school.status !== 'active') {
                    return null;
                }

                return {
                    userSchoolId: userSchool._id,
                    school: school,
                    role: userSchool.role,
                    department: userSchool.department,
                    createdAt: userSchool.createdAt,
                    updatedAt: userSchool.updatedAt,
                };
            })
        );

        // Filtrar resultados nulos y retornar
        return schoolsWithDetails.filter(result => result !== null);
    }
});

// Obtener una escuela específica de un usuario
export const getUserSchool = query({
    args: { 
        userId: v.id("user"),
        schoolId: v.id("school"),
    },
    handler: async (ctx, args) => {
        // Buscar la relación específica
        const userSchool = await ctx.db
            .query("userSchool")
            .filter((q) => 
                q.and(
                    q.eq(q.field("userId"), args.userId),
                    q.eq(q.field("schoolId"), args.schoolId)
                )
            )
            .unique();

        if (!userSchool) {
            throw new Error("El usuario no tiene acceso a esta escuela");
        }

        // Obtener los detalles de la escuela
        const school = await ctx.db.get(args.schoolId);
        if (!school) {
            throw new Error("Escuela no encontrada");
        }

        return {
            userSchoolId: userSchool._id,
            school: school,
            role: userSchool.role,
            status: userSchool.status,
            department: userSchool.department,
            createdAt: userSchool.createdAt,
            updatedAt: userSchool.updatedAt,
        };
    }
});

// Asignar un usuario a una escuela
export const assignUserToSchool = mutation({
    args: {
        userId: v.id("user"),
        schoolId: v.id("school"),
        role: v.array(
            v.union(
                v.literal('superadmin'),
                v.literal('admin'),
                v.literal('auditor'),
                v.literal('teacher'),
                v.literal('tutor'),
            )
        ),
        department: v.optional(v.union(
            v.literal("secretary"),
            v.literal("direction"),
            v.literal("schoolControl"),
            v.literal("technology"),
        )),
        status: v.optional(v.union(
            v.literal('active'),
            v.literal('inactive')
        )),
    },
    handler: async (ctx, args) => {
        // Verificar que el usuario existe
        const user = await ctx.db.get(args.userId);
        if (!user) {
            throw new Error("Usuario no encontrado");
        }

        // Verificar que la escuela existe
        const school = await ctx.db.get(args.schoolId);
        if (!school) {
            throw new Error("Escuela no encontrada");
        }

        // Verificar que no existe ya una relación entre este usuario y escuela
        const existingUserSchool = await ctx.db
            .query("userSchool")
            .filter((q) => 
                q.and(
                    q.eq(q.field("userId"), args.userId),
                    q.eq(q.field("schoolId"), args.schoolId)
                )
            )
            .unique();

        if (existingUserSchool) {
            throw new Error("El usuario ya está asignado a esta escuela");
        }

        // Crear la relación usuario-escuela
        const userSchoolId = await ctx.db.insert("userSchool", {
            userId: args.userId,
            schoolId: args.schoolId,
            role: args.role,
            status: args.status || 'active',
            department: args.department,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return userSchoolId;
    }
});

// Actualizar la relación usuario-escuela
export const updateUserSchool = mutation({
    args: {
        userSchoolId: v.id("userSchool"),
        role: v.optional(v.array(
            v.union(
                v.literal('superadmin'),
                v.literal('admin'),
                v.literal('auditor'),
                v.literal('teacher'),
                v.literal('tutor'),
            )
        )),
        department: v.optional(v.union(
            v.literal("secretary"),
            v.literal("direction"),
            v.literal("schoolControl"),
            v.literal("technology"),
        )),
        status: v.optional(v.union(
            v.literal('active'),
            v.literal('inactive')
        )),
    },
    handler: async (ctx, args) => {
        // Verificar que la relación existe
        const userSchool = await ctx.db.get(args.userSchoolId);
        if (!userSchool) {
            throw new Error("Relación usuario-escuela no encontrada");
        }

        // Preparar los campos a actualizar
        const updateFields: any = {
            updatedAt: Date.now(),
        };

        if (args.role !== undefined) {
            updateFields.role = args.role;
        }
        if (args.department !== undefined) {
            updateFields.department = args.department;
        }
        if (args.status !== undefined) {
            updateFields.status = args.status;
        }

        // Actualizar la relación
        await ctx.db.patch(args.userSchoolId, updateFields);

        return args.userSchoolId;
    }
});

// Remover un usuario de una escuela
export const removeUserFromSchool = mutation({
    args: {
        userSchoolId: v.id("userSchool"),
    },
    handler: async (ctx, args) => {
        // Verificar que la relación existe
        const userSchool = await ctx.db.get(args.userSchoolId);
        if (!userSchool) {
            throw new Error("Relación usuario-escuela no encontrada");
        }

        // Eliminar la relación
        await ctx.db.delete(args.userSchoolId);

        return args.userSchoolId;
    }
});

// Desactivar un usuario en una escuela (cambiar status a inactive)
export const deactivateUserInSchool = mutation({
    args: {
        userSchoolId: v.id("userSchool"),
    },
    handler: async (ctx, args) => {
        // Verificar que la relación existe
        const userSchool = await ctx.db.get(args.userSchoolId);
        if (!userSchool) {
            throw new Error("Relación usuario-escuela no encontrada");
        }

        // Cambiar el status a inactive
        await ctx.db.patch(args.userSchoolId, {
            status: 'inactive',
            updatedAt: Date.now(),
        });

        return args.userSchoolId;
    }
});

// Activar un usuario en una escuela (cambiar status a active)
export const activateUserInSchool = mutation({
    args: {
        userSchoolId: v.id("userSchool"),
    },
    handler: async (ctx, args) => {
        // Verificar que la relación existe
        const userSchool = await ctx.db.get(args.userSchoolId);
        if (!userSchool) {
            throw new Error("Relación usuario-escuela no encontrada");
        }

        // Cambiar el status a active
        await ctx.db.patch(args.userSchoolId, {
            status: 'active',
            updatedAt: Date.now(),
        });

        return args.userSchoolId;
    }
}); 