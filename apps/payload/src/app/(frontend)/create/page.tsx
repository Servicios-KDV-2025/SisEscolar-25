import type { Metadata } from 'next/types'
export const dynamic = 'force-dynamic'
import React from 'react'
import PageClient from './page.client'
import { Stepper } from '@/create/Stepper'

export default function Page() {
  return (
    <div className="">
      <PageClient />
      <div className="prose dark:prose-invert max-w-none text-center">
        <h1 className="mb-8 lg:mb-16">Esta es la pagina para comprar tu servicio</h1>
      </div>
      <div className="container mb-16">{<Stepper />}</div>
    </div>
  )
}
export function generateMetadata(): Metadata {
  return {
    title: `Payload Website Buy Serice Template`,
  }
}
