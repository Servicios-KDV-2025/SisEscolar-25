
'use server'
import { client } from '@/sanity/lib/client'
import { PriceComponent } from './PriceComponent'
import { pricesQuery } from '@/sanity/lib/queries'
import { sanityFetch } from '@/sanity/lib/live'


interface PricePros {
  onSelect: (idStripe: string) => void
}

export const Prices: React.FC<PricePros> = async  (props) => {
  const data = await sanityFetch({ query: pricesQuery })
  const { onSelect } = props



  return (
    <div className="w-full py-10">
      <h2 className="text-2xl font-bold text-center mb-8">
        Selecciona el plan que más te convenga
      </h2>

      <div className="grid gap-6 justify-center sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] lg:grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
        {/* {data.docs.map((price: Price, index: number) => (
          <PriceComponent key={index} {...price} onSelect={onSelect} />
        ))} */}
      </div>
    </div>
  )
}
