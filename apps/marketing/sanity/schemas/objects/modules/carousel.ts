import { defineField, defineType } from 'sanity'
export default defineType({
  name: 'carousel',
  title: 'Carrusel de imágenes',
  type: 'object',
  // Preview para que se vea en el Studio al insertar el bloque
  preview: {
    select: {
      title: 'title',
      media: 'images.0'
    },
    prepare(selection) {
      const { title, media } = selection
      return {
        title: title || 'Carrusel (sin título)',
        media,
      }
    },
  },
  fields: [
    defineField({
      name: 'title',
      title: 'Título del carrusel (opcional)',
      type: 'string',
    }),
    defineField({
      name: 'images',
      title: 'Imágenes',
      type: 'array',
      of: [
        {
          type: 'image',
          title: 'Imagen',
          options: {
            hotspot: true,
          },
        
    
        },
      ],
      
      validation: (Rule) => Rule.min(2).error('El carrusel debe tener al menos 2 imágenes.'),
    }),
  ],
})
