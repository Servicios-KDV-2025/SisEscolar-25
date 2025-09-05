import { Block } from 'payload'

export const Column: Block = {
  slug: 'column',
  interfaceName: 'ColumnBlock',
  fields: [
    {
      type: 'blocks',
      name: 'content',
      label: 'Content Blocks',
      blocks: [],
      blockReferences: ['textBlock', 'mediaBlock', 'priceBlock', 'formBlock', 'carouselAvatar'],
      maxRows: 2,
    },
    {
      type: 'select',
      name: 'columnWidth',
      required: true,
      options: [
        {
          label: 'Auto',
          value: 'auto',
        },
        {
          label: '100%',
          value: '1/1',
        },
        {
          label: '80%',
          value: '4/5',
        },
        {
          label: '75%',
          value: '3/4',
        },
        {
          label: '66%',
          value: '2/3',
        },
        {
          label: '50%',
          value: '1/2',
        },
        {
          label: '33%',
          value: '1/3',
        },
        {
          label: '25%',
          value: '1/4',
        },
        {
          label: '20%',
          value: '1/5',
        },
      ],
      defaultValue: 'auto',
    },
  ],
}
