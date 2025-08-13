import RichText from '@/components/RichText'
import { ContentWithMedia } from '@/payload-types'
import Image from 'next/image'
import React from 'react'

export const ContetWithMediaBlock: React.FC<ContentWithMedia> = (props: ContentWithMedia) => {
  if (props.textPosition === 'Left') {
    return (
      <div className="container my-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            {props.content && <RichText data={props.content} enableGutter={false} />}
          </div>
          <div>
            {props.image && typeof props.image !== 'number' && (
              <Image
                src={props.image.thumbnailURL || ''}
                alt={props.image.alt || ''}
                width={props.image.width || 640}
                height={props.image.height || 360}
                className="rounded-2xl shadow-lg"
              />
            )}
          </div>
        </div>
      </div>
    )
  } else {
    return (
      <div className="container my-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            {props.image && typeof props.image !== 'number' && (
              <Image
                src={props.image.thumbnailURL || ''}
                alt={props.image.alt || ''}
                width={props.image.width || 640}
                height={props.image.height || 360}
                className="rounded-2xl shadow-lg"
              />
            )}
          </div>
          <div className="space-y-6">
            {props.content && <RichText data={props.content} enableGutter={false} />}
          </div>
        </div>
      </div>
    )
  }
  return null
}
