import { internalQuery, mutation, query } from '../_generated/server';
import { v } from 'convex/values';

// CREATE - Crear datos fiscales para un usuario
export const createFiscalData = mutation({
  args: {
    userId: v.id('user'),
    legalName: v.string(),
    taxId: v.string(),
    taxSystem: v.union(
      v.literal('605'), // Sueldos y Salarios
      v.literal('606'), // Arrendamiento
      v.literal('612'), // Actividades Empresariales y Profesionales
      v.literal("616"), // Régimen Simplificado de Confianza
    ),
    cfdiUse: v.union(
      v.literal('G03'), // Gastos en general
      v.literal('D10'), // Pagos por servicios educativos
    ),
    street: v.string(),
    exteriorNumber: v.string(),
    interiorNumber: v.optional(v.string()),
    neighborhood: v.string(),
    city: v.string(),
    state: v.string(),
    zip: v.string(),
    country: v.optional(v.literal('MXN')),
    email: v.string(),
    phone: v.optional(v.string()),
    createBy: v.id('user'),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Verificar que el usuario existe
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar que no existan datos fiscales para este usuario
    const existingFiscalData = await ctx.db
      .query('fiscalData')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .unique();

    if (existingFiscalData) {
      throw new Error('Ya existen datos fiscales para este usuario');
    }

    // Verificar que el RFC no esté duplicado
    const existingTaxId = await ctx.db
      .query('fiscalData')
      .withIndex('by_taxId', (q) => q.eq('taxId', args.taxId))
      .unique();

    if (existingTaxId) {
      throw new Error('Ya existe un registro con este RFC');
    }

    const fiscalDataId = await ctx.db.insert('fiscalData', {
      ...args,
      createdAt: now,
      updatedAt: now,
      updatedBy: args.createBy,
    });

    return fiscalDataId;
  },
});

// READ - Obtener datos fiscales por userId
export const getFiscalDataByUserId = query({
  args: { userId: v.id('user') },
  handler: async (ctx, args) => {
    const fiscalData = await ctx.db
      .query('fiscalData')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .unique();

    return fiscalData;
  },
});

export const getFiscalDataByUserIdInternal = internalQuery({
  args: { userId: v.id('user') },
  handler: async (ctx, args) => {
    const fiscalData = await ctx.db
      .query('fiscalData')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .unique();

    return fiscalData;
  },
});


// READ - Obtener datos fiscales por taxId
export const getFiscalDataByTaxId = query({
  args: { taxId: v.string() },
  handler: async (ctx, args) => {
    const fiscalData = await ctx.db
      .query('fiscalData')
      .withIndex('by_taxId', (q) => q.eq('taxId', args.taxId))
      .unique();

    return fiscalData;
  },
});

// UPDATE - Actualizar datos fiscales
export const updateFiscalData = mutation({
  args: {
    id: v.id('fiscalData'),
    legalName: v.optional(v.string()),
    taxId: v.optional(v.string()),
    taxSystem: v.optional(v.union(
      v.literal('605'), // Sueldos y Salarios
      v.literal('606'), // Arrendamiento
      v.literal('612'), // Actividades Empresariales y Profesionales
      v.literal("616"), // Régimen Simplificado de Confianza
    )),
    cfdiUse: v.optional(v.union(
      v.literal('G03'), // Gastos en general
      v.literal('D10'), // Pagos por servicios educativos
    )),
    street: v.optional(v.string()),
    exteriorNumber: v.optional(v.string()),
    interiorNumber: v.optional(v.string()),
    neighborhood: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zip: v.optional(v.string()),
    country: v.optional(v.literal('MXN')),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    updatedBy: v.id('user'),
  },
  handler: async (ctx, args) => {
    const { id, updatedBy, ...updateData } = args;

    // Verificar que el registro existe
    const existingFiscalData = await ctx.db.get(id);
    if (!existingFiscalData) {
      throw new Error('Datos fiscales no encontrados');
    }

    // Si se está actualizando el RFC, verificar que no esté duplicado
    if (updateData.taxId && updateData.taxId !== existingFiscalData.taxId) {
      const taxIdToCheck = updateData.taxId as string;
      const existingTaxId = await ctx.db
        .query('fiscalData')
        .withIndex('by_taxId', (q) => q.eq('taxId', taxIdToCheck))
        .unique();

      if (existingTaxId && existingTaxId._id !== id) {
        throw new Error('Ya existe un registro con este RFC');
      }
    }

    // Actualizar registro
    await ctx.db.patch(id, {
      ...updateData,
      updatedAt: Date.now(),
      updatedBy,
    });

    return await ctx.db.get(id);
  },
});

// DELETE - Eliminar datos fiscales
export const deleteFiscalData = mutation({
  args: { id: v.id('fiscalData') },
  handler: async (ctx, args) => {
    const existingFiscalData = await ctx.db.get(args.id);
    if (!existingFiscalData) {
      throw new Error('Datos fiscales no encontrados');
    }

    await ctx.db.delete(args.id);
    return { success: true, message: 'Datos fiscales eliminados correctamente' };
  },
});

// READ - Obtener todos los datos fiscales (para admin)
export const getAllFiscalData = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let fiscalData = await ctx.db.query('fiscalData').collect();

    // Aplicar paginación
    if (args.offset) {
      fiscalData = fiscalData.slice(args.offset);
    }

    if (args.limit) {
      fiscalData = fiscalData.slice(0, args.limit);
    }

    return fiscalData;
  },
});