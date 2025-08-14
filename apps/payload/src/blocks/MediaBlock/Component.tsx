import type { StaticImageData } from 'next/image'
import React from 'react'
import { cn } from '@/utilities/ui'
import RichText from '@/components/RichText'
import { Media } from '../../components/Media'
import { MediaBlock as Prop } from '@/payload-types'

type ImageSize = 'sm' | 'md' | 'lg'

type Props = Prop & {
  media?: any
  caption?: any
  imageSize?: ImageSize
  breakout?: boolean
  captionClassName?: string
  className?: string
  enableGutter?: boolean
  imgClassName?: string
  staticImage?: StaticImageData
  disableInnerContainer?: boolean
}

export const MediaBlock: React.FC<Props> = (props) => {
  const {
    caption,
    captionClassName,
    className,
    enableGutter = true,
    imgClassName,
    media,
    staticImage,
    disableInnerContainer,
    imageSize = 'md',
  } = props

  const getImageSizeClass = (size: ImageSize) => {
    switch (size) {
      case 'sm':
        return 'max-w-[200px]'
      case 'md':
        return 'max-w-[400px]'
      case 'lg':
        return 'max-w-[600px]'
      default:
        return 'max-w-[400px]'
    }
  }

  const imgSizeClass = getImageSizeClass(imageSize)

  return (
    <div className={cn({ container: enableGutter }, className)}>
      {/*  Texto arriba */}
      {caption && (
        <div
          className={cn(
            'mb-4 text-center', // centrado con margen inferior
            { container: !disableInnerContainer },
            captionClassName,
          )}
        >
          <RichText data={caption} enableGutter={false} />
        </div>
      )}

      {/*  Imagen centrada */}
      {(media || staticImage) && (
        <div className="flex justify-center">
          <Media
            imgClassName={cn(
              'border border-border rounded-[0.8rem] mx-auto',
              imgSizeClass,
              imgClassName,
            )}
            resource={media}
            src={staticImage}
          />
        </div>
      )}
    </div>
  )
}
