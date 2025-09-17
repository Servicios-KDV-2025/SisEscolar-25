// config.ts - Versión temporal simplificada
import type { GlobalConfig } from 'payload'
import { revalidateHeader } from './hooks/revalidateHeader'

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
        {
          name: 'isButton',
          type: 'checkbox',
          label: 'Mostrar como botón',
          defaultValue: false,
        },
        // Comentamos temporalmente el submenu
        // {
        //   name: 'submenu',
        //   type: 'array',
        //   // ...
        // },
      ],
      maxRows: 6,
    },
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
}
