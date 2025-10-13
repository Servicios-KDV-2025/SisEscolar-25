import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'carouselAvatar',
  title: 'Carousel Avatar',
  type: 'object',
    fields: [
        defineField({
            title: 'Título',
            name: 'titulo',
            type: 'string',
      }),
    defineField({
        name: 'empleados',
        title: 'Empleados',
        type: 'array',
       validation: (Rule) => Rule.required().min(2).max(10),
      of: [
        {
          type: 'object',
          name: 'empleado',
          title: 'Empleado',
          fields: [
            defineField({
              name: 'imagen',
              title: 'Imagen',
              type: 'image',
              options: {hotspot: true},
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'puesto',
              title: 'Puesto',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'descripcion',
              title: 'Descripción',
              type: 'text',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {
              title: 'puesto',
              subtitle: 'descripcion',
              media: 'imagen',
              },
              prepare: ({ title, subtitle, media }) => ({
                  title,
                  subtitle,
              }),
          },
        },
      ],
    }),
    ],
    preview: {
        prepare:  () => ({
            title: 'Carrusel Avatar Section',
        })
    }
})
