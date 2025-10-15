import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BeneficioItem } from "@/types";


interface CTASectionProps { 
    titulo: string;
    subtitulo: string;
    beneficios: BeneficioItem[];
}


export const CTASection = ({ titulo, subtitulo, beneficios }: CTASectionProps) => {
  
  return (
    <section className="py-20 sm:py-32">
      <div className="container max-w-screen-xl px-4">
        <Card className="rounded-[24px] relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/30">
          <CardContent className="p-8 sm:p-12 lg:p-16">
            <div className="mx-auto max-w-2xl text-center">
              {
                titulo && <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
                {titulo}
                </h2>
              }
              {
                subtitulo && <p className="mt-4 text-lg text-muted-foreground text-pretty">
                {subtitulo}
                  </p>
              }
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {beneficios.map(({beneficio}, index) => (
                  <div key={index} className="flex items-center gap-3 text-left">
                    <CheckCircle className="h-5 w-5 text-accent flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{beneficio}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3">
                  Solicitar Demo Personalizada
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg" className="px-8 py-3 bg-transparent">
                  Hablar con Ventas
                </Button>
              </div>

              <p className="mt-6 text-xs text-muted-foreground">
                Sin compromiso • Configuración gratuita • Soporte 24/7
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
};
