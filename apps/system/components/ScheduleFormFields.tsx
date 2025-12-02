import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/shadcn/form";
import { Input } from "@repo/ui/components/shadcn/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@repo/ui/components/shadcn/select";
import { UseFormReturn } from "react-hook-form";
import { ScheduleFormData } from "schema/scheduleSchema";

interface ScheduleFormFieldsProps {
  form: UseFormReturn<ScheduleFormData>;
  operation: "create" | "edit" | "view" | "delete";
}

export function ScheduleFormFields({ form, operation }: ScheduleFormFieldsProps) {
  return (
    <div className="space-y-4">
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
      <FormField
        control={form.control}
        name="day"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Dia de la semana</FormLabel>
            <FormControl>
              <Select
                onValueChange={field.onChange}
                value={
                  field.value as
                  | "lun."
                  | "mar."
                  | "mié."
                  | "jue."
                  | "vie."
                }
                disabled={operation === "view"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un día" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="lun.">Lunes</SelectItem>
                  <SelectItem value="mar.">Martes</SelectItem>
                  <SelectItem value="mié.">Miercoles</SelectItem>
                  <SelectItem value="jue.">Jueves</SelectItem>
                  <SelectItem value="vie.">Viernes</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="startTime"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Hora inicio</FormLabel>
            <FormControl>
              <Input
                type="time"
                {...field}
                value={field.value as string}
                disabled={operation === "view"}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="endTime"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Hora fin</FormLabel>
            <FormControl>
              <Input
                type="time"
                {...field}
                value={field.value as string}
                disabled={operation === "view"}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Estado</FormLabel>
            <FormControl>
              <Select
                onValueChange={field.onChange}
                value={field.value as "active" | "inactive"}
                disabled={operation === "view"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
