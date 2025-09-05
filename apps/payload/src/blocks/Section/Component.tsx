import { SectionBlock } from '@/payload-types'
import React from 'react'
import { RowComponent } from '../Row/Component'

export const SectionComponent: React.FC<SectionBlock> = (props) => {
  const { rows } = props

  return (
    <section className="container mx-auto my-16">
      {rows?.map((row) => (
        <RowComponent key={row.id} {...row} />
      ))}
    </section>
  )
}
