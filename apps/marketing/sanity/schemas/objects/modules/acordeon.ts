import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'acordeon',
  title: 'Acordeón',
  type: 'object',
  fields: [
    defineField({
      name: 'titulo',
      title: 'Título',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'items',
      title: 'Secciones del acordeón',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'acordeonItem',
          title: 'Sección',
          fields: [
            defineField({
              name: 'titulo',
              title: 'Título',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'contenido',
              title: 'Contenido',
              type: 'text',
              validation: (Rule) => Rule.required(),
            }),
          ],
        },
      ],
    }),
  ],
})
