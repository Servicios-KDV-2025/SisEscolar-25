import { action, mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Genera una URL de subida para un archivo
 * Esta URL es temporal y se usa para subir el archivo desde el cliente
 */
export const generateUploadUrl = action({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Obtiene la URL permanente de un archivo almacenado
 * Esta URL no expira y se puede usar para mostrar la imagen
 */
export const getFileUrl = action({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

/**
 * Elimina un archivo del storage
 */
export const deleteFile = action({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.storage.delete(args.storageId);
    return { success: true };
  },
});

