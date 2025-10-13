import { defineType } from "sanity";

export default defineType({
    type: 'object',
    name: 'featureItem',
    title: 'Elemento de Característica',
    fields: [
        {
             type: 'string',
             name: 'title',
             title: 'Título',
             description: 'Título de la característica',
             validation: Rule => Rule.required().min(5)
        },
         {
             type: 'string',
             name: 'description',
             title: 'Descripción',
             description: 'Descripción de la característica',
             validation: Rule => Rule.required().min(5)
        },
    ]
})