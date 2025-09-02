import { stripeCheckout } from '@/endpoints/stripeCheckout'

export const runtime = 'nodejs' 
export async function POST(req: Request) {
  return stripeCheckout(req)
}
