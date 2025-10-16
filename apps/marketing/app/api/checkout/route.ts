import  { stripeCheckout } from '@/enpoints/stripeCheckout'

export const runtime = 'nodejs' 
export async function POST(req: Request) {
  return stripeCheckout(req)
}
