import { Block } from 'payload'

export const Carousel: Block = {
  slug: 'carousel',
  interfaceName: 'CarouselBlock',
  
    fields: [
    {
      name: 'titulo',
      type: 'text',
      required: true,
    },
    {
      name: 'imagenes',
      type: 'array',
      label: 'Imágenes del carrusel',
      fields: [
        {
          name: 'imagen',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'alt',
          type: 'text',
          label: 'Texto alternativo',
        },
      ],
    },
  ],
}
