import { defineType } from 'sanity';
import { BlockContentIcon } from '@sanity/icons';

export default defineType({
  name: 'infoBlock',
  title: 'Bloque de Información',
  type: 'object',
  icon: BlockContentIcon,
  fields: [
    {
      name: 'title',
      title: 'Título Principal',
      type: 'string',
      validation: (Rule) => Rule.required().max(100),
      description: 'Título principal del bloque (ej: "Funcionalidades principales")'
    },
    {
      name: 'subtitle',
      title: 'Subtítulo',
      type: 'string',
      validation: (Rule) => Rule.max(150),
      description: 'Subtítulo opcional debajo del título principal'
    },
    {
      name: 'items',
      title: 'Items',
      type: 'array',
      validation: (Rule) => Rule.required().min(1).max(6),
      of: [
        {
          type: 'object',
          name: 'infoItem',
          title: 'Item de Información',
          fields: [
            {
              name: 'icon',
              title: 'Ícono (SVG o imagen)',
              type: 'image',
              options: { hotspot: true },
              description: 'Sube un SVG o PNG pequeño (ideal 32x32 o 64x64)',
            },
            {
              name: 'title',
              title: 'Título',
              type: 'string',
              validation: (Rule) => Rule.required().max(120),
            },
            {
              name: 'description',
              title: 'Descripción',
              type: 'text',
              rows: 3,
              validation: (Rule) => Rule.required().max(300),
            },
          ],
          preview: {
            select: {
              title: 'title',
              subtitle: 'description',
              media: 'icon',
            },
            prepare({ title, subtitle, media }) {
              return {
                title: title || 'Sin título',
                subtitle: subtitle ? subtitle.slice(0, 60) + '...' : 'Sin descripción',
                media,
              };
            },
          },
        },
      ],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'subtitle',
      itemCount: 'items.length'
    },
    prepare({ title, subtitle, itemCount }) {
      return {
        title: title || 'Bloque de Información',
        subtitle: subtitle || `${itemCount || 0} items`,
      };
    },
  },
});
