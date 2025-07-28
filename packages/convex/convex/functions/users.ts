import { mutation, query, internalMutation } from "../_generated/server";
import { v, Validator } from "convex/values";
import { UserJSON } from "@clerk/backend";


//=============== CLERK USERS FUNCTIONS ===============
export const upsertFromClerk = internalMutation({
    args: { data: v.any() as Validator<UserJSON> },
    async handler(ctx, { data }) {
      // Validación de datos requeridos
      if (!data.id) {
        throw new Error("Clerk user ID is required");
      }

      // Manejar email de forma segura
      let email = "";
      if (data.email_addresses && data.email_addresses.length > 0) {
        email = data.email_addresses[0]?.email_address || "";
      }

      // Manejar teléfono de forma segura
      let phone = "";
      if (data.phone_numbers && data.phone_numbers.length > 0) {
        phone = data.phone_numbers[0]?.phone_number || "";
      }

      const userAttributes = {
        name: data.first_name ?? "",
        lastName: data.last_name ?? "",
        email: email,
        phone: phone,
        address: "", // Clerk no proporciona dirección por defecto
        birthDate: "", // Clerk no proporciona fecha de nacimiento por defecto
        admissionDate: "", // Campo específico de tu aplicación
        imgUrl: data.image_url ?? "",
        clerkId: data.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'active' as const,
      };
  
      // Busca por clerkId
      const user = await ctx.db
        .query("user")
        .withIndex("byClerkId", (q) => q.eq("clerkId", data.id))
        .unique();
  
      if (user === null) {
        // Crear nuevo usuario
        await ctx.db.insert("user", userAttributes);
      } else {
        // Actualizar usuario existente, preservando createdAt original
        await ctx.db.patch(user._id, { 
          ...userAttributes, 
          createdAt: user.createdAt
        });
      }
    },
  });


  export const deleteFromClerk = internalMutation({
    args: { clerkUserId: v.string() },
    async handler(ctx, { clerkUserId }) {
      const user = await ctx.db
        .query("user")
        .withIndex("byClerkId", (q) => q.eq("clerkId", clerkUserId))
        .unique();
      if (user !== null) {
        await ctx.db.delete(user._id);
      }
    },
  });



//=============== USERS FUNCTIONS ===============
export const createUser = mutation({
    args: { 
        name: v.string(),
        lastName: v.string(),
        email: v.string(),
        phone: v.string(),
        address: v.string(),
        birthDate: v.string(),
        admissionDate: v.string(),
        imgUrl: v.string(),
        clerkId: v.string(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        await ctx.db.insert('user', { 
            ...args,
            createdAt: now,
            updatedAt: now,
            status: 'active',
        });
    }
});

export const getUsers = query({
    args: {

    },
    handler: async (ctx, args) => {
        return ctx.db.query("user").collect();
    }
});