import RichText from '@/components/RichText'
import type { TextBlock } from '@/payload-types'
import React from 'react'

export const TextComponent: React.FC<TextBlock> = (props) => {
  return <RichText data={props.content} enableGutter={false} />
}
