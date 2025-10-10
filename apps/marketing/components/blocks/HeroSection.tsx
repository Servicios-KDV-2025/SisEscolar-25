import { PortableText, PortableTextBlock, PortableTextReactComponents } from '@portabletext/react';
import React from "react";
import { ArrowRight, Play } from "lucide-react"
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';


export const HeroSection = ({ titulo, type }: {
    titulo: PortableTextBlock;
    type: string | null
}) => {
    
  const myComponents: Partial<PortableTextReactComponents> = {
    block: {
        h1: ({ children }) => <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl text-balance">{children}</h1>,
        h2: ({ children }) => <h2 className="text-3xl font-semibold">{children}</h2>,
        h3: ({ children }) => <h3 className="text-3xl font-semibold">{children}</h3>,
        h4: ({ children }) => <h4 className="text-3xl font-semibold">{children}</h4>,
        h5: ({ children }) => <h5 className="text-3xl font-semibold">{children}</h5>,
        h6: ({ children }) => <h6 className="text-3xl font-semibold">{children}</h6 >,
        normal: ({ children }) => <p className="text-lg my-4">{children}</p>,
    },
    marks: {
      text_primary: ({ children }) => <span className="text-primary">{children}</span>,
      text_secondary: ({ children }) => <span className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground text-pretty">{children}</span>,
    },
  };
  return    <section className="relative overflow-hidden bg-background py-20 sm:py-32">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <div className="container relative max-w-screen-xl px-4">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-2">
            <span className="mr-2 h-2 w-2 rounded-full bg-accent"></span>
            Nuevo: Integración con IA para reportes automáticos
          </Badge>

          <PortableText value={titulo} components={myComponents} />
          {/* <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground text-pretty">
            Simplifica la gestión académica, administrativa y financiera de tu institución educativa. Una plataforma
            completa que conecta estudiantes, profesores y administradores.
          </p> */}

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3">
              Comenzar Prueba Gratuita
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-3 bg-transparent">
              <Play className="mr-2 h-4 w-4" />
              Ver Demo
            </Button>
          </div>

          <div className="mt-12 text-sm text-muted-foreground">
            Más de <span className="font-semibold text-foreground">2,500+ instituciones</span> confían en nosotros
          </div>
        </div>
      </div>
    </section>
    //return 
};
