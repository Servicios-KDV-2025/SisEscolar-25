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
            validation: (Rule) => Rule.required().warning('Es recomendable agregar un título.'),
        },{
        name:'Descripcion',
        title: 'Descripción',
        type: 'text',   
      //of: [{type: 'block'}],
        validation: (Rule) => Rule.required().warning('Es recomendable agregar una descripción.'),
        },
        {
        name:'Imagen',
        title: 'Imagen ilustrativa',
        type: 'image',
        options: { hotspot: true },
        validation: (Rule) => Rule.required().warning('Es recomendable agregar mas de dos imagenes.'),
        },{
            name:'Alineacion',
            title: 'Alineación de imagen',
            type: 'string',
            initialValue: 'left',
            options: {
                list: [
                    { title: 'Izquierda', value: 'left' },
                    { title: 'Derecha', value: 'right' },       

                ],
                layout: 'radio',
            },
            
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