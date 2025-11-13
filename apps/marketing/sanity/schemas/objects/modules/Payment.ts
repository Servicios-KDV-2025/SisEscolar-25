import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'paymentStatus',
  title: 'Estado de Pago',
  type: 'object',
  fields: [
    defineField({
      name: 'status',
      title: 'Estado del pago',
      type: 'string',
      initialValue: 'success',
      validation: (Rule) => Rule.required(),
      options: {
        list: [
          { title: 'Éxito (Verde)', value: 'success' },
          { title: 'Cancelado (Rojo)', value: 'cancelled' },
        ],
      },
    }),
    defineField({
      name: 'title',
      title: 'Título',
      type: 'string',
      initialValue: '¡Pago exitoso!',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'message',
      title: 'Mensaje',
      type: 'text',
      initialValue:
        'Gracias por tu compra. Hemos recibido tu pago y tu pedido está en proceso.',
    }),
    defineField({
      name: 'image',
      title: 'Imagen',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'button',
      title: 'Botón',
      type: 'object',
      fields: [
        defineField({
          name: 'label',
          title: 'Texto del botón',
          type: 'string',
          initialValue: 'Volver al inicio',
        }),
        defineField({
          name: 'url',
          title: 'URL de destino',
          type: 'url',
          initialValue: '/',
          validation: (Rule) =>
            Rule.uri({
              allowRelative: true,
              scheme: ['http', 'https', 'mailto', 'tel'],
            }),
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'status',
      media: 'image',
    },
    prepare(selection) {
      const {title, subtitle, media} = selection
      return {
        title: title || 'Estado de Pago',
        subtitle: subtitle === 'success' ? 'Éxito' : subtitle === 'cancelled' ? 'Cancelado' : subtitle,
        media,
      }
    },
  },
})
