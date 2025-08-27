import type { Metadata } from 'next/types'
export const dynamic = 'force-dynamic'
import React from 'react'
import PageClient from './page.client'
import { Stepper } from '@/create/Stepper'
import { Badge, Shield, Star, Users, Zap } from 'lucide-react'

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
      <section className="py-8 px-4 border-y bg-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex items-center justify-center space-x-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <div className="font-semibold">Seguridad Enterprise</div>
                <div className="text-sm text-muted-foreground">Certificación SOC 2 Type II</div>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <div className="font-semibold">99.9% Uptime</div>
                <div className="text-sm text-muted-foreground">SLA garantizado</div>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <Zap className="h-8 w-8 text-primary" />
              <div>
                <div className="font-semibold">Soporte 24/7</div>
                <div className="text-sm text-muted-foreground">Respuesta en &lt; 2 horas</div>
              </div>
            </div>
          </div>
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
