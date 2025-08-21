import { stripeWebhook } from '@/endpoints/stripeWebhook'

export const runtime = 'nodejs'
export async function POST(req: Request) {
  return stripeWebhook(req)
}
