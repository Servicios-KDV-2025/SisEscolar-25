import { urlForImage } from '@/sanity/lib/utils';
import { PortableText, PortableTextBlock, PortableTextReactComponents } from '@portabletext/react';
import Image from 'next/image'
import React from 'react'


interface ContentWithMediaProps{
  body: PortableTextBlock;
  image?: { asset?: any };
  textPosition: 'Left' | 'Right';
}

export const ContentWithMediaBlock: React.FC<ContentWithMediaProps> = (props: ContentWithMediaProps) => {
  const { body, image, textPosition } = props;
  const imageUrl = image?.asset && urlForImage(image)?.fit('crop').url()

  
  const components: Partial<PortableTextReactComponents> = {
    block: {
        h1: ({ children }) => <h1 className="text-4xl font-bold">{children}</h1>,
        h2: ({ children }) => <h2 className="text-3xl font-semibold">{children}</h2>,
        h3: ({ children }) => <h3 className="text-2xl font-semibold">{children}</h3>,
        normal: ({ children }) => <p className="text-lg my-4">{children}</p>,
    }
  }

  if (textPosition === 'Left') {
    return (
      <div className="container my-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            {body && <PortableText value={body} components={components} />}
          </div>
          <div>
            {props.image && typeof props.image !== 'number' && (
              <Image
                src={imageUrl || ''}
                alt={imageUrl || ''}
                width={ 640}
                height={360}
                className="rounded-[24px] shadow-lg"
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
                src={imageUrl || ''}
                alt={imageUrl || ''}
                width={ 640}
                height={360}
                className="rounded-[24px] shadow-lg"
              />
            )}
          </div>
          <div className="space-y-6">
            {body && <PortableText value={body} components={components} />}
          </div>
        </div>
      </div>
    )
  }
  return null
}
