import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2022-08-01' })

export const stripeWebhook = async (req) => {
  // usar body raw
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET
 
  if (!sig || !secret)
    return new Response('Missing stripe-signature or webhook secret', { status: 400 })

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret)
  } catch (err) {
    console.error('[stripeWebhook] signature verification failed:', err?.message || err)
    return new Response(`Webhook Error: ${err?.message || 'invalid signature'}`, { status: 400 })
  }

  try {
    const payload = await getPayloadHMR({ config: configPromise })

    if (event.type === 'checkout.session.completed') {
      const s = event.data.object
      const doc = {
        eventId: s.id,
        type: 'checkout.session',
        sessionId: s.id,
        paymentIntentId: typeof s.payment_intent === 'string' ? s.payment_intent : undefined,
        customerId: typeof s.customer === 'string' ? s.customer : undefined,
        status: s.payment_status || 'unknown',
        metadata: s.metadata || {},
        raw: s,
      }

      const existing = await payload.find({
        collection: 'payments',
        where: { eventId: { equals: s.id } },
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
    }

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object

      const existing = await payload.find({
        collection: 'payments',
        where: { paymentIntentId: { equals: pi.id } },
        limit: 1,
        overrideAccess: true,
      })

      if (existing.totalDocs > 0) {
        await payload.update({
          collection: 'payments',
          id: existing.docs[0].id,
          data: { status: 'succeeded', raw: pi },
          overrideAccess: true,
        })
      } else {
        await payload.create({
          collection: 'payments',
          data: {
            eventId: event.id,
            type: 'payment_intent',
            sessionId: undefined,
            paymentIntentId: pi.id,
            customerId: typeof pi.customer === 'string' ? pi.customer : undefined,
            status: 'succeeded',
            metadata: pi.metadata || {},
            raw: pi,
          },
          overrideAccess: true,
        })
      }
    }

    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error('[stripeWebhook] handler error:', err)
    return new Response('handler failed', { status: 500 })
  }
}
