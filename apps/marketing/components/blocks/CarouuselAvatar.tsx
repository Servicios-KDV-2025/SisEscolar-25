'use client'

import React from 'react'
import {
  Carousel as ShadCarousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Empleados } from '@/types'
import { urlForImage } from '@/sanity/lib/utils'

export interface CarouselAvatarProps {
  titulo?: string
  empleados?: Empleados[]
}

export const CarouselAvatar: React.FC<CarouselAvatarProps> = (props) => {
  const { empleados, titulo } = props

  return (
    <div className="max-w-6xl mx-auto px-4">
      {
        titulo && <h2 className="text-3xl font-bold mb-4 text-center mb-8">{titulo}</h2>
      }
      <ShadCarousel>
        <CarouselContent>
          {empleados?.map((empleado, index) => {
            
            const imageUrl = empleado.imagen && urlForImage(empleado.imagen)?.fit('crop').url()
            
            return<CarouselItem key={index} className="basis-1/2">
              <Card className="overflow-hidden rounded-lg  hover:shadow-lg transition-shadow">
                <div className="flex justify-center mb-4">
                  <div className="w-48 h-48 rounded-full overflow-hidden relative">
                    {empleado.imagen && typeof empleado.imagen !== 'number' && (
                      <Image
                        src={imageUrl!}
                        alt={empleado.puesto || 'Employee Avatar'}
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
          })}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </ShadCarousel>
    </div>
  )
}
