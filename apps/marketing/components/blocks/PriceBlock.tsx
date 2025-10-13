import { Price } from "@/sanity.types"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Check, School } from "lucide-react"
import Link from "next/link"


interface PriceBlockProps {
    price : Price,
}

export const PriceBlockComponent: React.FC<PriceBlockProps> = (props) => {
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
          <CardTitle className="text-2xl">{price.title}</CardTitle>
          <CardDescription className="text-base">{price?.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {typeof price !== 'undefined' && price.features!.featureList!.map((feature, index) => {
            return (
              <div key={index} className="flex items-center gap-3 pb-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 " />
                <span className="text-sm">{feature}</span>
              </div>
            )
          })}
        </CardContent>
        <CardFooter>
          <Link href="/create" className="w-full">
            <Button className="w-full" variant="outline">
              Empezar
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
