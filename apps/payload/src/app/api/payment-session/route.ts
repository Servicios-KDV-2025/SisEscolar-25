import { paymentSession } from '@/endpoints/paymentSession'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  return paymentSession(req)
}

export async function POST(req: Request) {
  return paymentSession(req)
}
