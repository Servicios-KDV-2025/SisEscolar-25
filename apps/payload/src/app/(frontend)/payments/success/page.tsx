import type { Metadata } from 'next'
import Link from 'next/link'
import PaymentSuccessClient from './PaymentSuccessClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Pago realizado',
  description: 'Gracias por tu compra. Confirmación de pago.',
}

type Args = {
  // En App Router searchParams puede ser un Promise
  searchParams: Promise<{ sessionId?: string; session_id?: string }>
}

export default async function PaymentSuccessPage({ searchParams }: Args) {
  const sp = await searchParams
  const sessionId = sp.sessionId ?? sp.session_id
console.log(sessionId);
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <header className="text-center">
          <h1 className="text-3xl font-bold">¡Pago recibido!</h1>
          <p className="mt-2 text-gray-600">Estamos procesando tu comprobante.</p>
        </header>
        
        {/* El cliente hará POST a /payment-session */}
        <PaymentSuccessClient sessionId={sessionId} />

        <div className="mt-10 flex items-center justify-center gap-3">
          <Link href="/" className="rounded-xl bg-black px-4 py-2 text-white hover:opacity-90">
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  )
}
