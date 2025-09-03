'use client'
import React from 'react'
import { icons } from 'lucide-react'
import { SelectInput, useField } from '@payloadcms/ui'
import { FieldClientComponent, OptionObject, SelectFieldClientComponent } from 'payload'

export function generateLucideIconOptions(): OptionObject[] {
  const lucideIconOptions: OptionObject[] = []
  Object.keys(icons).forEach((icon) => {
    lucideIconOptions.push({
      label: icon,
      value: icon,
    })
  })

  return lucideIconOptions
}

const IconPicker: React.FC<{ path: string }> = ({ path }) => {
  const { value, setValue } = useField<string>({ path })
  return (
    <SelectInput
      path={path}
      name={path}
      options={generateLucideIconOptions()}
      value={value}
      onChange={(e) => {
        if (!Array.isArray(e)) {
          setValue(e.value)
        }
      }}
    />
  )
}

export default IconPicker
