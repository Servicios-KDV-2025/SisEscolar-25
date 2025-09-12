'use client'
import { useAllFormFields, useField } from '@payloadcms/ui'
import { TextFieldClientProps, TextFieldClientComponent } from 'payload'
import { getSiblingData } from 'payload/shared'
import { ColumnBlock } from '@/payload-types'
import React, { useEffect } from 'react'

export const ColumnWidth: TextFieldClientComponent = (props: TextFieldClientProps) => {
  const { path, field } = props

  const [fileds] = useAllFormFields()

  const { setValue, showError, errorMessage } = useField({ path })

  const slibingData = getSiblingData(fileds, path)

  const columnWidths =
    slibingData.columns && slibingData.columns.map((column: ColumnBlock) => column.columnWidth)

  const results =
    slibingData.columns &&
    columnWidths.map((width: string) => {
      if (width?.includes('1/1')) {
        return '100%'
      }
      if (width?.includes('auto')) {
        return '100%'
      } else {
        const splitFraction = width?.split('/')
        return (Number(splitFraction?.[0]) / Number(splitFraction?.[1])) * 100
      }
    })

  const percentage =
    results && isNaN(Math.ceil(results.reduce((acc: number, curr: number) => acc + curr, 0)))
      ? '100%'
      : results && `${Math.ceil(results.reduce((acc: number, curr: number) => acc + curr, 0))}%`

  const valid = percentage === '100%'

  useEffect(() => {
    setValue(percentage)
  }, [setValue, percentage])

  return (
    <div
      className={`field-type ${field.type} ${field.admin?.readOnly && 'read-only'} ${!valid && 'error'}`}
    >
      {/*
    now we'll create a label element, which will have an inline style of color, which will then check if valid is true
    if it is, we'll return black, otherwise it'll be red. we'll also need a class of 'field-label' and an htmlFor of
    field-${path} to make sure this label is associated with the input we're about to create. Inside the label, we'll
    inclue {field.label as string}
    */}
      <label
        style={{ color: valid ? 'black' : 'red' }}
        className={`field-label`}
        htmlFor={`field-${path}`}
      >
        {field.label as string}
      </label>
      {/* we need another div to surround our input; this div will have a class of field-type__wrap, another Payload class */}
      <div className={`field-type__wrap`}>
        {/* then we can include our input */}
        <input
          type={field.type} // with the type of field.type
          name={`field-${path}`} // a name to match our htmlFor above
          disabled={field.admin?.readOnly} // then if the field is readOnly, we'll return disabled as true
          readOnly={field.admin?.readOnly} // and the same thing for the readOnly attribute
          value={percentage} // our value will be percentage, which will update
          id={`field-${path}`} // and lastly set our id to be the same as the name and htmlFor attribute
        />
      </div>
      {/* to close out the custom Field component, we'll check if showError exists and return an errorMessage if it does */}
      {showError && <div className={`error`}>Error: {errorMessage}</div>}
    </div>
  )
}

export default ColumnWidth
