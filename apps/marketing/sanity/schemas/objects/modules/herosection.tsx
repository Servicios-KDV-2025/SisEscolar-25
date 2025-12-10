import { InfoOutlineIcon, SparklesIcon } from "@sanity/icons";
import { LayoutDashboard } from "lucide-react";
import { defineField, defineType } from "sanity";

export default defineType({
    type: "object",
    name: "heroSection",
    title: "Hero Section",
    fields: [
        {
            name: 'titulo',
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
                            {
                                title: "Texto Primario",
                                value: "text_primary",
                                component: (props) => {
                                    return <span className= 'text-primary'>{props.children}</span>
                                },
                                icon: SparklesIcon
                            },
                            {
                                title: "Texto Secundario",
                                value: "text_secondary",
                                component: (props) => {
                                    return <span className= 'text-muted-foreground text-pretty'>{props.children}</span>
                                },
                                icon: InfoOutlineIcon
                            }
                       ]
                    }
                }
            ]
        },
        {
            type :"array",
            name : "butons",
            title : "Botones primarios",
            of: [
                {
                    type : 'object',
                    name : 'button',
                    fields : [
                    defineField({
                        name : 'linkType',
                        title : 'Tipo de enlace',
                        type: 'string',
                        options :{
                            list: [
                                {
                                title : 'Interno',
                                value: 'internal'
                            },
                            {
                                title : 'Externo',
                                value: 'external'
                            },
                            ],
                        layout : 'radio',
                        direction : 'horizontal'
                        },
                        initialValue : 'internal'
                    }),
                    defineField({
                        name : 'linkInternal', 
                        title : 'Enlace Interno',
                        type :  'linkInternal',
                        hidden : ({parent}) => parent?.linkType !== 'internal'                                                                                                                                                                                        
                    }),
                    defineField({
                        name : 'linkExternal', 
                        title : 'Enlace Externo',
                        type :  'linkExternal',
                        hidden : ({parent}) => parent?.linkType !== 'external'                                                                                                                                                                                        
                    })
                    ]
                }
            ]
        }
    ],
    preview: {
        select: {
            title: 'titulo',
            image: 'icon',
        },
        prepare : () => ({
            title: 'Hero Section',
            media: LayoutDashboard,
        })
    }
})