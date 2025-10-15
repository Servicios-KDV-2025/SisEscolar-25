import {ThLargeIcon} from '@sanity/icons'
import { defineField} from 'sanity'

export const gridType = defineField({
  name: 'grid',
  title: 'Grid',
  type: 'object',
  icon: ThLargeIcon,
  fields: [
    {
      name: 'items',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'imageItem',
          title: 'Imagen',
          fields: [
            {
              name: 'image',
              title: 'Imagen',
              type: 'image',
              options: { hotspot: true },
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'alt',
              title: 'Texto alternativo',
              type: 'string',
            },
          ],
          preview: {
            select: {
              media: 'image',
              alt: 'alt',
            },
            prepare({media, alt}) {
              return {
                title: alt || 'Imagen',
                subtitle: 'Tipo: Imagen',
                media,
              }
            },
          },
        },
        {
          type: 'object',
          name: 'textItem',
          title: 'Texto',
          fields: [
            {
              name: 'title',
              title: 'Título',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'description',
              title: 'Descripción',
              type: 'text',
              rows: 3,
            },
          ],
          preview: {
            select: {
              title: 'title',
              description: 'description',
            },
            prepare({title, description}) {
              return {
                title: title || 'Texto',
                subtitle: description || 'Tipo: Texto',
              }
            },
          },
        },
        {
          type: 'object',
          name: 'priceItem',
          title: 'Precio',
          fields: [
            {
              name: 'price',
              title: 'Precio',
              type: 'reference',
              to: [{ type: 'price' }],
              validation: (Rule) => Rule.required(),
            },
          ],
          preview: {
            select: {
              title: 'price.name',
              amount: 'price.amount',
            },
            prepare({title, amount}) {
              return {
                title: title || 'Precio',
                subtitle: `Tipo: Precio${amount ? ` - $${amount}` : ''}`,
              }
            },
          },
        },
      ],
    },
  ],
  preview: {
    select: {
      items: 'items',
    },
    prepare({items}) {
      return {
        subtitle: 'Grid',
        title: items?.length > 0 ? `${items.length} item${items.length > 1 ? 's' : ''}` : 'No items',
      }
    },
  },
})
  