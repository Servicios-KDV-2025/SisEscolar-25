'use client'
import { useSession, useUser } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import React, { useState } from 'react'
import { useAuth } from '@clerk/nextjs'

type Props = { priceId: string; schoolId?: string; endpoint?: string; id?: string ; userId : string}

export default function PayNowButton({
  priceId,
  schoolId,
  userId,
  endpoint = '/api/checkout',
  id = 'pay-now',
}: Props) {
  const [loading, setLoading] = useState(false)
  const { isSignedIn, userId } = useAuth()   //  AQUÍ nace userId (cliente)

  const resolveSchoolId = () =>
    schoolId ??
    (typeof window !== 'undefined' ? (localStorage.getItem('schoolId') ?? undefined) : undefined)

  const handleClick = async () => {
    if (!priceId) return alert('Falta priceId')
    const finalSchoolId = resolveSchoolId()
    if (!finalSchoolId) return alert('Selecciona una escuela antes de pagar')

    if (process.env.NODE_ENV === 'production' && !isSignedIn) {
      alert('Inicia sesión para continuar')
      return
    }

    try {
      setLoading(true)
      const body: any = { priceId, schoolId: finalSchoolId }
      // Fallback solo en DEV (si el server no ve la cookie de Clerk)
      if (process.env.NODE_ENV !== 'production' && userId) body.userId = userId

      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',                 //  manda cookies de Clerk
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok && data?.url) window.location.href = data.url
      else alert(data?.error || 'No autorizado')
    } catch (e) {
      console.error('Checkout failed', e)
      alert('Error al iniciar el checkout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button id={id} onClick={handleClick} disabled={loading || !priceId}>
      {loading ? 'Redirigiendo…' : 'Pagar ahora'}
    </button>
  )
}
