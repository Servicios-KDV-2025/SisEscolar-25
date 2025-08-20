'use client'
import React from 'react'

type Props = {
  priceId: string
  buttonText: string
  title?: string
  subtitle?: string
  id?: string
  schoolName?: string // <- nombre de escuela
  userName?: string // <- nombre de usuario
}

export const CheckoutButtonBlock: React.FC<Props> = ({
  priceId,
  buttonText,
  title,
  subtitle,
  id,
  schoolName,
  userName,
}) => {
  const handleClick = async () => {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, schoolName, userName }),
      })

      const data = await res.json()
      if (data?.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Checkout failed', error)
    }
  }

  return (
    <div id={`block-${id}`} className="my-8 flex justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform hover:scale-105 transition-all duration-300 ease-in-out">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
          </div>
          {title && <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>}
          {subtitle && <p className="text-indigo-100 text-sm">{subtitle}</p>}
        </div>

        {/* Contenido de la card */}
        <div className="px-6 py-8 bg-gradient-to-br from-gray-50 to-white">
          <div className="text-center">
            <button
              onClick={handleClick}
              className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 focus:ring-opacity-50 active:transform active:translate-y-0"
            >
              <span className="relative z-10 flex items-center gap-2">
                {buttonText}
                <svg
                  className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
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
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
