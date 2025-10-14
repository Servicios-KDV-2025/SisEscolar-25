"use client"
import { useEffect, useState } from 'react'
import { clientBrowser } from '@/sanity/lib/client-browser'
import { pricesQuery } from '@/sanity/lib/queries'
import { PriceComponent } from './PriceComponent'
import type { PricesQueryResult } from '@/sanity.types'

interface PricesProps {
  onSelect: (idStripe: string) => void
}

export const Prices = ({ onSelect }: PricesProps) => {
  const [prices, setPrices] = useState<PricesQueryResult>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const data = await clientBrowser.fetch(pricesQuery)
        if (!cancelled) setPrices((data as PricesQueryResult) ?? [])
      } catch (e) {
        if (!cancelled) setError('No se pudieron cargar los planes')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="w-full py-10">
        <h2 className="text-2xl font-bold text-center mb-8">Cargando planes…</h2>
      </div>
    )
  }

  if (error || prices.length === 0) {
    return (
      <div className="w-full py-10">
        <h2 className="text-2xl font-bold text-center mb-8">Planes</h2>
        <p className="text-center text-sm opacity-70">
          {error ?? 'No hay planes disponibles por el momento.'}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full py-10">
      <h2 className="text-2xl font-bold text-center mb-8">Selecciona el plan que más te convenga</h2>
      <div className="grid gap-6 justify-center sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] lg:grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
        {prices.map((p) => (
          <PriceComponent
            key={p._id}
            amount={p.price ?? 0}
            title={p.title ?? ''}
            idStripe={p.id_stripe ?? ''}
            description={p.features?.featureList?.join(', ') ?? ''}
            features={p.features?.featureList?.map((f) => ({ label: f })) ?? []}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}
