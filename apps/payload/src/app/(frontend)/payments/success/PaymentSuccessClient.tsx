'use client'

/**
 * Componente de “Éxito de pago” que:
 * - Lee sessionId desde props o desde la URL (?sessionId / ?session_id)
 * - Llama a tu endpoint /payment-session (POST por defecto)
 * - Si el servidor responde 405 (Method Not Allowed), hace fallback a GET
 * - Muestra datos amigables del pago (estado, monto, tarjeta, etc.)
 */

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

/** Estructura de datos que esperamos del backend */
type Data = {
  sessionId: string
  status?: string
  amount?: number | null
  currency?: string
  name?: string
  email?: string
  phone?: string
  schoolName?: string
  userName?: string
  cardBrand?: string
  cardLast4?: string
}

export default function PaymentSuccessClient({ sessionId: sessionIdProp }: { sessionId?: string }) {
  const params = useSearchParams()

  //
  const sessionId =
    sessionIdProp ?? params.get('sessionId') ?? params.get('session_id') ?? undefined

  // 2) Estados locales
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // 3) Efecto: cuando tengamos sessionId, consultamos /payment-session
  useEffect(() => {
    if (!sessionId) return
    setLoading(true)
    ;(async () => {
      try {
        // --- Llamada principal: POST /payment-session ---
        let res = await fetch('/api/payment-session', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })

        // --- Fallback a GET si el server devuelve 405 (Method Not Allowed) ---
        // Esto te cubre si en tu payload.config.ts aún no registraste el método POST
        if (res.status === 405) {
          res = await fetch(`/payment-session?sessionId=${encodeURIComponent(sessionId)}`)
        }

        const json = await res.json()
        if (!res.ok) {
          // Si hay error, mostramos el mensaje devuelto por el server (si existe)
          throw new Error(json?.error || 'No se pudo obtener la sesión')
        }

        setData(json as Data)
        setError(null)
      } catch (e: unknown) {
        if (e instanceof Error) {
          // 'e' is now known to be an instance of Error, so you can access its properties
          setError(e?.message || 'Error cargando la sesión')
        } else if (typeof e === 'string') {
          // Handle cases where a string was thrown
          setError(e)
        } else {
          // Handle other unexpected types of thrown values
          setError('Error cargando la sesión')
        }

        setData(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [sessionId])

  // 4) Vistas de estado
  if (!sessionId) {
    // Mensaje claro si falta el parámetro en la URL
    return (
      <p className="mt-6 text-sm text-red-600">
        Falta <code>sessionId</code> en la URL.
      </p>
    )
  }

  if (loading) {
    return <p className="mt-6">Cargando comprobante...</p>
  }

  if (error) {
    return <p className="mt-6 text-sm text-red-600">{error}</p>
  }

  if (!data) {
    // Nada que mostrar (por ejemplo, mientras se resuelve la primera carga)
    return null
  }

  // 5) Render de datos (ajústalo a tu gusto)
  return (
    <div className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-600">
        Session: <code>{data.sessionId}</code>
      </p>

      <h2 className="mt-2 text-xl font-semibold">Estado: {data.status ?? '—'}</h2>

      {data.amount != null && (
        <p className="mt-1">
          Monto: {data.amount} {data.currency?.toUpperCase()}
        </p>
      )}

      {data.name && <p className="mt-1">Nombre: {data.name}</p>}
      {data.email && <p className="mt-1">Email: {data.email}</p>}

      {data.cardBrand && data.cardLast4 && (
        <p className="mt-1">
          Tarjeta: {data.cardBrand} •••• {data.cardLast4}
        </p>
      )}
    </div>
  )
}
