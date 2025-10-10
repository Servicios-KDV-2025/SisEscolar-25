import { PieChart } from "lucide-react";
import { defineType } from "sanity";


export default defineType({
    type: 'object',
    name: 'featureSection',
    title: 'Sección de Características',
    fields: [
        {
            type: 'string',
            name: 'title',
            title: 'Título', 
            description: 'Título de la sección de características',
            validation: Rule => Rule.required().min(10).max(100)
        },
        {
            type: 'string',
            name: 'subtitle',
            title: 'Subtítulo',
            description: 'Subtítulo de la sección de características',
            validation: Rule => Rule.required().min(10).max(150)
        },
        {
            type: 'array',
            name: 'features',
            title: 'Características',
            description: 'Lista de características a mostrar en la sección',
            of: [{ type: 'featureItem' }],
            validation: Rule => Rule.required().min(1).max(6)
        }
    ],
    preview: {
        select: {
            title: 'title',
            subtitle: 'subtitle',
            featureCount: 'features.length'
        },
        prepare({ title, subtitle, featureCount }) {
            return {
                title: 'Feature Section',
                subtitle: `${subtitle} - ${featureCount} ${featureCount === 1 ? 'característica' : 'características'}`,
                media : PieChart
            }
        }
    }
})