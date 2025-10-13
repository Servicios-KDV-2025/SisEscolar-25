import {defineArrayMember, defineField} from 'sanity'


export const gridItemType = defineField({
  name: 'gridItem',
  title: 'Grid Item',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      type: 'image',
      options: {hotspot: true},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'priceBlock',
      type: 'priceBlock',
    }),
  ],
  preview: {
    select: {
      body: 'body',
      image: 'image',
      title: 'title',
    },
    prepare({body, image, title}) {
      return {
        media: image,
        title,
      }
    },
  },
})
