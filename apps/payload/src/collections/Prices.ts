import { anyone } from '@/access/anyone'
import { authenticated } from '@/access/authenticated'
import type { CollectionConfig } from 'payload'

export const Prices: CollectionConfig = {
  slug: 'prices',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'titulo',
  },
  fields: [
    {
      name: 'precio',
      type: 'number',
      required: true,
    },
    {
      name: 'titulo',
      type: 'text',
      required: true,
    },
    {
      name: 'descripcion',
      type: 'textarea',
    },
    {
      name: 'funciones',
      type: 'array',
      fields: [
        {
          name: 'funcion',
          type: 'text',
        },
      ],
    },
  ],
}
