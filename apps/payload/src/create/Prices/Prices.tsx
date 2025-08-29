import { usePayloadAPI } from '@payloadcms/ui'
import { PriceComponent } from './PriceComponent'
import { Price } from '@/payload-types'

interface PricePros {
  onSelect: (idStripe: string) => void
}

export const Prices: React.FC<PricePros> = (props) => {
  const [{ data, isError, isLoading }] = usePayloadAPI('/api/prices')
  const { onSelect } = props

  if (isLoading) return <p>Loading...</p>
  if (isError) return <p>Error occurred while fetching data.</p>

  return (
    <div className="w-full py-10">
      <h2 className="text-2xl font-bold text-center mb-8">
        Selecciona el plan que más te convenga
      </h2>

      <div className="grid gap-6 justify-center sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] lg:grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
        {data?.docs.map((price: Price, index: number) => (
          <PriceComponent key={index} {...price} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}
