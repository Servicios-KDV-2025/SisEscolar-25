import  stripeWebhook  from '@/enpoints/stripeWebhook'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  return stripeWebhook(req)
}
