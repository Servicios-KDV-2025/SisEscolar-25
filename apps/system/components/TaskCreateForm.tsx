// apps/system/components/tasks/TaskCreateForm.tsx
"use client";

import { useTask } from "../stores/taskStore";
import {
  validateTaskForm,
  getValidationErrors,
} from "../types/form/taskSchema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/shadcn/dialog";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import { Plus } from "@repo/ui/icons";

// Componente para contador de caracteres
const CharacterCounter = ({
  current,
  max,
}: {
  current: number;
  max: number;
}) => {
  const remaining = max - current;
  const isNearLimit = remaining <= 10;
  const isOverLimit = remaining < 0;

  return (
    <div
      className={`text-xs mt-1 ${
        isOverLimit
          ? "text-red-600"
          : isNearLimit
          ? "text-amber-600"
          : "text-gray-500"
      }`}
    >
      {current}/{max} caracteres{" "}
      {remaining >= 0
        ? `(${remaining} restantes)`
        : `(${Math.abs(remaining)} de más)`}
    </div>
  );
};

interface TaskCreateFormProps {
  triggerButton?: React.ReactNode;
}

export function TaskCreateForm({ triggerButton }: TaskCreateFormProps) {
  const {
    formData,
    validationErrors,
    isCreateDialogOpen,
    isCreating,
    teacherClasses,
    allTerms,
    gradeRubrics,
    setFormData,
    setCreateDialogOpen,
    clearFieldError,
    setValidationErrors,
    createTask,
  } = useTask();

  const handleCreateTask = async () => {
    try {
      // Validar datos con Zod
      const validation = validateTaskForm(formData);

      if (!validation.success) {
        // Mostrar errores de validación
        const errors = getValidationErrors(formData);
        setValidationErrors(errors || {});
        return;
      }

      // Limpiar errores si la validación es exitosa
      setValidationErrors({});

      // Combinar fecha y hora para crear el timestamp
      const dueDateTime = new Date(`${formData.dueDate}T${formData.dueTime}`);
      const dueTimestamp = dueDateTime.getTime();

      await createTask({
        classCatalogId: formData.classCatalogId,
        termId: formData.termId,
        gradeRubricId: formData.gradeRubricId,
        name: formData.name,
        description: formData.description || undefined,
        dueDate: dueTimestamp,
        maxScore: parseInt(formData.maxScore),
      });
    } catch (error) {
      console.error("Error al crear la tarea:", error);
      alert("Error al crear la tarea");
    }
  };

  return (
    <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button className="cursor-pointer w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Agregar Asignación</span>
            <span className="sm:hidden">Agregar Asignación</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[500px] sm:w-full sm:max-w-[600px] lg:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nueva Asignación</DialogTitle>
          <DialogDescription>
            Define una nueva Asignación para tus estudiantes
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Selección de Clase */}
          <div className="grid gap-2">
            <Label htmlFor="classCatalogId">Clase *</Label>
            <Select
              value={formData.classCatalogId}
              onValueChange={(value) => {
                setFormData({ classCatalogId: value });
                clearFieldError("classCatalogId");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una clase" />
              </SelectTrigger>
              <SelectContent>
                {teacherClasses?.map((clase) => (
                  <SelectItem key={clase._id} value={clase._id}>
                    {clase.name} - {clase.subject} ({clase.group})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.classCatalogId && (
              <p className="text-sm text-red-600">
                {validationErrors.classCatalogId[0]}
              </p>
            )}
          </div>

          {/* Selección de Término */}
          <div className="grid gap-2">
            <Label htmlFor="termId">Periodo *</Label>
            <Select
              value={formData.termId}
              onValueChange={(value) => {
                setFormData({ termId: value });
                clearFieldError("termId");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un periodo" />
              </SelectTrigger>
              <SelectContent>
                {allTerms?.map((term) => (
                  <SelectItem key={term._id} value={term._id}>
                    {term.name} ({term.key})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.termId && (
              <p className="text-sm text-red-600">
                {validationErrors.termId[0]}
              </p>
            )}
          </div>

          {/* Selección de Rúbrica de Calificación */}
          {formData.classCatalogId && formData.termId && (
            <div className="grid gap-2">
              <Label htmlFor="gradeRubricId">Rúbrica de Calificación *</Label>
              <Select
                value={formData.gradeRubricId}
                onValueChange={(value) => {
                  setFormData({ gradeRubricId: value });
                  clearFieldError("gradeRubricId");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una rúbrica" />
                </SelectTrigger>
                <SelectContent>
                  {gradeRubrics?.map((rubric) => (
                    <SelectItem key={rubric._id} value={rubric._id}>
                      {rubric.name} (Max: {rubric.maxScore} pts)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.gradeRubricId && (
                <p className="text-sm text-red-600">
                  {validationErrors.gradeRubricId[0]}
                </p>
              )}
              {gradeRubrics && gradeRubrics.length === 0 && (
                <p className="text-sm text-amber-600">
                  No hay rúbricas de calificación para esta clase y término.
                  Primero debes crear una rúbrica en la sección de
                  Calificaciones.
                </p>
              )}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="taskTitle">Título de la Tarea *</Label>
            <Input
              id="taskTitle"
              placeholder="Ej: Ejercicios de Álgebra"
              value={formData.name}
              onChange={(e) => {
                setFormData({ name: e.target.value });
                clearFieldError("name");
              }}
            />
            <CharacterCounter current={formData.name.length} max={100} />
            {validationErrors.name && (
              <p className="text-sm text-red-600">
                {validationErrors.name[0]}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="taskDescription">Descripción</Label>
            <Textarea
              id="taskDescription"
              placeholder="Describe las instrucciones de la tarea..."
              rows={3}
              value={formData.description}
              onChange={(e) => {
                setFormData({ description: e.target.value });
                clearFieldError("description");
              }}
            />
            <CharacterCounter current={formData.description.length} max={500} />
            {validationErrors.description && (
              <p className="text-sm text-red-600">
                {validationErrors.description[0]}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Fecha de Entrega *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => {
                  setFormData({ dueDate: e.target.value });
                  clearFieldError("dueDate");
                }}
                className="w-full"
              />
              {validationErrors.dueDate && (
                <p className="text-sm text-red-600">
                  {validationErrors.dueDate[0]}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dueTime">Hora Límite *</Label>
              <Input
                id="dueTime"
                type="time"
                value={formData.dueTime}
                onChange={(e) => {
                  setFormData({ dueTime: e.target.value });
                  clearFieldError("dueTime");
                }}
                className="w-full"
              />
              {validationErrors.dueTime && (
                <p className="text-sm text-red-600">
                  {validationErrors.dueTime[0]}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="maxScore">Puntuación Máxima *</Label>
            <Input
              id="maxScore"
              type="number"
              placeholder="100"
              value={formData.maxScore}
              onChange={(e) => {
                setFormData({ maxScore: e.target.value });
                clearFieldError("maxScore");
              }}
            />
            {validationErrors.maxScore && (
              <p className="text-sm text-red-600">
                {validationErrors.maxScore[0]}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setCreateDialogOpen(false)}
            className="cursor-pointer w-full sm:w-auto order-2 sm:order-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateTask}
            disabled={
              isCreating ||
              !formData.classCatalogId ||
              !formData.termId ||
              !formData.gradeRubricId
            }
            className="cursor-pointer w-full sm:w-auto order-1 sm:order-2"
          >
            {isCreating ? "Creando..." : "Crear Tarea"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}



