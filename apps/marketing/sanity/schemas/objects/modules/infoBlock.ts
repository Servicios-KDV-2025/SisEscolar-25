import {defineType} from 'sanity'
import { ImageIcon } from '@sanity/icons'

export default defineType({
  name: 'infoBlock',
  title: 'Bloque informativo',
  type: 'object',
  icon: ImageIcon,
  fields: [
    {
      name: 'icon',
      title: 'Ícono (SVG o imagen)',
      type: 'image',
      options: { hotspot: true },
      description: 'Sube un SVG o PNG pequeño (ideal 32x32).'
    },
    {
      name: 'title',
      title: 'Título',
      type: 'string',
      validation: (Rule) => Rule.required().max(120),
    },
    {
      name: 'subtitle',
      title: 'Subtítulo',
      type: 'string',
      validation: (Rule) => Rule.max(80),
    },
    {
      name: 'description', 
      title: 'Descripción',
      type: 'text',
      rows: 3,
    },
    {
      name: 'accentColor', 
      title: 'Color de acento (hex)',
      type: 'string',
      description: 'Ej: #000000ff — opcional, usado para fondo del ícono',
      validation: (Rule) =>
        Rule.regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, {
          name: 'hex',
          invert: false,
        }).warning('Debe ser un color hex válido, p.e. #000000ff'),
    }
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'subtitle',
      media: 'icon'
    },
    prepare(selection) {
      const {title, subtitle, media} = selection
      return {
        title: title || 'Sin título',
        subtitle: subtitle ? `● ${subtitle}` : 'Bloque informativo',
        media,
      }
    }
  }
})