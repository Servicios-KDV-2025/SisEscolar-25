'use client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { PriceBlock } from '@/payload-types'
import { Check, School } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'

export const PriceBlockComponent: React.FC<PriceBlock> = (props) => {
  const router = useRouter()
  const { price } = props

  if (typeof price === 'number') {
    return null
  }

  return (
    <div className="w-full px-8">
      <Card className="w-full">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto rounded-full mb-4 p-3 rounded-full w-fit">
            <School className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl">{price.titulo}</CardTitle>
          <CardDescription className="text-base">{price?.descripcion}</CardDescription>
        </CardHeader>
        <CardContent>
          {price.funciones?.map((funcion, index) => {
            return (
              <div key={index} className="flex items-center gap-3 pb-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 " />
                <span className="text-sm">{funcion.funcion}</span>
              </div>
            )
          })}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            variant="outline"
            onClick={() => router.push(`/create?id=${price.IdStripe}`)}
          >
            Empezar
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
