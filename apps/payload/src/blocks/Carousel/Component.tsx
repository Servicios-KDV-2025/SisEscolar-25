'use client'

import React from 'react'
import {
  Carousel as ShadCarousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel'
import { CarouselBlock } from '@/payload-types'

export const Carousel: React.FC<CarouselBlock> = ({ titulo, imagenes }) => {
  return (
    <section className="py-12">
      <h2 className="text-3xl font-bold mb-8 text-center">{titulo}</h2>
      <div className="max-w-6xl mx-auto px-4">
        <ShadCarousel className="w-full">
          <CarouselContent>
            {typeof imagenes !== 'number' &&
              imagenes?.map((img, i) => (
                <CarouselItem key={i} className="flex justify-center items-center min-h-[200px]">
                  <div className="relative w-full max-w-4xl">
                    <img
                      src={
                        typeof img.imagen === 'string'
                          ? img.imagen
                          : (img.imagen as { url: string }).url
                      }
                      alt={img.alt || ''}
                      className="w-full h-auto max-h-[80vh] object-contain rounded-lg border shadow-lg"
                    />
                  </div>
                </CarouselItem>
              ))}
          </CarouselContent>
          <CarouselPrevious className="left-2 top-1/2 -translate-y-1/2" />
          <CarouselNext className="right-2 top-1/2 -translate-y-1/2" />
        </ShadCarousel>
      </div>
    </section>
  )
}
