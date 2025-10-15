import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Check, School } from 'lucide-react'

// Tipo desacoplado de Payload y Sanity (shape mínimo que necesita este componente)
export interface UIPrice {
  idStripe: string
  title: string
  amount: number
  description?: string
  features: { label: string }[]
}

interface PriceProps extends UIPrice {
  onSelect: (idStripe: string) => void
}

export const PriceComponent: React.FC<PriceProps> = (props) => {
  const { amount, title, idStripe, description, features, onSelect } = props

  return (
    <Card className="h-full px-8">
      <CardHeader className="text-center space-y-4">
  <div className="mx-auto rounded-full mb-4 p-3 w-fit">
          <School className="w-6 h-6" />
        </div>
        <CardTitle className="text-2xl">{title}</CardTitle>
        {amount != null && <p className="text-lg font-semibold">$ {amount}</p>}
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {features?.map((f, index) => {
          return (
            <div key={index} className="flex items-center gap-3 pb-2">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0 " />
              <span className="text-sm">{f.label}</span>
            </div>
          )
        })}
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant="outline" onClick={() => onSelect(idStripe)}>
          Elegir
        </Button>
      </CardFooter>
    </Card>
  )
}
