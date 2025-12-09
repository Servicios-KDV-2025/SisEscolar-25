import { defineType, defineField } from 'sanity'

export const faqBlock = defineType({
  name: 'faqBlock',
  title: 'Bloque de Preguntas Frecuentes',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Título del bloque',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'items',
      title: 'Preguntas',
      type: 'array',
      of: [
        { type: 'faqItem' } // ← Aquí ya se usa correctamente el tipo
      ],
    }),
  ],
})
