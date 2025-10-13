import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'contentWithMedia',
  title: 'Contenido con media',
  type: 'object',
  preview: {
    select: {
      title: 'content.0',
      media: 'image',
    },
    prepare(selection) {
      const {title, media} = selection
      return {
        title: 'Contenido con media',
        media,
      }
    },
  },
  fields: [
     {
            name: 'body',
            title: 'Título',
            type: 'array',
            of: [
                {
                    type: 'block',
                    marks: {
                        decorators: [
                            { title: "Strong", value: "strong" },
                            { title: "Emphasis", value: "em" },
                            { title: "Code", value: "code" },
                            { title: "Underline", value: "underline" },
                            { title: "Strike", value: "strike-through" },
                       ]
                    }
                }
            ]
      },
      
    defineField({
      name: 'image',
      title: 'Imagen',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'textPosition',
      title: 'Posición del texto',
      type: 'string',
      initialValue: 'Left',
      options: {
        list: [
          {title: 'Left', value: 'Left'},
          {title: 'Right', value: 'Right'},
        ],
      },
    }),
  ],
})