import { ImageIcon } from "@sanity/icons";
import { defineArrayMember, defineField } from "sanity";

export default defineField({
    type: 'array',
    name: 'body',
    title: 'Body',
    description:
        "This is where you can write the page's content. Including custom blocks like timelines for more a more visual display of information.",
    of: [
        // Paragraphs
        defineArrayMember({
            type: 'block',
            marks: {
                annotations: [
                    {
                        name: 'link',
                        type: 'object',
                        title: 'Link',
                        fields: [
                            {
                                name: 'href',
                                type: 'url',
                                title: 'Url',
                            },
                        ],
                    },
                ],
            },
            styles: [],
        }),
        // Custom blocks
        defineArrayMember({
          name: 'featureSection',
          type: 'featureSection',
        }),
        defineArrayMember({
          name: 'hero',
          type: 'heroSection',
        }),
        defineArrayMember({
          name: 'statsSection',
          type: 'statsSection',
        }),
        defineArrayMember({
          name: 'ctaSection',
          type: 'ctaSection',
        }),
        defineArrayMember({
            name: 'infoBlock',
            type: 'infoBlock',
        }),
        defineArrayMember({
            name: 'ImagewithText',
            type: 'ImagewithText',
        }),
        defineArrayMember({
          name: 'carousel',
          type: 'carousel',
        }),
        defineArrayMember({
            name: 'paymentStatus',
            type: 'paymentStatus',
        }),
        defineArrayMember({
            name: 'featureBlock',
            type: 'featureBlock',
        }),
        defineArrayMember({
            name: 'faqBlock',
            type: 'faqBlock',
        }),
        defineArrayMember({
            name: 'CarBlock',
            type: 'CarBlock',  
        }),
        
        defineField({
            type: 'image',
            icon: ImageIcon,
            name: 'image',
            title: 'Image',
            options: {
                hotspot: true,
            },
            preview: {
                select: {
                    media: 'asset',
                    title: 'caption',
                },
            },
            fields: [
                defineField({
                    title: 'Caption',
                    name: 'caption',
                    type: 'string',
                }),
                defineField({
                    name: 'alt',
                    type: 'string',
                    title: 'Alt text',
                    description: 'Alternative text for screenreaders. Falls back on caption if not set',
                }),
            ],
        }),
    ],
});