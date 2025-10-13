import { Grid } from "lucide-react";
import { defineType } from "sanity";


export default defineType({
    name: 'statsSection',
    title: 'Stats Section',
    type: 'object',
    fields: [
        {
            name: 'title',
            type: 'string',
            title: 'Titulo',
        },
        {
            name: 'subtitle',
            type: 'string',
            title: 'Subtitulo',
        },
        {
            name: 'stats',
            title: 'Estadisticas',
            type: 'array',
            of: [
                 {
                    type: 'object',
                    name: 'statItem',
                    fields: [ 
                        {
                            type: 'string',
                            name: 'number',
                            title: 'Numero',
                        },
                        {
                            type: 'string',
                            name: 'label',
                            title: 'Resumen',
                        }
                    ]
                }
            ],
            validation: (Rule) => Rule.required(),
            preview: {
                select: {
                    number: 'number',
                    label: 'label'  
                },
                prepare: ({ label }) => ({
                    title: 'Stat',
                    subtitle: label
                })
            }
        }
    ],
    preview: {
        select: {
            title: 'title',
            subtitle: 'subtitle',
            stats: 'stats'
        },
        prepare: ({ subtitle, stats }) => {
            return {
                title: 'Stats Section',
                subtitle: subtitle ? `${subtitle} - ${stats?.length || 0} stats` : `${stats?.length || 0} stats`,
                media: Grid
            }
        }
    }
})