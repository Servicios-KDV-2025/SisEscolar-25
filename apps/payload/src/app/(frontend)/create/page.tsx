import type { Metadata } from 'next/types'
export const dynamic = 'force-dynamic'
import React from 'react'
import PageClient from './page.client'
import { Stepper } from '@/create/Stepper'
import { Badge, Star } from 'lucide-react'

export default function Page() {
  return (
    <div>
      <PageClient />
      <section className="py-16 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="flex items-center justify-center space-x-2 mb-6">
            {/* <Badge variant="secondary" className="px-3 py-1">
              <Star className="h-3 w-3 mr-1" />
              Más de 10,000 empresas confían en nosotros
            </Badge> */}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
            Potencia tu negocio con nuestra
            <span className="text-primary"> plataforma SaaS</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
            Automatiza procesos, mejora la productividad y escala tu negocio con nuestra solución
            integral diseñada para empresas modernas.
          </p>
        </div>
      </section>

      <div className="prose dark:prose-invert max-w-none text-center">
        <h1 className="mb-8 lg:mb-16">Esta es la página para comprar tu servicio</h1>
      </div>
      <div className="container mb-16">{<Stepper />}</div>
    </div>
  )
}
export function generateMetadata(): Metadata {
  return { title: 'Payload Website Buy Service Template' }
}
