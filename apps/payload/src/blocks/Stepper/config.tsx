import { IconSelectorField } from '@/components/IconPicker/config'
import { Block } from 'payload'

export const Stepper: Block = {
  slug: 'stepper',
  interfaceName: 'StepperBlock',
  labels: {
    singular: 'Stepper',
    plural: 'Steppers',
  },
  fields: [
    {
      name: 'step1',
      label: 'Paso 1',
      type: 'group',
      fields: [
        { type: 'text', name: 'titulo', label: 'Título', required: true },
        { type: 'text', name: 'subtitulo', label: 'Subtítulo', required: true },
        IconSelectorField,
      ],
    },
    {
      name: 'step2',
      label: 'Paso 2',
      type: 'group',
      fields: [
        { type: 'text', name: 'titulo', label: 'Título', required: true },
        { type: 'text', name: 'subtitulo', label: 'Subtítulo', required: true },
      ],
    },
    {
      name: 'step3',
      label: 'Paso 3',
      type: 'group',
      fields: [
        { type: 'text', name: 'titulo', label: 'Título', required: true },
        { type: 'text', name: 'subtitulo', label: 'Subtítulo', required: true },
      ],
    },
    {
      name: 'step4',
      label: 'Paso 4',
      type: 'group',
      fields: [
        { type: 'text', name: 'titulo', label: 'Título', required: true },
        { type: 'text', name: 'subtitulo', label: 'Subtítulo', required: true },
      ],
    },
  ],
}
