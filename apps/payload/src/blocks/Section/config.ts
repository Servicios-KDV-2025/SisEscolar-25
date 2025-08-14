import { Block } from 'payload'
import { Row } from '../Row/config'

export const Section: Block = {
  slug: 'section',
  interfaceName: 'SectionBlock',
  fields: [
    {
      type: 'blocks',
      name: 'rows',
      label: 'Contenido',
      blocks: [],
      blockReferences: ['row'],
    },
  ],
}
