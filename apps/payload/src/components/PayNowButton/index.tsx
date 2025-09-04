'use client'
import { useSession, useUser } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import React, { useState } from 'react'
import { useAuth } from '@clerk/nextjs'

type Props = { priceId: string; schoolId?: string; endpoint?: string; id?: string; userId: string }

export default function PayNowButton({
  priceId,
  schoolId,
  userId,
  endpoint = '/api/checkout',
  id = 'pay-now',
}: Props) {
  const [loading, setLoading] = useState(false)

  const resolveSchoolId = () =>
    schoolId ??
    (typeof window !== 'undefined' ? (localStorage.getItem('schoolId') ?? undefined) : undefined)

  const handleClick = async () => {
    if (!priceId) return alert('Falta priceId')

    const finalSchoolId = resolveSchoolId()

    if (!finalSchoolId) return alert('Selecciona una escuela antes de pagar')

    try {
      setLoading(true)

      const body: any = { priceId, schoolId: finalSchoolId, userName: userId }

      if (process.env.NODE_ENV !== 'production' && userId) body.userId = userId // fallback dev

      const res = await fetch(endpoint, {
        method: 'POST',

        credentials: 'include', //  envía cookies (Clerk)

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (res.ok && data?.url) window.location.href = data.url
      else alert(data?.error || 'Unauthorized')
    } catch (e) {
      console.error('Checkout failed', e)

      alert('Error al iniciar el checkout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      id={id}
      onClick={handleClick}
      disabled={loading || !priceId}
      className={`
    w-full sm:w-auto px-6 py-3 rounded-full text-white font-semibold
    bg-red-500 hover:bg-red-600 active:bg-red-700
    transition-colors duration-200
    disabled:bg-red-300 disabled:cursor-not-allowed
    shadow-md hover:shadow-lg
  `}
    >
      {loading ? 'Redirigiendo…' : 'Pagar ahora'}
    </button>
  )
}
