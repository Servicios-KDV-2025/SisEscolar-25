'use client'
import { useSession, useUser } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import React, { useState } from 'react'

type Props = {
  priceId: string
  schoolName: string
  endpoint?: string // por defecto /api/checkout
  id?: string
}

export default function PayNowButton({
  priceId,
  schoolName,
  endpoint = '/api/checkout',
  id = 'pay-now',
}: Props) {
  const [loading, setLoading] = useState(false)

  const { user, isLoaded } = useUser()

  if (!isLoaded) return null

  const handleClick = async () => {
    if (!priceId) return alert('Falta priceId')
    try {
      setLoading(true)
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, schoolName, userName: user!.id }),
      })
      const data = await res.json()
      if (res.ok && data?.url) window.location.href = data.url
      else alert(data?.error || 'No se pudo iniciar el pago')
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
      className="group inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-white
                 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg hover:shadow-xl
                 transition-all duration-300 ease-in-out hover:from-indigo-700 hover:to-purple-700
                 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? 'Redirigiendo…' : 'Pagar ahora'}
      {!loading && (
        <svg
          className="ml-2 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
      )}
    </button>
  )
}
