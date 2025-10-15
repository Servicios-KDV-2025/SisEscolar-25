import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
    name: 'footer',
    title: 'Footer Columns',
    description: 'This is a block of text that will be displayed at the bottom of the page.',
    type: 'object',
    fields: [
        {
            name: 'columns',
            title: 'Columns',
            type: 'array',
            of: [
                {
                    type: 'object',
                    name: 'column',
                    fields: [
                        defineField({
                            name: 'titulo',
                            title: 'Título de la columna',
                            type: 'string',
                        }),
            defineField({
              name: 'links',
              title: 'Links',
              type: 'array',
              of: [
                defineArrayMember({ type: 'linkExternal', title: 'Link Externo' }),
                defineArrayMember({ type: 'linkInternal', title: 'Link Interno' }),
              ],
            }),
          ],
        },
            ]
        } 
      ],
    })