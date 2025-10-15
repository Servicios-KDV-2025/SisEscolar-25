import { defineField, defineType } from "sanity"


export default defineType({
    name: 'price',
    title: 'Precios',
    type: 'document',
    fields: [
        defineField({
            name: 'price',
            title: 'Precio',
            type: 'number',
            validation : (Rule) => Rule.required().min(0),
        }),
        defineField({
            name: 'title',
            title: 'Titulo',
            type: 'string',
            validation : (Rule) => Rule.required().min(2).max(100),
        }),
        defineField({
            name: 'id_stripe',
            title: 'Id Stripe',
            type: 'string',
            validation : (Rule) => Rule.required()
        }),
        defineField({
            name: 'description',
            title: 'Descipcion',
            type: 'string',
        }),
        defineField({
            name: 'features',
            title: 'Características',
            type: 'object',
            fields: [
                defineField({
                    name: 'featureList',
                    type: 'array',
                    title: 'Lista de características',
                    of: [{ type: 'string' }],
                    validation: (Rule) => Rule.required().min(1).max(10),
                })
            ]
        })
    ]
})