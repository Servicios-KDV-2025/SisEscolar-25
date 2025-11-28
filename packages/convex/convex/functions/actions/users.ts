"use node";
import { action } from "../../_generated/server";
import { v } from "convex/values";
import { createClerkClient } from "@clerk/backend";
 
const ClerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});
 
export const createUser = action(
    {
        args: {
            email: v.string(),
            password: v.string(),
            name: v.string(),
            lastName: v.string(),
            phone: v.optional(v.string()), // <-- Agregado para permitir phone
            address: v.optional(v.string()), // <-- Agregado si también usas address
        },
        handler: async (_ctx, args) => {
 
            try {
                const existingUsers = await ClerkClient.users.getUserList({
                    emailAddress: [args.email],
                });
 
                if (existingUsers.data.length > 0) {
                    return {
                        error: "El usuario ya existe",
                        success: false,
                    }
                }
 
                //crea el usuario en clerk
                const user = await ClerkClient.users.createUser({
                    emailAddress: [args.email],
                    password: args.password,
                    firstName: args.name,
                    lastName: args.lastName,
                    publicMetadata:{ 
                        "direccion":args.address,
                        "numero": args.phone,
                    }
                });
                       
                return {
                    message: "Se creó el usuario en Clerk",
                    success: true,
                    userId: user.id,
                }
            }
            catch (error) {
                console.error("Error al crear usuario:", error);
                return {
                    error: error,
                    success: false,
                }
            }
 
        }  
    }
);
 
export const updateUser = action(
    {
        args: {
            userId: v.string(),
            email: v.optional(v.string()),
            password: v.optional(v.string()),
            name: v.optional(v.string()),
            lastName: v.optional(v.string()),
            phone: v.optional(v.string()),
            address: v.optional(v.string()),
        },
 
        handler: async (_ctx, args) => {
            try {
 
                const updateData: any = {};
                if (args.email) updateData.emailAddress = [args.email];
                if (args.password) updateData.password = args.password;
                if (args.name) updateData.firstName = args.name;
                if (args.lastName) updateData.lastName = args.lastName;

                 updateData.publicMetadata = {
                    "numero": args.phone || '',
                    "direccion": args.address || '',
                };
 
                const updatedUser = await ClerkClient.users.updateUser(args.userId, updateData);
 
                return {
                    message: "Se actualizó el usuario en Clerk",
                    success: true,
                    userId: updatedUser.id,
                }
            }
            catch (error) {
                console.error("Error updating user:", error);
                return {
                    error: "Error al actualizar el usuario en Clerk por favor intente de nuevo",
                    success: false,
                }
            }
        }
    }
);
 
export const deleteUser = action({
    args: {
        userId: v.string(),
    },
    handler: async (_ctx, args) => {
        try {
            await ClerkClient.users.deleteUser(args.userId);
            return {
                message: "Se eliminó el usuario en Clerk",
                success: true,
            }
        }
        catch (error) {
            console.error("Error deleting user:", error);
        }
    }
})