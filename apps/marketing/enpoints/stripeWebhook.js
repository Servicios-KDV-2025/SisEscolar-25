import Stripe from 'stripe'
import sanityClient from '@sanity/client'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

// Configura tu cliente de Sanity
const sanity = sanityClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2025-10-16',
  token: process.env.SANITY_WRITE_TOKEN, // Necesario para crear/actualizar documentos
  useCdn: false,
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed')
  }

  const rawBody = await req.text()
  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return res.status(400).send('Missing stripe-signature or webhook secret')
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    console.error('[stripeWebhook] signature verification failed:', err?.message || err)
    return res.status(400).send(`Webhook Error: ${err?.message || 'invalid signature'}`)
  }

  try {
    // Checkout Session Completed
    if (event.type === 'checkout.session.completed') {
      const s = event.data.object
      const doc = {
        _type: 'payment',
        eventId: s.id,
        type: 'checkout.session',
        sessionId: s.id,
        paymentIntentId: typeof s.payment_intent === 'string' ? s.payment_intent : undefined,
        customerId: typeof s.customer === 'string' ? s.customer : undefined,
        status: s.payment_status || 'unknown',
        metadata: s.metadata || {},
        raw: s,
      }

      const existing = await sanity.fetch(`*[_type=="payment" && eventId==$eventId][0]`, { eventId: s.id })

      if (existing) {
        await sanity.patch(existing._id).set(doc).commit()
      } else {
        await sanity.create(doc)
      }
    }

    // Payment Intent Succeeded
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object
      const existing = await sanity.fetch(`*[_type=="payment" && paymentIntentId==$piId][0]`, { piId: pi.id })

      const doc = {
        _type: 'payment',
        eventId: event.id,
        type: 'payment_intent',
        paymentIntentId: pi.id,
        customerId: typeof pi.customer === 'string' ? pi.customer : undefined,
        status: 'succeeded',
        metadata: pi.metadata || {},
        raw: pi,
      }

      if (existing) {
        await sanity.patch(existing._id).set(doc).commit()
      } else {
        await sanity.create(doc)
      }
    }

    return res.status(200).send('ok')
  } catch (err) {
    console.error('[stripeWebhook] handler error:', err)
    return res.status(500).send('handler failed')
  }
}
