// app/[slug]/page.tsx
export const revalidate = 0; // sin caché mientras pruebas en Admin

import type { Metadata } from 'next'
import React, { cache } from 'react'
import { draftMode } from 'next/headers'
import { getPayload, type RequiredDataFromCollectionSlug } from 'payload'
import configPromise from '@payload-config'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { RenderHero } from '@/heros/RenderHero'
import { generateMeta } from '@/utilities/generateMeta'
import { homeStatic } from '@/endpoints/seed/home-static'

import { Stepper } from '@/create/Stepper'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const pages = await payload.find({
    collection: 'pages',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: { slug: true },
  })

  const params =
    pages.docs?.filter((doc) => doc.slug !== 'home').map(({ slug }) => ({ slug })) ?? []

  return params
}

type Args = { params: Promise<{ slug?: string }> }

export default async function Page({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = 'home' } = await paramsPromise
  const url = '/' + slug

  let page: RequiredDataFromCollectionSlug<'pages'> | null = await queryPageBySlug({ slug })

  // fallback de seed si aún no hay 'home'
  if (!page && slug === 'home') {
    page = homeStatic as unknown as RequiredDataFromCollectionSlug<'pages'>
  }

  if (!page) {
    return <PayloadRedirects url={url} />
  }

  // ---- datos principales de la página ----
  const hero = (page as any)?.hero
  const layout: any[] = (page as any)?.layout ?? []

  // ---- relación a la colección (page.checkout) ----
  let checkoutDoc: any = (page as any)?.checkout ?? null

  // Fallback: si la relación vino como ID string, la resolvemos
  if (checkoutDoc && typeof checkoutDoc === 'string') {
    try {
      const payload = await getPayload({ config: configPromise })
      checkoutDoc = await payload.findByID({
        collection: 'checkoutButtons',
        id: checkoutDoc,
        depth: 0,
      })
    } catch {
      checkoutDoc = null
    }
  }

  // Normalizamos por si el campo en tu colección se llama distinto
  // (priceId / stripePriceId / price) y (buttonText / label)
  const normalizedCheckout =
    checkoutDoc
      ? {
          priceId:
            checkoutDoc.priceId ??
            checkoutDoc.stripePriceId ??
            checkoutDoc.price ??
            '',
          buttonText: checkoutDoc.buttonText ?? checkoutDoc.label ?? 'Pagar ahora',
        }
      : null

  // Evitamos renderizar un bloque viejo "checkoutButton" si quedó en layout
  const layoutWithoutCheckout =
    layout?.filter?.((b: any) => b?.blockType !== 'checkoutButton') ?? layout

  return (
    <article className="pt-16 pb-24">
      {draft && <LivePreviewListener />}
      <PayloadRedirects disableNotFound url={url} />

      <RenderHero {...hero} />

      {/* Stepper: mostrará el botón si normalizedCheckout.priceId existe,
          y mostrará el aviso si aún no has seleccionado un Botón de Checkout en Admin */}
      <div className="my-8">
        <Stepper checkoutFromCMS={normalizedCheckout} />
      </div>

      {/* Resto de bloques (sin el bloque viejo de checkout) */}
      <RenderBlocks blocks={layoutWithoutCheckout} />
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = 'home' } = await paramsPromise
  const page = await queryPageBySlug({ slug })
  return generateMeta({ doc: page })
}

// ---- helper ----
const queryPageBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'pages',
    draft,
    limit: 1,
    pagination: false,
    overrideAccess: draft,
    depth: 1, //  hidrata la relación 'checkout'
    where: { slug: { equals: slug } },
  })

  return (result.docs?.[0] as RequiredDataFromCollectionSlug<'pages'> | undefined) ?? null
})
