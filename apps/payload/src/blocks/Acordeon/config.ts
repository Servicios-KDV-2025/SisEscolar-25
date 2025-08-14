import { Block } from 'payload'

export const Acordeon: Block = {
  slug: 'acordeon',
  interfaceName: 'AcordeonBlock',
  fields: [
    {
      name: 'titulo',
      type: 'text',
      required: true,
    },
    {
      name: 'items',
      type: 'array',
      label: 'Secciones del acordeón',
      fields: [
        {
          name: 'titulo',
          type: 'text',
          required: true,
        },
        {
          name: 'contenido',
          type: 'textarea',
          required: true,
        },
      ],
    },
  ],
}
