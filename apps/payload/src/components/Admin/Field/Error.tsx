'use client'
import { useField } from '@payloadcms/ui'
import { FieldErrorClientComponent } from 'payload'

export const Error: FieldErrorClientComponent = ({ path, message }) => {
  const { showError } = useField({ path: path! })

  if (showError) {
    return (
      <div className={`error`}>
        <p>Error: {message}</p>
      </div>
    )
  } else {
    return null
  }
}
