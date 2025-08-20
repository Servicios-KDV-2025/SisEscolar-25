import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2022-08-01' })

export const stripeCheckout = async (req) => {
  try {
    const body = (await req.json().catch(() => ({}))) || {}
    const { priceId, schoolName, userName } = body

    if (!priceId || typeof priceId !== 'string' || !priceId.startsWith('price_')) {
      return new Response(
        JSON.stringify({ error: 'priceId inválido o vacío (debe empezar con "price_")' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    const serverURL =
      process.env.NEXT_PUBLIC_SERVER_URL || process.env.SERVER_URL || 'http://localhost:3000'

    const metadata = {
      schoolName: String(schoolName ?? ''), // lo guardamos para referencia
      userName: String(userName ?? ''),
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${serverURL}/success?sessionId={CHECKOUT_SESSION_ID}`,
      cancel_url: `${serverURL}/cancelled`,
      metadata,
      payment_intent_data: { metadata },
    })

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const msg = error?.raw?.message || error?.message || 'Error creando sesión de Stripe'
    console.error('[stripeCheckout]', msg)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
