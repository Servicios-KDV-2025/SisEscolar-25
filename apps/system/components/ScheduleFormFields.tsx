import CrudFields, { TypeFields } from '@repo/ui/components/dialog/crud-fields';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/shadcn/form";
import { Input } from "@repo/ui/components/shadcn/input";
import { UseFormReturn } from "react-hook-form";
import { ScheduleFormData } from "schema/scheduleSchema";

interface ScheduleFormFieldsProps {
  form: UseFormReturn<ScheduleFormData>;
  operation: "create" | "edit" | "view" | "delete";
}

export function ScheduleFormFields({ form, operation }: ScheduleFormFieldsProps) {
  const scheduleFields: TypeFields = [
    {
      name: 'startTime',
      label: 'Hora inicio',
      type: 'time', // Usamos text porque CrudFields no tiene tipo 'time'
      placeholder: 'HH:MM (ej: 07:00)',
      required: true,
    },
    {
      name: 'endTime',
      label: 'Hora fin',
      type: 'time', // Usamos text porque CrudFields no tiene tipo 'time'
      placeholder: 'HH:MM (ej: 08:00)',
      required: true,
    },
    {
      name: 'day',
      label: 'Día de la semana',
      type: 'select',
      options: [
        { value: 'lun.', label: 'Lunes' },
        { value: 'mar.', label: 'Martes' },
        { value: 'mié.', label: 'Miércoles' },
        { value: 'jue.', label: 'Jueves' },
        { value: 'vie.', label: 'Viernes' },
      ],
      placeholder: 'Selecciona un día',
      required: true
    },
    {
      name: 'status',
      label: 'Estado',
      type: 'select',
      options: [
        { value: 'active', label: 'Activo' },
        { value: 'inactive', label: 'Inactivo' },
      ],
      placeholder: 'Selecciona un estado',
      required: true
    },
  ];

  return (
    <div className="space-y-4">
      {/* Campo name (generado automáticamente) */}
      <div className="mb-4 p-3 bg-gray-50 rounded-md">
        <p className="text-sm font-medium text-gray-700">Nombre del horario</p>
        <p className="text-base font-semibold text-gray-900">
          {form.getValues("name") || "Completa los campos para generar el nombre"}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          El nombre se genera automáticamente con base en el día y horario seleccionado
        </p>
      </div>

      {/* Campos usando CrudFields */}
      <CrudFields
        fields={scheduleFields} // Campo 'day'
        operation={operation}
        form={form as unknown as UseFormReturn<Record<string, unknown>>}
      />

      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre del horario</FormLabel>
            <FormControl>
              <Input
                type="text"
                {...field}
                value={(() => {
                  const day = form.watch("day");
                  const startTime = form.watch("startTime");
                  const endTime = form.watch("endTime");

                  const isValidValue = (value: string) =>
                    value != null &&
                    value !== "" &&
                    value.toString().trim() !== "";
                  const dayMap: { [key: string]: string } = {
                    "lun.": "Lunes",
                    "mar.": "Martes",
                    "mié.": "Miércoles",
                    "jue.": "Jueves",
                    "vie.": "Viernes",
                  };

                  const generatedName =
                    isValidValue(day as string) &&
                      isValidValue(startTime as string) &&
                      isValidValue(endTime as string)
                      ? `${dayMap[day as keyof typeof dayMap]} ${startTime}-${endTime}`
                      : "";

                  if (generatedName !== field.value) {
                    form.setValue(field.name, generatedName);
                  }

                  return generatedName;
                })()}
                placeholder="Completa día, hora inicio y fin"
                disabled={operation === "view"}
                readOnly={true}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
