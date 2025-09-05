import type { ColumnBlock } from '@/payload-types'
import React from 'react'
import { RenderBlocks } from '../RenderBlocks'

export const ColumnComponent: React.FC<ColumnBlock> = (props) => {
  const { columnWidth, content } = props

  const basisVariant: Record<string, string> = {
    auto: 'lg:basis-auto',
    '1/1': 'lg:basis-full',
    '4/5': 'lg:basis-4/5',
    '3/4': 'lg:basis-3/4',
    '2/3': 'lg:basis-2/3',
    '1/2': 'lg:basis-1/2',
    '1/3': 'lg:basis-1/3',
    '1/4': 'lg:basis-1/4',
    '1/5': 'lg:basis-1/5',
  }

  return (
    <div className={`flex flex-col grow-basis-full sm:basis-1/2 ${basisVariant[columnWidth]}`}>
      {content && <RenderBlocks blocks={content} />}
    </div>
  )
}
