import {defineType} from 'sanity'

export default defineType({
    name: 'ImagewithText',
    title: 'Imagen con texto',
    type: 'object',
    fields: [
        {   
            name:'Titulo',
            title: 'Título',
            type: 'string',
            validation: (Rule) => Rule.required(),
        },{
        name:'Descripcion',
        title: 'Descripción',
        type: 'text',
        validation: (Rule) => Rule.required(),
        },
        {
        name:'Imagen',
        title: 'Imagen ilustrativa',
        type: 'image',
        options: { hotspot: true },
        validation: (Rule) => Rule.required(),
        },{
            name:'Alineacion',
            title: 'Alineación de imagen',
            type: 'string',
            options: {
                list: [
                    { title: 'Izquierda', value: 'left' },
                    { title: 'Derecha', value: 'right' },       

                ],
                layout: 'radio',
            },
            initialValue: 'left',
        },
    ],
    preview: {  
        select: {
            title: 'Titulo',
            media: 'Imagen',
        },
        prepare(selection) {
            const {title, media} = selection   
            return {
                title: title || 'Sin título',
                media,
            }   
        }
    }
})