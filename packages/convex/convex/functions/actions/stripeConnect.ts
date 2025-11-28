"use node";

import { v } from "convex/values";
import { action } from "../../_generated/server";
import Stripe from "stripe";
import { internal } from "../../_generated/api";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // apiVersion: "2025-07-30.basil",
  apiVersion: "2025-10-29.clover",
});

// Crear una cuenta conectada para una escuela
export const createConnectedAccount = action({
  args: {
    schoolId: v.id("school"),
    email: v.string(),
  },
  handler: async (ctx, args): Promise<{ accountId: string, message: string }> => {
    const school = await ctx.runQuery(internal.functions.schools.getSchoolForConnect, {
      schoolId: args.schoolId,
    });

    if (school.stripeAccountId) {
      throw new Error("La escuela ya tiene una cuenta conectada");
    }

    // Crear la cuenta conectada en Stripe
    const account = await stripe.accounts.create({
      type: "express",
      country: "MX",
      email: args.email,
      capabilities: {
        card_payments: {
          requested: true,
        },
        transfers: {
          requested: true,
        },
        oxxo_payments: {
          requested: true,
        },
        
      },
      business_profile: {
        name: school.name,
      },
    });

    // Guardar el ID de la cuenta conectada en la base de datos
    await ctx.runMutation(internal.functions.schools.saveStripeAccountId, {
      schoolId: args.schoolId,
      stripeAccountId: account.id,
      stripeAccountStatus: "pending",
      stripeOnboardingComplete: false,
    });

    return {
      accountId: account.id,
      message: "Cuenta creada exitosamente",
    };
  },
});

// Crear un Account Link para onboarding
export const createAccountLink = action({
  args: {
    schoolId: v.id("school"),
    returnUrl: v.string(),
    refreshUrl: v.string(),
  },
  handler: async (ctx, args): Promise<{ url: string }> => {
    const school = await ctx.runQuery(internal.functions.schools.getSchoolForConnect, {
      schoolId: args.schoolId,
    });

    if (!school.stripeAccountId) {
      throw new Error("La escuela no tiene una cuenta de Stripe");
    }

    // Creamos el Link de onboarding
    const accountLink = await stripe.accountLinks.create({
      account: school.stripeAccountId,
      refresh_url: args.refreshUrl,
      return_url: args.returnUrl,
      type: "account_onboarding",
    });
    console.log(accountLink.url)

    return {
      url: accountLink.url,
    };
  },
});

// Crear un login Link para que la escuela acceda a su dashboard de Stripe
export const createLoginLink = action({
  args: {
    schoolId: v.id("school"),
  },
  handler: async (ctx, args): Promise<{ url: string }> => {
    const school = await ctx.runQuery(internal.functions.schools.getSchoolForConnect, {
      schoolId: args.schoolId,
    });

    if (!school.stripeAccountId) {
      throw new Error("La escuela no tiene una cuenta de Stripe");
    }

    if (!school.stripeOnboardingComplete) {
      throw new Error("La escuela no ha completado el onboarding de Stripe");
    }

    // Crear un login Link para que accedan a su dashboard de stripe
    const loginLink = await stripe.accounts.createLoginLink(school.stripeAccountId);

    return {
      url: loginLink.url,
    };
  },
});

// Verificar el estado de la cuenta conectada
export const checkAccountStatus = action({
  args: {
    schoolId: v.id("school"),
  },
  handler: async (ctx, args): Promise<{ hasAccount: boolean, isComplete: boolean, chargesEnabled: boolean, payoutsEnabled: boolean, detailsSubmitted: boolean, requireAction: boolean, hasExternalAccount: boolean }> => {
    const school = await ctx.runQuery(internal.functions.schools.getSchoolForConnect, {
      schoolId: args.schoolId,
    });

    if (!school.stripeAccountId) {
      return {
        hasAccount: false,
        isComplete: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        requireAction: true,
        hasExternalAccount: false,
      };
    }

    const account = await stripe.accounts.retrieve(school.stripeAccountId);

    const isComplete = account.charges_enabled && account.payouts_enabled;

    await ctx.runMutation(internal.functions.schools.updateAccountStatus, {
      schoolId: args.schoolId,
      stripeAccountStatus: isComplete ? "enabled" : account.charges_enabled ? "pending" : "disabled",
      stripeOnboardingComplete: isComplete,
    });

    return {
      hasAccount: true,
      isComplete,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requireAction: !isComplete,
      hasExternalAccount: account.external_accounts ? account.external_accounts.data.length > 0 : false,
    };
  },
});

// Obtener balance de la cuenta conectada
export const getAccountBalance = action({
  args: {
    schoolId: v.id("school"),
  },
  handler: async (ctx, args): Promise<{ available: number, pending: number, currency: string }> => {
    const school = await ctx.runQuery(internal.functions.schools.getSchoolForConnect, {
      schoolId: args.schoolId,
    });

    if (!school.stripeAccountId) {
      throw new Error("La escuela no tiene una cuenta de Stripe");
    }

    // Obtenemos el balance de la cuenta de Stripe
    const balance = await stripe.balance.retrieve({
      stripeAccount: school.stripeAccountId,
    });

    return {
      available: balance.available[0]?.amount || 0,
      pending: balance.pending[0]?.amount || 0,
      currency: balance.available[0]?.currency || "mxn",
    };
  },
});


