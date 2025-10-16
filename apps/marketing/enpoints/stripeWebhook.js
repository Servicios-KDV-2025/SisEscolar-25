import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2022-08-01' })

const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID
const SANITY_DATASET = process.env.SANITY_DATASET || 'production'
const SANITY_TOKEN = process.env.SANITY_TOKEN
const SANITY_API_BASE = `https://${SANITY_PROJECT_ID}.api.sanity.io/v1`

if (!SANITY_PROJECT_ID || !SANITY_TOKEN) {
  console.warn('SANITY_PROJECT_ID or SANITY_TOKEN not set. Sanity calls will fail.')
}

async function upsertToSanity(doc) {
  // usamos createOrReplace — requiere _id en el doc
  const url = `${SANITY_API_BASE}/data/mutate/${encodeURIComponent(SANITY_DATASET)}`
  const body = {
    mutations: [
      {
        createOrReplace: doc,
      },
    ],
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SANITY_TOKEN}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Sanity upsert failed: ${res.status} ${text}`)
  }
  return res.json()
}

export const stripeWebhook = async (req) => {
  // Leer body raw: stripe necesita el raw body para verificar la firma
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !secret) {
    return new Response('Missing stripe-signature or webhook secret', { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret)
  } catch (err) {
    console.error('[stripeWebhook] signature verification failed:', err?.message || err)
    return new Response(`Webhook Error: ${err?.message || 'invalid signature'}`, { status: 400 })
  }

  try {
    // Manejo de eventos que te interesan
    if (event.type === 'checkout.session.completed') {
      const s = event.data.object

      // Crear documento para Sanity. Usamos un _id determinístico para upsert
      const doc = {
        _id: `payment-${s.id}`, // id único en Sanity
        _type: 'payment',       // asegúrate de tener este tipo definido en tu esquema de Sanity
        eventId: s.id,
        type: 'checkout.session',
        sessionId: s.id,
        paymentIntentId: typeof s.payment_intent === 'string' ? s.payment_intent : null,
        customerId: typeof s.customer === 'string' ? s.customer : null,
        status: s.payment_status || 'unknown',
        metadata: s.metadata || {},
        raw: s, // guarda objeto completo (podría ser pesado; opcional)
        _createdAt: new Date().toISOString(),
      }

      await upsertToSanity(doc)
    }

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object

      const doc = {
        _id: `payment-${pi.id}`,
        _type: 'payment',
        eventId: event.id,
        type: 'payment_intent',
        sessionId: null,
        paymentIntentId: pi.id,
        customerId: typeof pi.customer === 'string' ? pi.customer : null,
        status: 'succeeded',
        metadata: pi.metadata || {},
        raw: pi,
        _createdAt: new Date().toISOString(),
      }

      await upsertToSanity(doc)
    }

    // Puedes añadir más eventos si los necesitas

    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error('[stripeWebhook] handler error:', err)
    return new Response('handler failed', { status: 500 })
  }
}
