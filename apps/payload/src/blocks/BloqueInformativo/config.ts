import { Block } from 'payload'

export const BloqueInformativo: Block = {
  slug: 'bloqueInformativo',
  interfaceName: 'BloqueInformativo',
  labels: {
    singular: 'Bloque Informativo',
    plural: 'Bloques Informativos',
  },
  fields: [
    {
      name: 'titulo',
      type: 'text',
      required: true,
    },
    {
      name: 'descripcionCorta',
      type: 'text',
      required: true,
    },
    {
      name: 'descripcionLarga',
      type: 'textarea',
      required: true,
    },
    {
      name: 'icono',
      label: 'Ícono (SVG o PNG)',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
  ],
}
