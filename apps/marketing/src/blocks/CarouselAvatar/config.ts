import { Block } from 'payload'

export const CarouselAvatar: Block = {
  slug: 'carouselAvatar',
  interfaceName: 'CarouselAvatarBlock',
  fields: [
    {
      name: 'empleados',
      type: 'array',
      label: 'Empleados',
      fields: [
        {
          name: 'imagen',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'puesto',
          type: 'text',
          required: true,
        },
        {
          name: 'descripcion',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
