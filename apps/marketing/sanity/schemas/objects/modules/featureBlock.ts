export const featureBlock = {
  name: 'featureBlock',
  title: 'Bloque de Características',
  type: 'object',
  fields: [
    {
      name: 'title',
      title: 'Título Principal',
      type: 'string',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'features',
      title: 'Características',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'targetAudience',
              title: 'Para quién',
              type: 'string',
              validation: (Rule: any) => Rule.required()
            },
            {
              name: 'description',
              title: 'Descripción',
              type: 'text',
              validation: (Rule: any) => Rule.required()
            }
          ],
          preview: {
            select: {
              title: 'targetAudience',
              subtitle: 'description'
            }
          }
        }
      ]
    },
    {
      name: 'images',
      title: 'Imágenes',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true
          }
        }
      ],
      validation: (Rule: any) => Rule.max(3)
    },
    {
      name: 'cta',
      title: 'Llamado a la Acción',
      type: 'object',
      fields: [
        {
          name: 'label',
          title: 'Etiqueta',
          type: 'string'
        },
        {
          name: 'buttonText',
          title: 'Texto del Botón',
          type: 'string',
          validation: (Rule: any) => Rule.required()
        },
        {
          name: 'buttonUrl',
          title: 'URL del Botón',
          type: 'url'
        }
      ]
    }
  ]
};