import { query, mutation, internalQuery } from '../_generated/server';
import { v } from 'convex/values';

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
    userId: v.id('user'),
    status: v.optional(v.union(v.literal('active'), v.literal('inactive'))),
    role: v.optional(
      v.union(
        v.literal('superadmin'),
        v.literal('admin'),
        v.literal('auditor'),
        v.literal('teacher'),
        v.literal('tutor')
      )
    ),
  },
  handler: async (ctx, args) => {
    // Obtener todas las relaciones usuario-escuela para el usuario
    const userSchools = await ctx.db
      .query('userSchool')
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .collect();

    // Filtrar por status si se proporciona
    let filteredUserSchools = userSchools;
    if (args.status) {
      filteredUserSchools = userSchools.filter(
        (us) => us.status === args.status
      );
    }

    // Filtrar por rol si se proporciona
    if (args.role) {
      filteredUserSchools = filteredUserSchools.filter((us) =>
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
    return schoolsWithDetails.filter((result) => result !== null);
  },
});

// Obtener las escuelas activas que pertenecen a un usuario
export const getUserActiveSchools = query({
  args: {
    userId: v.id('user'),
    role: v.optional(
      v.union(
        v.literal('superadmin'),
        v.literal('admin'),
        v.literal('auditor'),
        v.literal('teacher'),
        v.literal('tutor')
      )
    ),
  },
  handler: async (ctx, args) => {
    // Obtener solo las relaciones activas
    const userSchools = await ctx.db
      .query('userSchool')
      .filter((q) =>
        q.and(
          q.eq(q.field('userId'), args.userId),
          q.eq(q.field('status'), 'active')
        )
      )
      .collect();

    // Filtrar por rol si se proporciona
    let filteredUserSchools = userSchools;
    if (args.role) {
      filteredUserSchools = userSchools.filter((us) =>
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
    return schoolsWithDetails.filter((result) => result !== null);
  },
});

// Obtener una escuela específica de un usuario
export const getUserSchool = query({
  args: {
    userId: v.id('user'),
    schoolId: v.id('school'),
  },
  handler: async (ctx, args) => {
    // Buscar la relación específica
    const userSchool = await ctx.db
      .query('userSchool')
      .filter((q) =>
        q.and(
          q.eq(q.field('userId'), args.userId),
          q.eq(q.field('schoolId'), args.schoolId)
        )
      )
      .unique();

    if (!userSchool) {
      throw new Error('El usuario no tiene acceso a esta escuela');
    }

    // Obtener los detalles de la escuela
    const school = await ctx.db.get(args.schoolId);
    if (!school) {
      throw new Error('Escuela no encontrada');
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
  },
});

// Obtener la escuela actual del usuario por subdominio
export const getUserSchoolBySubdomain = query({
  args: {
    userId: v.id('user'),
    subdomain: v.string(),
  },
  handler: async (ctx, args) => {
    // Primero buscar la escuela por subdominio
    const school = await ctx.db
      .query('school')
      .withIndex('by_subdomain', (q) => q.eq('subdomain', args.subdomain))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .unique();

    if (!school) {
      throw new Error('Escuela no encontrada o inactiva');
    }

    // Verificar que el usuario tiene acceso a esta escuela
    const userSchool = await ctx.db
      .query('userSchool')
      .filter((q) =>
        q.and(
          q.eq(q.field('userId'), args.userId),
          q.eq(q.field('schoolId'), school._id),
          q.eq(q.field('status'), 'active')
        )
      )
      .unique();

    if (!userSchool) {
      throw new Error('El usuario no tiene acceso a esta escuela');
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
  },
});

// Asignar un usuario a una escuela
export const assignUserToSchool = mutation({
  args: {
    userId: v.id('user'),
    schoolId: v.id('school'),
    role: v.array(
      v.union(
        v.literal('superadmin'),
        v.literal('admin'),
        v.literal('auditor'),
        v.literal('teacher'),
        v.literal('tutor')
      )
    ),
    department: v.optional(
      v.union(
        v.literal('secretary'),
        v.literal('direction'),
        v.literal('schoolControl'),
        v.literal('technology')
      )
    ),
    status: v.optional(v.union(v.literal('active'), v.literal('inactive'))),
  },
  handler: async (ctx, args) => {
    // Verificar que el usuario existe
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar que la escuela existe
    const school = await ctx.db.get(args.schoolId);
    if (!school) {
      throw new Error('Escuela no encontrada');
    }

    // Verificar que no existe ya una relación entre este usuario y escuela
    const existingUserSchool = await ctx.db
      .query('userSchool')
      .filter((q) =>
        q.and(
          q.eq(q.field('userId'), args.userId),
          q.eq(q.field('schoolId'), args.schoolId)
        )
      )
      .unique();

    if (existingUserSchool) {
      throw new Error('El usuario ya está asignado a esta escuela');
    }

    // Crear la relación usuario-escuela
    const userSchoolId = await ctx.db.insert('userSchool', {
      userId: args.userId,
      schoolId: args.schoolId,
      role: args.role,
      status: args.status || 'active',
      department: args.department,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return userSchoolId;
  },
});

// Actualizar la relación usuario-escuela
export const updateUserSchool = mutation({
  args: {
    userSchoolId: v.id('userSchool'),
    role: v.optional(
      v.array(
        v.union(
          v.literal('superadmin'),
          v.literal('admin'),
          v.literal('auditor'),
          v.literal('teacher'),
          v.literal('tutor')
        )
      )
    ),
    department: v.optional(
      v.union(
        v.literal('secretary'),
        v.literal('direction'),
        v.literal('schoolControl'),
        v.literal('technology')
      )
    ),
    status: v.optional(v.union(v.literal('active'), v.literal('inactive'))),
  },
  handler: async (ctx, args) => {
    // Verificar que la relación existe
    const userSchool = await ctx.db.get(args.userSchoolId);
    if (!userSchool) {
      throw new Error('Relación usuario-escuela no encontrada');
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
  },
});

// Remover un usuario de una escuela
export const removeUserFromSchool = mutation({
  args: {
    userSchoolId: v.id('userSchool'),
  },
  handler: async (ctx, args) => {
    // Verificar que la relación existe
    const userSchool = await ctx.db.get(args.userSchoolId);
    if (!userSchool) {
      throw new Error('Relación usuario-escuela no encontrada');
    }

    // Eliminar la relación
    await ctx.db.delete(args.userSchoolId);

    return args.userSchoolId;
  },
});

// Desactivar un usuario en una escuela (cambiar status a inactive)
export const deactivateUserInSchool = mutation({
  args: {
    userSchoolId: v.id('userSchool'),
  },
  handler: async (ctx, args) => {
    // Verificar que la relación existe
    const userSchool = await ctx.db.get(args.userSchoolId);
    if (!userSchool) {
      throw new Error('Relación usuario-escuela no encontrada');
    }

    // Cambiar el status a inactive
    await ctx.db.patch(args.userSchoolId, {
      status: 'inactive',
      updatedAt: Date.now(),
    });

    return args.userSchoolId;
  },
});

// Activar un usuario en una escuela (cambiar status a active)
export const activateUserInSchool = mutation({
  args: {
    userSchoolId: v.id('userSchool'),
  },
  handler: async (ctx, args) => {
    // Verificar que la relación existe
    const userSchool = await ctx.db.get(args.userSchoolId);
    if (!userSchool) {
      throw new Error('Relación usuario-escuela no encontrada');
    }

    // Cambiar el status a active
    await ctx.db.patch(args.userSchoolId, {
      status: 'active',
      updatedAt: Date.now(),
    });

    return args.userSchoolId;
  },
});

// Crear una nueva escuela y asignar al usuario como superadmin
export const createSchoolWithUser = mutation({
  args: {
    name: v.string(),
    subdomain: v.string(),
    shortName: v.string(),
    cctCode: v.string(),
    address: v.string(),
    description: v.string(),
    imgUrl: v.string(),
    phone: v.string(),
    email: v.string(),
    userId: v.string(), // ID del usuario de Clerk
  },
  handler: async (ctx, args) => {
    const currentTime = Date.now();

    // Verificar que el subdominio no exista
    const existingSubdomain = await ctx.db
      .query('school')
      .filter((q) => q.eq(q.field('subdomain'), args.subdomain))
      .first();

    if (existingSubdomain) {
      throw new Error('Ya existe una escuela con ese subdominio');
    }

    // Verificar que el código CCT no exista
    const existingCCT = await ctx.db
      .query('school')
      .filter((q) => q.eq(q.field('cctCode'), args.cctCode))
      .first();

    if (existingCCT) {
      throw new Error('Ya existe una escuela con ese código CCT');
    }

    // Verificar que el nombre corto no exista
    const existingShortName = await ctx.db
      .query('school')
      .filter((q) => q.eq(q.field('shortName'), args.shortName))
      .first();

    if (existingShortName) {
      throw new Error('Ya existe una escuela con ese nombre corto');
    }

    // Crear la escuela
    const schoolId = await ctx.db.insert('school', {
      name: args.name,
      subdomain: args.subdomain.toLowerCase(),
      shortName: args.shortName,
      cctCode: args.cctCode,
      address: args.address,
      description: args.description,
      imgUrl: args.imgUrl || '/default-school.jpg',
      phone: args.phone,
      email: args.email,
      status: 'active',
      createdAt: currentTime,
      updatedAt: currentTime,
    });

    // Buscar si el usuario ya existe en Convex por clerkId
    let user = await ctx.db
      .query('user')
      .filter((q) => q.eq(q.field('clerkId'), args.userId))
      .unique();

    // Si el usuario no existe, crearlo
    if (!user) {
      const userId = await ctx.db.insert('user', {
        name: 'Usuario', // Nombre temporal, se puede actualizar después
        email: args.email, // Usar el email de la escuela como referencia
        clerkId: args.userId,
        status: 'active',
        createdAt: currentTime,
        updatedAt: currentTime,
      });
      user = await ctx.db.get(userId);
    }

    if (!user) {
      throw new Error('Error al crear o obtener el usuario');
    }

    // Crear la relación usuario-escuela con rol superadmin
    const userSchoolId = await ctx.db.insert('userSchool', {
      userId: user._id,
      schoolId: schoolId,
      role: ['superadmin'],
      status: 'active',
      createdAt: currentTime,
      updatedAt: currentTime,
    });

    return {
      schoolId,
      userSchoolId,
      message: 'Escuela creada exitosamente y usuario asignado como superadmin',
    };
  },
});

// Función auxiliar para crear solo la escuela (sin asignar usuario)
export const createSchool = mutation({
  args: {
    name: v.string(),
    subdomain: v.string(),
    shortName: v.string(),
    cctCode: v.string(),
    address: v.string(),
    description: v.string(),
    imgUrl: v.string(),
    phone: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const currentTime = Date.now();

    // Verificar que el subdominio no exista
    const existingSubdomain = await ctx.db
      .query('school')
      .filter((q) => q.eq(q.field('subdomain'), args.subdomain))
      .first();

    if (existingSubdomain) {
      throw new Error('Ya existe una escuela con ese subdominio');
    }

    // Verificar que el código CCT no exista
    const existingCCT = await ctx.db
      .query('school')
      .filter((q) => q.eq(q.field('cctCode'), args.cctCode))
      .first();

    if (existingCCT) {
      throw new Error('Ya existe una escuela con ese código CCT');
    }

    // Verificar que el nombre corto no exista
    const existingShortName = await ctx.db
      .query('school')
      .filter((q) => q.eq(q.field('shortName'), args.shortName))
      .first();

    if (existingShortName) {
      throw new Error('Ya existe una escuela con ese nombre corto');
    }

    // Crear la escuela
    const schoolId = await ctx.db.insert('school', {
      name: args.name,
      subdomain: args.subdomain.toLowerCase(),
      shortName: args.shortName,
      cctCode: args.cctCode,
      address: args.address,
      description: args.description,
      imgUrl: args.imgUrl || '/default-school.jpg',
      phone: args.phone,
      email: args.email,
      status: 'active',
      createdAt: currentTime,
      updatedAt: currentTime,
    });

    return schoolId;
  },
});

// Función auxiliar para crear la relación usuario-escuela
export const createUserSchool = mutation({
  args: {
    clerkId: v.string(), // ID del usuario de Clerk
    schoolId: v.id('school'),
    role: v.array(
      v.union(
        v.literal('superadmin'),
        v.literal('admin'),
        v.literal('auditor'),
        v.literal('teacher'),
        v.literal('tutor')
      )
    ),
    status: v.union(v.literal('active'), v.literal('inactive')),
    department: v.optional(
      v.union(
        v.literal('secretary'),
        v.literal('direction'),
        v.literal('schoolControl'),
        v.literal('technology')
      )
    ),
  },
  handler: async (ctx, args) => {
    const currentTime = Date.now();

    // Verificar que la escuela existe
    const school = await ctx.db.get(args.schoolId);
    if (!school) {
      throw new Error('Escuela no encontrada');
    }

    // Buscar el usuario por clerkId
    const user = await ctx.db
      .query('user')
      .filter((q) => q.eq(q.field('clerkId'), args.clerkId))
      .unique();

    if (!user) {
      throw new Error('Usuario no encontrado. Debe crear el usuario primero.');
    }

    // Verificar que el usuario no esté ya asignado a esta escuela
    const existingUserSchool = await ctx.db
      .query('userSchool')
      .filter((q) =>
        q.and(
          q.eq(q.field('userId'), user._id),
          q.eq(q.field('schoolId'), args.schoolId)
        )
      )
      .first();

    if (existingUserSchool) {
      throw new Error('El usuario ya está asignado a esta escuela');
    }

    // Crear la relación usuario-escuela
    const userSchoolId = await ctx.db.insert('userSchool', {
      userId: user._id,
      schoolId: args.schoolId,
      role: args.role,
      status: args.status,
      department: args.department,
      createdAt: currentTime,
      updatedAt: currentTime,
    });

    return userSchoolId;
  },
});

// Obtener usuarios de una escuela por rol específico
export const getUsersBySchoolAndRole = query({
  args: {
    schoolId: v.id('school'),
    role: v.union(
      v.literal('superadmin'),
      v.literal('admin'),
      v.literal('auditor'),
      v.literal('teacher'),
      v.literal('tutor')
    ),
    status: v.optional(v.union(v.literal('active'), v.literal('inactive'))),
  },
  handler: async (ctx, args) => {
    // Obtener todas las relaciones usuario-escuela para la escuela específica
    const userSchools = await ctx.db
      .query('userSchool')
      .filter((q) =>
        q.and(
          q.eq(q.field('schoolId'), args.schoolId),
          q.eq(q.field('status'), args.status || 'active')
        )
      )
      .collect();

    // Filtrar por rol específico
    const filteredUserSchools = userSchools.filter((us) =>
      us.role.includes(args.role)
    );

    // Obtener los detalles de los usuarios
    const usersWithDetails = await Promise.all(
      filteredUserSchools.map(async (userSchool) => {
        const user = await ctx.db.get(userSchool.userId);
        if (!user || user.status !== 'active') {
          return null;
        }

        return {
          ...user,
          userSchoolId: userSchool._id,
          schoolRole: userSchool.role,
          schoolStatus: userSchool.status,
          department: userSchool.department,
        };
      })
    );

        // Filtrar resultados nulos y retornar
        return usersWithDetails.filter(result => result !== null);
    }
});

// Obtener usuarios de una escuela por múltiples roles
export const getUsersBySchoolAndRoles = query({
    args: {
        schoolId: v.id("school"),
        roles: v.optional(v.array(v.union(
            v.literal("superadmin"),
            v.literal("admin"),
            v.literal("auditor"),
            v.literal("teacher"),
            v.literal("tutor")
        ))),
        status: v.optional(v.union(
            v.literal("active"),
            v.literal("inactive")
        ))
    },
    handler: async (ctx, args) => {
        // Si no se especifican roles, obtener todos
        const targetRoles = args.roles || ["superadmin", "admin", "auditor", "teacher", "tutor"];
        
        // Obtener todas las relaciones usuario-escuela para la escuela específica
        const userSchools = await ctx.db
            .query("userSchool")
            .filter((q) => 
                q.and(
                    q.eq(q.field("schoolId"), args.schoolId),
                    q.eq(q.field("status"), args.status || "active")
                )
            )
            .collect();

        // Filtrar por roles específicos
        const filteredUserSchools = userSchools.filter(us => 
            targetRoles.some(role => us.role.includes(role))
        );

        // Obtener los detalles de los usuarios
        const usersWithDetails = await Promise.all(
            filteredUserSchools.map(async (userSchool) => {
                const user = await ctx.db.get(userSchool.userId);
                if (!user || user.status !== "active") {
                    return null;
                }

                return {
                    ...user,
                    userSchoolId: userSchool._id,
                    schoolRole: userSchool.role,
                    schoolStatus: userSchool.status,
                    department: userSchool.department,
                };
            })
        );

        // Filtrar resultados nulos y retornar
        return usersWithDetails.filter(result => result !== null);
    }
}); 

export const getSchoolById = internalQuery({
    args: { 
        schoolId: v.id("school"),
    },
    handler: async (ctx, args) => {
        const school = await ctx.db.get(args.schoolId);
        if (!school) {
            throw new Error("Escuela no encontrada");
        }
        return school;
    }
}); 