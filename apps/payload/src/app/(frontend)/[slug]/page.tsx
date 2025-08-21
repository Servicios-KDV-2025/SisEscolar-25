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
    pages.docs
      ?.filter((doc) => doc.slug !== 'home')
      .map(({ slug }) => ({ slug })) ?? []

  return params
}

type Args = {
  params: Promise<{ slug?: string }>
}

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
    // si no existe la página, deja que PayloadRedirects maneje 404/redirects
    return <PayloadRedirects url={url} />
  }

  const { hero, layout } = page

  // 1) saca el bloque checkoutButton del layout (trae priceId, buttonText, etc.)
  const checkoutFromCMS =
    (layout as any)?.find?.((b: any) => b?.blockType === 'checkoutButton') ?? null

  // 2) evita que RenderBlocks lo duplique
  const layoutWithoutCheckout =
    (layout as any)?.filter?.((b: any) => b?.blockType !== 'checkoutButton') ?? layout

  return (
    <article className="pt-16 pb-24">
      {/* Client-only helpers */}
      {/* Si usas algo en el cliente para live preview */}
      <LivePreviewListener />
      {/* Redirects válidos también */}
      <PayloadRedirects disableNotFound url={url} />

      {/* Hero de la página */}
      <RenderHero {...hero} />

      {/* Stepper con el bloque del CMS (si existe) */}
      {checkoutFromCMS ? (
        <div className="my-8">
          <Stepper checkoutFromCMS={checkoutFromCMS} />
        </div>
      ) : null}

      {/* Resto de bloques (sin el checkoutButton para no duplicar) */}
      <RenderBlocks blocks={layoutWithoutCheckout} />
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
    where: { slug: { equals: slug } },
  })

  return (result.docs?.[0] as RequiredDataFromCollectionSlug<'pages'> | undefined) ?? null
})
