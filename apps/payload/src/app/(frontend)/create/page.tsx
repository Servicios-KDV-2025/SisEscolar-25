import type { Metadata } from 'next'
export const dynamic = 'force-dynamic'

import React from 'react'
import PageClient from './page.client'
import { Stepper } from '@/create/Stepper'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

type CheckoutDoc =
  | {
      id: number
      label?: string
      buttonText?: string
      priceId?: string
      stripePriceId?: string
      price?: string
    }
  | null

function normalizeCheckout(doc: CheckoutDoc) {
  if (!doc) return null
  const priceId = doc.priceId ?? doc.stripePriceId ?? doc.price ?? ''
  const buttonText = doc.buttonText ?? doc.label ?? 'Pagar ahora'
  return priceId ? { priceId, buttonText } : null
}

type Args = {
  //  importante: recibir el Promise
  searchParams: Promise<{ checkoutId?: string }>
}

export default async function Page({ searchParams: spPromise }: Args) {
  const sp = await spPromise //esperar searchParams

  const payload = await getPayload({ config: configPromise })

  const where =
    sp?.checkoutId && !Number.isNaN(Number(sp.checkoutId))
      ? { id: { equals: Number(sp.checkoutId) } }
      : undefined

  // Construimos la query y solo añadimos `where` si existe
  const base = {
    collection: 'checkoutButtons' as const,
    depth: 0,
    limit: 1,
    sort: '-updatedAt',
    pagination: false,
  }

  const { docs } = await payload.find(where ? { ...base, where } : base)

  const checkoutFromCMS = normalizeCheckout((docs?.[0] as any) ?? null)

  return (
    <div>
      <PageClient />
      <div className="prose dark:prose-invert max-w-none text-center">
        <h1 className="mb-8 lg:mb-16">Esta es la página para comprar tu servicio</h1>
      </div>
      <div className="container mb-16">
        <Stepper checkoutFromCMS={checkoutFromCMS} />
      </div>
    </div>
  )
}

export function generateMetadata(): Metadata {
  return { title: 'Payload Website Buy Service Template' }
}
