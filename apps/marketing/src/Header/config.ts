import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
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
        link({
          appearances: false,
        }),
        {
          name: 'isButton',
          type: 'checkbox',
          label: 'Mostrar como botón',
          defaultValue: false,
        },
        {
          name: 'buttonStyle',
          type: 'select',
          label: 'Estilo del botón',
          options: [
            {
              label: 'Primario',
              value: 'default',
            },
            {
              label: 'Secundario',
              value: 'secondary',
            },
            {
              label: 'Outline',
              value: 'outline',
            },
            {
              label: 'Ghost',
              value: 'ghost',
            },
            {
              label: 'Link',
              value: 'link',
            },
            {
              label: 'Destructivo',
              value: 'destructive',
            },
          ],
          admin: {
            condition: (_, siblingData) => siblingData?.isButton === true,
          },
        },
        {
          name: 'submenu',
          type: 'array',
          label: 'Submenú',
          maxRows: 10,
          fields: [
            link({
              appearances: false,
            }),
          ],
          admin: {
            condition: (_, siblingData) => siblingData?.isButton !== true,
            description:
              'Agregue elementos para crear un menú desplegable. No disponible para botones.',
          },
        },
      ],
      maxRows: 6,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/Header/RowLabel#RowLabel',
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
}
