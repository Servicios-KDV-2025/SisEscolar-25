// app/[slug]/page.tsx
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

// Si tu Stepper es export nombrado:
import { Stepper } from '@/create/Stepper'
// Si fuera default, usa: import Stepper from '@/create/Stepper'

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
    pages.docs?.filter(doc => doc.slug !== 'home').map(({ slug }) => ({ slug })) ?? []

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

  // De la página obtenemos hero, layout y checkout (relación)
  const hero = (page as any)?.hero
  const layout = (page as any)?.layout ?? []
  const checkoutFromCMS = (page as any)?.checkout ?? null // 👈 viene de la relación, no del layout

  return (
    <article className="pt-16 pb-24">
      <LivePreviewListener />
      <PayloadRedirects disableNotFound url={url} />

      <RenderHero {...hero} />

      {/* Stepper leyendo el priceId desde la relación 'checkout' */}
      {checkoutFromCMS && (
        <div className="my-8">
          <Stepper checkoutFromCMS={checkoutFromCMS} />
        </div>
      )}

      {/* Renderiza el resto de bloques tal cual */}
      <RenderBlocks blocks={layout} />
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = 'home' } = await paramsPromise
  const page = await queryPageBySlug({ slug })
  return generateMeta({ doc: page })
}

// ---- helpers ----
const queryPageBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'pages',
    draft,
    limit: 1,
    pagination: false,
    overrideAccess: draft,
    depth: 1, 
    where: { slug: { equals: slug } },
  })

  return (result.docs?.[0] as RequiredDataFromCollectionSlug<'pages'> | undefined) ?? null
})
