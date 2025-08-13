import {
  AlignFeature,
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
  ParagraphFeature,
} from '@payloadcms/richtext-lexical'
import { Block } from 'payload'

export const TextBlock: Block = {
  slug: 'textBlock',
  interfaceName: 'TextBlock',
  fields: [
    {
      name: 'content',
      type: 'richText',
      required: true,
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
            FixedToolbarFeature(),
            ParagraphFeature(),
            InlineToolbarFeature(),
            AlignFeature(),
          ]
        },
      }),
    },
  ],
}
