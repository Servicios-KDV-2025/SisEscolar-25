import { Block } from 'payload'
import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const MediaBlock: Block = {
  slug: 'mediaBlock',
  interfaceName: 'MediaBlock',
  labels: {
    singular: 'Bloque de imagen',
    plural: 'Bloques de imagen',
  },
  fields: [
    {
      name: 'media',
      label: 'Imagen',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'caption',
      label: 'Pie de imagen',
      type: 'richText',

      editor: lexicalEditor({
        features: [HeadingFeature(), InlineToolbarFeature(), FixedToolbarFeature()],
      }),
    },
    {
      name: 'imageSize',
      label: 'Tamaño de imagen',
      type: 'select',

      defaultValue: 'md',
      options: [
        { label: 'Pequeña ', value: 'sm' },
        { label: 'Mediana ', value: 'md' },
        { label: 'Grande ', value: 'lg' },
      ],
      required: true,
    },
  ],
}
