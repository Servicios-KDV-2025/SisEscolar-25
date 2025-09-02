import { mutation, query } from "../_generated/server";
import { v } from "convex/values";


//creamos aulas
export const createClassroom = mutation({
    args:{
        schoolId: v.id("school"),
        name: v.string(),
        capacity: v.number(),
        location: v.optional(v.string()),
        status: v.union(v.literal("active"), v.literal("inactive")),
        createdAt: v.number(),
        updatedAt: v.number(),

    },
    handler: async (ctx, args) => {
        
        await ctx.db.insert("classroom", {
            schoolId: args.schoolId,
            name: args.name,
            capacity: args.capacity,
            location: args.location || "",
            status: args.status,
            createdAt: args.createdAt,
            updatedAt: args.updatedAt
        });
    },
});


//obtener todas las aulas de una escuela 
export const viewAllClassrooms = query({
  args: { schoolId: v.id("school") },
  handler: async (ctx, args) => {
    const aulas = await ctx.db
      .query("classroom")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    return aulas.map(({ _id, ...rest }) => ({
      id: _id,
      ...rest,
    }));
  },
});


//ver aulas por estado : active o inactive
export const viewPerStatus = query({
    args: {
        schoolId: v.id("school"),
        status: v.union(v.literal("active"), v.literal("inactive")),
    },

    handler: async (ctx, args) =>{
        const aulas = await ctx.db
            .query("classroom")
            .withIndex("by_status", (q) => q.eq("status", args.status))
            .collect();
        // Filtrar las aulas por schoolId (indice es solo por status)
        return aulas
            .filter((aula)=> aula.schoolId === args.schoolId)
            .map(({ _id, ...rest }) => ({
                id: _id,
                ...rest,
                }));
    },
});


//ver aula por ID
export const viewById = query({
    args: {
        id: v.id("classroom"),
        schoolId: v.id("school"),
    },

    handler: async (ctx, args) =>{
        const aula = await ctx.db.get(args.id);
        if (!aula || aula.schoolId !== args.schoolId) {
            throw new Error("Aula no encontrada o no pertenece a la escuela");
        }
        const { _id, ...rest } = aula;
        return { id: _id, ...rest };
    },
});


//actualizar un aula
export const updateClassroom = mutation({
  args: {
    id: v.id("classroom"),
    schoolId: v.id("school"),
    name: v.string(),
    capacity: v.number(),
    location: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("inactive")),
    updatedAt: v.number(),
  },
    handler: async (ctx, args) => {
    const aula = await ctx.db.get(args.id);
    if (!aula || aula.schoolId !== args.schoolId) {
        throw new Error("Accesso denegado");
    }

    const {id, schoolId, ...data} = args;
    await ctx.db.patch(id, {...data, updatedAt: Date.now()});
},
});

//eliminar un aula 
export const deleteClassroom = mutation({
    args: {
        id: v.id("classroom"),
        schoolId: v.id("school")
    },
    handler: async (ctx, args) => {
        const aula = await ctx.db.get(args.id);
        if (!aula || aula.schoolId !== args.schoolId) {
            throw new Error("Accesso denegado");
        }
        await ctx.db.delete(args.id);
    },
});



