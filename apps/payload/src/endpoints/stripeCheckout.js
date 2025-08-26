import Stripe from 'stripe'
import { auth } from '@clerk/nextjs/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2023-10-16' })

export const stripeCheckout = async (req) => {
  try {
    const { userId } = auth()
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = (await req.json().catch(() => ({}))) || {}
    const { priceId, schoolId, schoolName, userName } = body

    if (!priceId || typeof priceId !== 'string' || !priceId.startsWith('price_')) {
      return new Response(JSON.stringify({ error: 'priceId inválido (debe empezar con "price_")' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }
    if (!schoolId) {
      return new Response(JSON.stringify({ error: 'Falta schoolId' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }

    const appURL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
    const metadata = {
      userId,                       // Clerk userId → lo mapearás a Convex en el webhook
      schoolId: String(schoolId),
      schoolName: String(schoolName ?? ''),
      userName: String(userName ?? ''),
    }

    //  Detecta si el price es recurrente
    const price = await stripe.prices.retrieve(priceId)
    const isRecurring = Boolean(price.recurring)

    const session = await stripe.checkout.sessions.create({
      mode: isRecurring ? 'subscription' : 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      success_url: `${appURL}/checkout/success?checkoutId={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${appURL}/checkout/cancel`,
      metadata,
      ...(isRecurring ? { subscription_data: { metadata } } : {}),
    })

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const msg = error?.raw?.message || error?.message || 'Error creando sesión de Stripe'
    console.error('[stripeCheckout]', msg)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
}
