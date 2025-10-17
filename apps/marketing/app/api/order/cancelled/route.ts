import cancelled from '@/enpoints/cancelled'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  return cancelled(req)
}

export async function POST(req: Request) {
  return cancelled(req)
}
