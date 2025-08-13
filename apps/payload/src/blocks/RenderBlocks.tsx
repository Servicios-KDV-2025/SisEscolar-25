import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'
import type { FC } from 'react'
import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { Acordeon } from './Acordeon/Component'
import { ContetWithMediaBlock } from './ContentWithMedia/Component'
import { BloqueInformativoComponet } from '@/blocks/BloqueInformativo/Component'
import { PriceBlockComponent } from './PriceBlock/Components'
import { ColumnComponent } from './Column/Component'
import { RowComponent } from './Row/Component'
import { SectionComponent } from './Section/Component'
import { TextComponent } from './Text/Component'
import { Carousel } from './Carousel/Component'
import { CarouselAvatar } from './CarouselAvatar/Component'
import { ImagenConTextoComponent } from './ImagenConTexto/Component'

const blockComponents = {
  archive: ArchiveBlock,
  content: ContentBlock,
  cta: CallToActionBlock,
  mediaBlock: MediaBlock,
  formBlock: FormBlock,
  acordeon: Acordeon,
  imagenConTexto: ImagenConTextoComponent,
  contentWithMedia: ContetWithMediaBlock,
  bloqueInformativo: BloqueInformativoComponet,
  section: SectionComponent,
  textBlock: TextComponent,
  priceBlock: PriceBlockComponent,
  column: ColumnComponent,
  row: RowComponent,
  carousel: Carousel,
  carouselAvatar: CarouselAvatar,
}
export const RenderBlocks: React.FC<{
  blocks: Page['layout'][0][]
}> = (props) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockType } = block

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType]

            if (Block) {
              return (
                <div className="my-16" key={index}>
                  {/* @ts-expect-error there may be some mismatch between the expected types here */}
                  <Block {...block} disableInnerContainer />
                </div>
              )
            }
          }
          return null
        })}
      </Fragment>
    )
  }

  return null
}
