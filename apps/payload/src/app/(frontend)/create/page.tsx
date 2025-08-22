import type { Metadata } from 'next/types'
export const dynamic = 'force-dynamic'

import React from 'react'
import PageClient from './page.client'
import { Stepper } from '@/create/Stepper'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

type CheckoutDoc = {
  id: number
  label?: string
  buttonText?: string
  priceId?: string
  stripePriceId?: string
  price?: string
} | null

function normalizeCheckout(doc: CheckoutDoc) {
  if (!doc) return null
  const priceId =
    doc.priceId ??
    doc.stripePriceId ??
    doc.price ??
    ''
  const buttonText = doc.buttonText ?? doc.label ?? 'Pagar ahora'
  return priceId ? { priceId, buttonText } : null
}

export default async function Page({
  searchParams,
}: {
  searchParams?: { checkoutId?: string }
}) {
  const payload = await getPayload({ config: configPromise })

  // Si pasas ?checkoutId=1 en la URL, toma ese. Si no, toma el más reciente.
  const byId =
    searchParams?.checkoutId && !Number.isNaN(Number(searchParams.checkoutId))
      ? { id: { equals: Number(searchParams.checkoutId) } }
      : undefined

  const { docs } = await payload.find({
    collection: 'checkoutButtons',
    where: byId,
    depth: 0,
    limit: 1,
    sort: '-updatedAt',
    pagination: false,
  })

  const checkoutFromCMS = normalizeCheckout((docs?.[0] as any) ?? null)

  return (
    <div className="">
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
