import { stripeWebhook } from '@/enpoints/stripeWebhook' // o el path donde pusiste tu función

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  return stripeWebhook(req)
}
