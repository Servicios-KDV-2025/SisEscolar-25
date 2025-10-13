import { defineField, defineType } from "sanity";

export  default defineType({
    name: 'linkExternal',
    title: 'Link External',
    type: 'object',
    fields: [
        defineField({
            name: 'label',
            title: 'Label',
            type: 'string',
            validation: Rule => Rule.required().min(2)
        }),
        defineField({
            name: 'url',
            title: 'URL',
            type: 'url',
            validation: (Rule) => Rule.required().uri({scheme: ['http', 'https']}),
        })
    ]
})