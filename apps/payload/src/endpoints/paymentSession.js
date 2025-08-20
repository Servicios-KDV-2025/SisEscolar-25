import Stripe from 'stripe'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '../payload.config'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-08-01' })

export const paymentSession = async (req) => {
  try {
    const { sessionId } = (await req.json().catch(() => ({}))) || {}
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Missing sessionId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const payload = await getPayloadHMR({ config: configPromise })
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['customer'] })

    const doc = {
      eventId: session.id,
      type: 'checkout.session',
      sessionId: session.id,
      paymentIntentId:
        typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
      customerId: typeof session.customer === 'string' ? session.customer : undefined,
      status: session.payment_status || 'unknown',
      metadata: session.metadata || {},
      raw: session,
    }

    const existing = await payload.find({
      collection: 'payments',
      where: { eventId: { equals: session.id } },
      limit: 1,
      overrideAccess: true,
    })

    if (existing.totalDocs > 0) {
      await payload.update({
        collection: 'payments',
        id: existing.docs[0].id,
        data: doc,
        overrideAccess: true,
      })
    } else {
      await payload.create({ collection: 'payments', data: doc, overrideAccess: true })
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const msg = error?.message || 'Unexpected error'
    console.error('[paymentSession]', msg)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
