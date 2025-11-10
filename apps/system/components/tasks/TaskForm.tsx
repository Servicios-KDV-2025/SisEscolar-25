import { UseFormReturn, useWatch } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@repo/ui/components/shadcn/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select";
import { Input } from "@repo/ui/components/shadcn/input";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { taskFormSchema } from '@/types/form/taskSchema';
import { z } from "zod";
import { useQuery } from 'convex/react';
import { Id } from '@repo/convex/convex/_generated/dataModel';
import { api } from '@repo/convex/convex/_generated/api';

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

  return (
    <div className="space-y-4">
      {/* Selección de Clase */}
      <FormField
        control={form.control}
        name="classCatalogId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Clase *</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={operation === "view"}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una clase" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {teacherClasses?.map((clase) => (
                  <SelectItem key={clase._id} value={clase._id}>
                    {clase.name}
                    {/* Mostrar información adicional solo si está disponible */}
                    {(clase.subject || clase.group) && (
                      <span className="text-muted-foreground">
                        {clase.subject && ` - ${clase.subject}`}
                        {clase.group && ` (${clase.group})`}
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Selección de Término */}
      <FormField
        control={form.control}
        name="termId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Periodo *</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={operation === "view"}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un periodo" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {allTerms?.map((term) => (
                  <SelectItem key={term._id} value={term._id}>
                    {term.name} ({term.key})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Selección de Rúbrica - SOLO mostrar si hay classCatalogId y termId */}
      {(classCatalogId && termId) && (
        <FormField
          control={form.control}
          name="gradeRubricId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rúbrica de Calificación *</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={operation === "view" || !gradeRubrics?.length}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        gradeRubrics?.length
                          ? "Selecciona una rúbrica"
                          : "No hay rúbricas disponibles"
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {gradeRubrics?.map((rubric) => (
                    <SelectItem key={rubric._id} value={rubric._id}>
                      {rubric.name} (Max: {rubric.maxScore} pts)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
              {gradeRubrics && gradeRubrics.length === 0 && (
                <p className="text-sm text-amber-600">
                  No hay rúbricas de calificación para esta clase y término.
                  Primero debes crear una rúbrica en la sección de Calificaciones.
                </p>
              )}
            </FormItem>
          )}
        />
      )}

      {/* Título */}
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Título de la Tarea *</FormLabel>
            <FormControl>
              <Input
                placeholder="Ej: Ejercicios de Álgebra"
                {...field}
                disabled={operation === "view"}
                required
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Descripción */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descripción</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe las instrucciones de la tarea..."
                rows={3}
                {...field}
                disabled={operation === "view"}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Fecha y Hora */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de Entrega *</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  disabled={operation === "view"}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dueTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hora Límite *</FormLabel>
              <FormControl>
                <Input
                  type="time"
                  {...field}
                  disabled={operation === "view"}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Puntuación Máxima */}
      <FormField
        control={form.control}
        name="maxScore"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Puntuación Máxima *</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="Máxima puntuación 100"
                {...field}
                disabled={operation === "view"}
                min={1}
                max={100}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}