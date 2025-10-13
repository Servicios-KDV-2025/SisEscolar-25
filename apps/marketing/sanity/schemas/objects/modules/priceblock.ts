import { defineType } from "sanity";

export default defineType({
    name: 'priceBlock',
    title: 'Bloque de Precios',
    type: 'object',
    fields: [
        {
            name: 'price',
            type: 'reference',
            to: [{ type: 'price' }],
        }
    ],
    preview: {
        select: {
            title: 'price.name',
            subtitle: 'price.price',
        },
        prepare(value, viewOptions) {
            return {
                title: value.title || 'Bloque de Precios',
                subtitle: value.subtitle ? `Precio: $${value.subtitle}` : 'Sin precio asignado',
            }
        },
    },

})