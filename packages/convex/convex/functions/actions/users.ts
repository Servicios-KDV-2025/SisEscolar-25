"use node";
import { action } from "../../_generated/server";
import { v } from "convex/values";
import { createClerkClient } from "@clerk/backend";
import { sendEmail } from "../../http";
 
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
});

import { Resend } from "resend";
import { inviteUserTemplate } from "../../templates/inviteUser";

const resend = new Resend(process.env.RESEND_API_KEY);

export const inviteUser = action({
  args: {
    email: v.string(),
    name: v.string(),
    lastName: v.string(),
    role: v.string(), // "admin", "tutor", etc.
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    try {
      // 1. Check if user exists in Clerk
      const existingUsers = await ClerkClient.users.getUserList({
        emailAddress: [args.email],
      });

      let userId = "";

      if (existingUsers.data.length > 0) {
        // User exists, we can either error out or just generate a token for them.
        // For this flow, let's assume we want to invite new users.
        // But if they exist, maybe we just want to send them a login link?
        // Let's error for now as per requirements "manejar el error adecuadamente"
        // implying it might be an error condition if we expect a NEW user.
        // However, if the user was created but never logged in, we might want to resend.
        // Let's stick to "Error: User already exists" for safety.
        return {
            success: false,
            error: "El usuario ya existe en el sistema.",
        };
      }

      // 2. Create Clerk User
      const user = await ClerkClient.users.createUser({
        emailAddress: [args.email],
        firstName: args.name,
        lastName: args.lastName,
        skipPasswordChecks: true,
        skipPasswordRequirement: true,
        publicMetadata: {
            role: args.role,
            numero: args.phone,
            direccion: args.address,
        }
      });
      userId = user.id;

      // 3. Generate Sign-in Token
      const signInToken = await ClerkClient.signInTokens.createSignInToken({
        userId,
        expiresInSeconds: 2592000, // 30 days
      });

      // 4. Send Email
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const inviteUrl = `${appUrl}/accept-invite?token=${signInToken.token}`;
      
      console.log("Resend attempt:", { email: args.email, from: `Sistema Escolar <${"sistema.escolar@ekardex.app"}>` });
      
    // const { data, error } = await sendEmail(args.email, "Invitación a la plataforma", inviteUserTemplate({
    //     name: args.name,
    //     inviteUrl,
    //   }));

      const { data, error } = await resend.emails.send({
        // from: `Sistema Escolar <${"sistema.escolar@ekardex.app"}>`,
        from: `Sistema Escolar <${"sistema.escolar@ekardex.app"}>`,
        to: [args.email],
        subject: "Invitación a la plataforma",
        html: inviteUserTemplate({
            name: args.name,
            inviteUrl,
        }),
      });

      console.log("Resend response:", { data, error });

      if (error) {
        console.error("Error sending email:", error);
        return {
            success: false,
            error: `Usuario creado pero falló el envío del correo: ${error.message}`,
            userId,
        };
      }

      return {
        success: true,
        message: "Invitación enviada correctamente",
        userId,
      };

    } catch (error: any) {
      console.error("Error in inviteUser:", error);
      return {
        success: false,
        error: error.message || "Error desconocido al invitar usuario",
      };
    }
  },
});