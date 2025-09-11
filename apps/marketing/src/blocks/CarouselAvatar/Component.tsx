'use client'

import React from 'react'
import {
  Carousel as ShadCarousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@repo/ui/components/shadcn/carousel'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { CarouselAvatarBlock } from '@/payload-types'

export const CarouselAvatar: React.FC<CarouselAvatarBlock> = (props) => {
  const { empleados } = props

  return (
    <div className="max-w-6xl mx-auto px-4">
      <ShadCarousel>
        <CarouselContent>
          {empleados?.map((empleado, index) => (
            <CarouselItem key={index} className="basis-1/2">
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="flex justify-center mb-4">
                  <div className="w-48 h-48 rounded-full overflow-hidden relative">
                    {empleado.imagen && typeof empleado.imagen !== 'number' && (
                      <Image
                        src={empleado.imagen.thumbnailURL || ''}
                        alt={empleado.imagen.alt || 'Employee Avatar'}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                </div>
                <CardContent>
                  <h1 className="text-xl font-semibold mb-1">{empleado.puesto}</h1>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {empleado.descripcion}
                  </p>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </ShadCarousel>
    </div>
  )
}
