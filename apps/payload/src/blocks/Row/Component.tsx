import type { RowBlock } from '@/payload-types'
import React from 'react'
import { ColumnComponent } from '../Column/Component'

type RowComponentProps = RowBlock & {
  className?: string
}

export const RowComponent: React.FC<RowComponentProps> = (props) => {
  const { columns, className = '' } = props

  return (
      <div className={`flex flex-row flex-wrap p-4 ${className}`}>
        {columns?.map((column) => (
          <ColumnComponent key={column.id} {...column} />
        ))}
      </div>
  )
}
