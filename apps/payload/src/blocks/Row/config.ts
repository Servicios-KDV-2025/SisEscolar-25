import { Block } from 'payload'

export const Row: Block = {
  slug: 'row',
  interfaceName: 'RowBlock',
  fields: [
    {
      name: 'totalWidth',
      type: 'text',
      validate: (value: any) => {
        if (value === '100%') {
          return true
        } else {
          return 'Value debe ser 100%'
        }
      },
      admin: {
        readOnly: true,
        components: {
          Field: {
            path: 'src/collections/fields/ColumnWidth.tsx',
          },
          Error: {
            path: 'src/components/Admin/Field/Error.tsx#Error',
            clientProps: {
              message: 'El ancho total debe ser 100%',
            },
          },
        },
      },
    },
    {
      type: 'blocks',
      name: 'columns',
      label: 'Columnas',
      blocks: [],
      blockReferences: ['column'],
      maxRows: 4,
    },
  ],
}
