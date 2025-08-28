import { Field } from 'payload'

export const IconSelectorField: Field = {
  name: 'lucidIcon',
  label: 'Icon',
  type: 'text',

  admin: {
    components: {
      Field: '@/components/IconPicker',
    },
  },
  required: true,
  hasMany: false,
  localized: false,
}
