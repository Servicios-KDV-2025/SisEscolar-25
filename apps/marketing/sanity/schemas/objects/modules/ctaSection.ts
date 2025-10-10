import { Rocket } from 'lucide-react';
import { defineType } from 'sanity';

export default defineType({
  name: 'ctaSection',
  title: 'CTA Section',
    type: 'object',
  
  fields: [
    {
      name: 'titulo',
      title: 'Título',
      type: 'string',
    },
    {
      name: 'subtitulo',
      title: 'Subtítulo',
      type: 'string',
    },
    {
      name: 'beneficios',
      title: 'Beneficios',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'benefitItem',
          title: 'Benefit Item',
          fields: [
            {
              name: 'beneficio',
              title: 'Beneficio',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
          ],
        },
      ],
    },
    ],
    preview: {
        select: {
            title: 'titulo',
            subtitle: 'subtitulo',
        },
        prepare : ({ subtitle }) => ({
            title: 'CTA Section',
            subtitle: subtitle,
            media : Rocket
        })
    }
});