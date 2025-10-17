import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { orderId } = req.query

    if (!orderId) {
      return res.status(400).json({ error: 'Falta orderId' })
    }

    await sanity.patch(orderId).set({
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
    }).commit()

    // Redirige a página de cancelado en tu app
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
    res.writeHead(302, { Location: `${baseUrl}/cancelled` })
    res.end()
  } catch (err) {
    console.error('[order/cancelled]', err)
    res.status(500).json({ error: 'Error marcando cancelado' })
  }
}
