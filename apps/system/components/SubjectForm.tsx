import { UseFormReturn } from "react-hook-form";
import CrudFields, { TypeFields } from '@repo/ui/components/dialog/crud-fields';

interface SubjectFormProps {
  form: UseFormReturn<Record<string, unknown>>;
  operation: "create" | "edit" | "view" | "delete";
}

export function SubjectForm({ form, operation }: SubjectFormProps) {
  const subjectFields: TypeFields = [
    {
      name: 'name',
      label: 'Nombre',
      type: 'text',
      placeholder: 'Nombre de la materia',
      required: true,
      maxLength: 25
    },
    {
      name: 'description',
      label: 'Descripción',
      type: 'textarea',
      placeholder: 'Descripción de la materia',
      required: false,
      maxLength: 150
    },
    {
      name: 'credits',
      label: 'Créditos',
      type: 'number',
      placeholder: 'Número de créditos',
      required: false,
      min: 1,
      max: 10,
      step: '1'
    },
    {
      name: 'status',
      label: 'Estado',
      type: 'select',
      options: [
        { value: 'active', label: 'Materia activa' },
        { value: 'inactive', label: 'Materia inactiva' }
      ],
      placeholder: 'Selecciona un estado',
      required: true
    }
  ];

  return (
    <CrudFields
      fields={subjectFields}
      operation={operation}
      form={form}
    />
  );
}