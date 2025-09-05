'use client'

import * as React from 'react'
import { SelectInput, useField, FieldLabel } from '@payloadcms/ui'
import { library, IconName, IconPrefix, IconProp } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { OptionObject } from 'payload'

// Agrega solo los packs necesarios
library.add(fas, fab)

// Opciones seguras: solo los íconos realmente cargados

export const fontAwesomeIconOptions = (): OptionObject[] => {
  const options: OptionObject[] = []

  ;[fas, fab].forEach((iconPack) => {
    Object.keys(iconPack).forEach((key) => {
      const icon = iconPack[key]
      options.push({
        label: key,
        value: `${icon.prefix}/${icon.iconName}`,
      })
    })
  })

  return options
}

// Props que recibe el componente desde Payload
type FontAwesomeSelectComponentProps = {
  path: string
}

export const Select: React.FC<FontAwesomeSelectComponentProps> = ({ path }) => {
  const { value, setValue } = useField<string>({ path })

  let icon: IconProp = { prefix: 'fas', iconName: 'question' }
  if (value && value.includes('/')) {
    const [prefix, iconName] = value.split('/') as [IconPrefix, IconName]
    icon = { prefix, iconName }
  }

  return (
    <div>
      <FieldLabel label="Icon" required />

      <SelectInput
        path={path}
        name={path}
        label="Icon"
        required
        value={value}
        options={fontAwesomeIconOptions()}
        onChange={(val) => {
          const selected = Array.isArray(val) ? val[0] : val
          setValue(selected?.value || '')
        }}
      />

      {value && (
        <div style={{ marginTop: '1rem' }}>
          <strong>Preview:</strong> <FontAwesomeIcon icon={icon} style={{ fontSize: '1.5rem' }} />
        </div>
      )}
    </div>
  )
}
