import { UseFormReturn, useWatch } from "react-hook-form";
import { taskFormSchema } from '@/types/form/taskSchema';
import { z } from "zod";
import { useQuery } from 'convex/react';
import { Id } from '@repo/convex/convex/_generated/dataModel';
import { api } from '@repo/convex/convex/_generated/api';
import CrudFields, { TypeFields } from '@repo/ui/components/dialog/crud-fields';

type TaskFormData = z.infer<typeof taskFormSchema>;

// En TaskForm.tsx - actualiza la interfaz
interface TaskFormProps {
  form: UseFormReturn<TaskFormData>;
  operation: "create" | "edit" | "view" | "delete";
  teacherClasses?: Array<{
    _id: string;
    name: string;
    subject?: string; // Hacer opcional
    group?: string;   // Hacer opcional
    // Agregar campos que puedan venir de diferentes fuentes
    schoolCycleId?: string;
    status?: string;
    classroomId?: string;
    teacherId?: string;
  }>;
  allTerms?: Array<{
    _id: string;
    name: string;
    key: string;
  }>;
  gradeRubrics?: Array<{
    _id: string;
    name: string;
    maxScore: number;
  }>;
}

export function TaskForm({
  form,
  operation,
  teacherClasses,
  allTerms,
  // gradeRubrics,
}: TaskFormProps) {
  // Observar los cambios en classCatalogId y termId para depuración
  const classCatalogId = useWatch({ control: form.control, name: "classCatalogId" });
  const termId = useWatch({ control: form.control, name: "termId" });

  // En TaskManagement, añade esta query
  const gradeRubrics = useQuery(
    api.functions.gradeRubrics.getGradeRubricsByClass,
    (classCatalogId && termId)
      ? {
        classCatalogId: classCatalogId as Id<"classCatalog">,
        termId: termId as Id<"term">,
        canViewAll: true,
      }
      : "skip"
  );

  // Campos base que siempre se muestran
  const baseFields: TypeFields = [{
    name: 'classCatalogId',
    label: 'Clase',
    type: 'select',
    options: teacherClasses?.map(clase => ({
      value: clase._id,
      label: `${clase.name}${clase.subject ? ` - ${clase.subject}` : ''}${clase.group ? ` (${clase.group})` : ''}`
    })) || [],
    placeholder: 'Selecciona una clase',
    required: true
  },
  {
    name: 'termId',
    label: 'Periodo',
    type: 'select',
    options: allTerms?.map(term => ({
      value: term._id,
      label: `${term.name} (${term.key})`
    })) || [],
    placeholder: 'Selecciona un periodo',
    required: true
  },
  ];

  const baseFields2: TypeFields = [{
    name: 'name',
    label: 'Título de la Tarea',
    type: 'text',
    placeholder: 'Ej: Ejercicios de Álgebra',
    required: true
  },
  {
    name: 'description',
    label: 'Descripción',
    type: 'textarea',
    placeholder: 'Describe las instrucciones de la tarea...',
    required: false,
    maxLength: 500
  },];

  // Campos de fecha/hora (se mantienen juntos en una fila)
  const dateTimeFields: TypeFields = [
    {
      name: 'dueDate',
      label: 'Fecha de Entrega',
      type: 'date',
      required: true,
    },
    {
      name: 'dueTime',
      label: 'Hora Límite',
      type: 'time',
      required: true,
      placeholder: 'HH:MM',
    },
  ];

  // Campos adicionales
  const additionalFields: TypeFields = [
    {
      name: 'maxScore',
      label: 'Puntuación Máxima',
      type: 'number',
      placeholder: 'Máxima puntuación 100',
      required: true,
      step: '1'
    },
  ];

  // Campo condicional para rúbrica
  const rubricField: TypeFields = classCatalogId && termId ? [
    {
      name: 'gradeRubricId',
      label: 'Rúbrica de Calificación',
      type: 'select',
      options: gradeRubrics?.map(rubric => ({
        value: rubric._id,
        label: `${rubric.name} (Max: ${rubric.maxScore} pts)`
      })) || [],
      placeholder: gradeRubrics?.length
        ? 'Selecciona una rúbrica'
        : 'No hay rúbricas disponibles',
      required: true
    }
  ] : [];

  return (
    <div className="space-y-4">
      {/* Selección de Clase y Selección de Término */}
      <CrudFields
        fields={baseFields}
        operation={operation}
        form={form as unknown as UseFormReturn<Record<string, unknown>>}
      />

      {/* Selección de Rúbrica - SOLO mostrar si hay classCatalogId y termId */}
      {rubricField.length > 0 && (
        <div>
          <CrudFields
            fields={rubricField}
            operation={operation}
            form={form as unknown as UseFormReturn<Record<string, unknown>>}
          />

          {gradeRubrics && gradeRubrics.length === 0 && (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-700">
                ⚠️ No hay rúbricas de calificación para esta clase y término.
                Primero debes crear una rúbrica en la sección de Calificaciones.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Título y Descripción */}
      <CrudFields
        fields={baseFields2}
        operation={operation}
        form={form as unknown as UseFormReturn<Record<string, unknown>>}
      />

      {/* Fecha y Hora */}
      <div className="flex flex-raw">
        {dateTimeFields.map((field) => {
          // Renderizar manualmente los campos de fecha/hora para tener más control
          if (field.name === 'dueDate') {
            return (
              <CrudFields
                key={field.name}
                fields={[field]}
                operation={operation}
                form={form as unknown as UseFormReturn<Record<string, unknown>>}
              />
            );
          }

          // Campo de hora personalizado
          if (field.name === 'dueTime') {
            return (
              <CrudFields
                key={field.name}
                fields={[{
                  ...field,
                  // Convertir el campo de hora a tipo 'time' usando un inputType personalizado
                  // Esto depende de cómo hayas implementado CrudFields
                }]}
                operation={operation}
                form={form as unknown as UseFormReturn<Record<string, unknown>>}
              />
            );
          }

          return null;
        })}
      </div>

      {/* Puntuación Máxima */}
      <CrudFields
        fields={additionalFields}
        operation={operation}
        form={form as unknown as UseFormReturn<Record<string, unknown>>}
      />
    </div>
  );
}