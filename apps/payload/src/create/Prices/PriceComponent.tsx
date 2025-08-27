import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Price } from '@/payload-types'
import { Check, School } from 'lucide-react'

interface PricePros extends Price {
  onSelect: (idStripe: string) => void
}

export const PriceComponent: React.FC<PricePros> = (props) => {
  const { precio, titulo, IdStripe, descripcion, funciones, onSelect } = props

  return (
    <div className="w-full px-8">
      <Card className="w-full">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto rounded-full mb-4 p-3 rounded-full w-fit">
            <School className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl">{titulo}</CardTitle>
          <CardDescription className="text-base">{descripcion}</CardDescription>
        </CardHeader>
        <CardContent>
          {funciones?.map((funcion, index) => {
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
            onClick={() => onSelect(IdStripe)}
          >
            Elegir
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
