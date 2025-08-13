import { Block } from 'payload'
import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const ImagenConTextoBlock: Block = {
  slug: 'imagenConTexto',
  interfaceName: 'ImagenConTextoBlock',
  labels: {
    singular: 'Imagen con texto',
    plural: 'Imágenes con texto',
  },
  fields: [
    {
      name: 'texto',
      type: 'richText',
      label: 'Texto',
      required: true,
      editor: lexicalEditor({
        features: [HeadingFeature(), InlineToolbarFeature(), FixedToolbarFeature()],
      }),
    },
    {
      name: 'imagen',
      type: 'upload',
      label: 'Imagen',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'posicion',
      type: 'radio',
      label: 'Posición de la imagen',
      options: [
        { label: 'Izquierda', value: 'izquierda' },
        { label: 'Derecha', value: 'derecha' },
      ],
      defaultValue: 'izquierda',
    },
    {
      name: 'anchoImagen',
      type: 'select',
      label: 'Ancho de la imagen',
      options: [
        { label: '25%', value: '25' },
        { label: '33%', value: '33' },
        { label: '50%', value: '50' },
      ],
      defaultValue: '33',
    },
  ],
}
