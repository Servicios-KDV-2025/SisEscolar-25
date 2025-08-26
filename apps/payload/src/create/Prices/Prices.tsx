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
    <div>
      <div>Selecciona Los precios</div>
      {data?.docs.map((price: Price, index: number) => {
        return <PriceComponent key={index} {...price} onSelect={onSelect} />
      })}
    </div>
  )
}
