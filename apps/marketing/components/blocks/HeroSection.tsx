import { PortableText, PortableTextBlock, PortableTextReactComponents } from '@portabletext/react';
import React from "react";
import { ArrowRight, Play } from "lucide-react"
import { ButtonItem } from '@/types';

interface HeroSectionProps {
  titulo: PortableTextBlock;
  buttons: ButtonItem[];  
}



export const HeroSection = ({ titulo, buttons } : HeroSectionProps) => { 
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

   return <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
    <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
      <div className="z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wide mb-6">
          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            Nuevo Sistema 2.0
        </div>
        <PortableText value={titulo} components={myComponents} />
      </div>
    </div>
    <div className="flex flex-col sm:flex-row gap-4">
      {
        buttons.map( button => {

          
          return <button key={button._key}  className="group bg-[#F97316] hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-orange-500/30 flex items-center justify-center gap-2">
          
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
        })
      }
      <button className="group bg-[#F97316] hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-orange-500/30 flex items-center justify-center gap-2">
          Agenda una Demo
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
        <button className="group px-8 py-4 rounded-xl font-semibold text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
          <Play size={18} className="fill-slate-600" />
          Ver video tour
        </button>
    </div>
  </section>
  // return <section className="relative overflow-hidden bg-background py-20 sm:py-32">
  //     <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

  //     <div className="container relative max-w-screen-xl px-4">
  //       <div className="mx-auto max-w-4xl text-center">
  //         <Badge variant="secondary" className="mb-6 px-4 py-2">
  //           <span className="mr-2 h-2 w-2 rounded-full bg-accent"></span>
  //           Nuevo: Integración con IA para reportes automáticos
  //         </Badge>

  //         <PortableText value={titulo} components={myComponents} />
  //         {/* <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground text-pretty">
  //           Simplifica la gestión académica, administrativa y financiera de tu institución educativa. Una plataforma
  //           completa que conecta estudiantes, profesores y administradores.
  //         </p> */}

  //         <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
  //           <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3">
  //             Comenzar Prueba Gratuita
  //             <ArrowRight className="ml-2 h-4 w-4" />
  //           </Button>
  //           <Button variant="outline" size="lg" className="px-8 py-3 bg-transparent">
  //             <Play className="mr-2 h-4 w-4" />
  //             Ver Demo
  //           </Button>
  //         </div>

  //         <div className="mt-12 text-sm text-muted-foreground">
  //           Más de <span className="font-semibold text-foreground">2,500+ instituciones</span> confían en nosotros
  //         </div>
  //       </div>
  //     </div>
  //   </section>
    //return 
};
