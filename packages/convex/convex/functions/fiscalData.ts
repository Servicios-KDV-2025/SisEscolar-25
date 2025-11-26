import { internalQuery, mutation, query } from '../_generated/server';
import { v } from 'convex/values';

export const createFiscalData = mutation({
  args: {
    userId: v.id('user'),
    legalName: v.string(),
    taxId: v.string(),
    taxSystem: v.union(
      v.literal('605'),
      v.literal('606'),
      v.literal('612'),
      v.literal("616"),
    ),
    cfdiUse: v.union(
      v.literal('G03'),
      v.literal('D10'),
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

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const existingFiscalData = await ctx.db
      .query('fiscalData')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .unique();

    if (existingFiscalData) {
      throw new Error('Ya existen datos fiscales para este usuario');
    }

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

export const updateFiscalData = mutation({
  args: {
    id: v.id('fiscalData'),
    legalName: v.optional(v.string()),
    taxId: v.optional(v.string()),
    taxSystem: v.optional(v.union(
      v.literal('605'),
      v.literal('606'),
      v.literal('612'),
      v.literal("616"),
    )),
    cfdiUse: v.optional(v.union(
      v.literal('G03'),
      v.literal('D10'),
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

    const existingFiscalData = await ctx.db.get(id);
    if (!existingFiscalData) {
      throw new Error('Datos fiscales no encontrados');
    }

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

    await ctx.db.patch(id, {
      ...updateData,
      updatedAt: Date.now(),
      updatedBy,
    });

    return await ctx.db.get(id);
  },
});

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