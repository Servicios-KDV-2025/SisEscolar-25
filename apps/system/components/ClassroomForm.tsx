import { UseFormReturn } from "react-hook-form";
import CrudFields, { TypeFields } from '@repo/ui/components/dialog/crud-fields';
import { AlertTriangle } from "@repo/ui/icons";
import { useEffect } from "react";

interface ClassroomFormProps {
  form: UseFormReturn<Record<string, unknown>>;
  operation: "create" | "edit" | "view" | "delete";
  classrooms?: Array<{
    id: string;
    name: string;
    location: string;
  }>;
  editingClassroomId?: string;
}

export function ClassroomForm({ 
  form, 
  operation, 
  classrooms = [], 
  editingClassroomId 
}: ClassroomFormProps) {
  const name = form.watch("name") as string || "";
  const location = form.watch("location") as string || "";
  
  // Validar duplicados en tiempo real
  const checkDuplicate = () => {
    if (!name || !location) return false;
    
    return classrooms.some((classroom) => {
      // Excluir el aula que se está editando
      if (editingClassroomId && classroom.id === editingClassroomId) {
        return false;
      }
      return (
        classroom.name.trim().toLowerCase() === name.trim().toLowerCase() &&
        classroom.location.trim().toLowerCase() === location.trim().toLowerCase()
      );
    });
  };

  const isDuplicate = checkDuplicate();
  
  // Mostrar error en el formulario si hay duplicado
  useEffect(() => {
    if (isDuplicate && operation !== "view") {
      form.setError("name", {
        type: "manual",
        message: "Ya existe un aula con este nombre y ubicación"
      });
      form.setError("location", {
        type: "manual",
        message: "Ya existe un aula con este nombre y ubicación"
      });
    } else {
      form.clearErrors(["name", "location"]);
    }
  }, [isDuplicate, form, operation]);

  const classroomFields: TypeFields = [
    {
      name: 'name',
      label: 'Nombre',
      type: 'text',
      placeholder: 'Ingresa el nombre del aula',
      required: true,
      maxLength: 50
    },
    {
      name: 'capacity',
      label: 'Capacidad',
      type: 'number',
      placeholder: 'Ingresa la capacidad (1-35)',
      required: true,
      min: 1,
      max: 35,
      step: '1'
    },
    {
      name: 'location',
      label: 'Ubicación',
      type: 'text',
      placeholder: 'Ingresa la ubicación',
      required: true,
      maxLength: 50
    },
    {
      name: 'status',
      label: 'Estado',
      type: 'select',
      options: [
        { value: 'active', label: 'Activo' },
        { value: 'inactive', label: 'Inactivo' }
      ],
      placeholder: 'Selecciona estatus',
      required: false
    }
  ];

  return (
    <div className="space-y-4 py-4">
      {/* Mensaje de duplicado */}
      {isDuplicate && operation !== "view" && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            <p className="text-sm font-medium">
              Ya existe un aula con este nombre y ubicación
            </p>
          </div>
          <p className="text-xs text-red-600 mt-1">
            Por favor, cambia el nombre o la ubicación.
          </p>
        </div>
      )}
      
      <CrudFields
        fields={classroomFields}
        operation={operation}
        form={form}
      />
    </div>
  );
}