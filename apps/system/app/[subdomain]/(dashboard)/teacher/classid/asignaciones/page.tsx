"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@repo/convex/convex/_generated/api";
import { Id } from "@repo/convex/convex/_generated/dataModel";
// import { useUser } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/components/shadcn/alert-dialog";
import { Badge } from "@repo/ui/components/shadcn/badge";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@repo/ui/components/shadcn/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
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
// import {
//   Tabs,
//   TabsContent,
//   TabsList,
//   TabsTrigger,
// } from "@repo/ui/components/shadcn/tabs";
import {
  // ArrowLeft,
  FileText,
  Calendar,
  // Clock,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
} from "@repo/ui/icons";
import Link from "next/link";
import {
  validateTaskForm,
  getValidationErrors,
} from "../../../../../../types/form/taskSchema";

import { useTask } from "../../../../../../stores/taskStore";
import { TaskCreateForm } from "../../../../../../components/TaskCreateForm";

// Tipos para TypeScript - usando los tipos del store

// interface TaskProgressProps {
//   task: Task;
//   onViewDetails: (task: Task) => void;
// }

export default function TaskManagement() {
  const {
    // Estado del store
    selectedTask,
    formData,
    validationErrors,
    isEditDialogOpen,
    isUpdating,

    // Datos
    teacherAssignments: filteredTasks,
    teacherClasses,
    allTerms,
    gradeRubrics,
    assignmentsProgress,

    // Acciones
    openEditModal,
    closeEditModal,
    setFormData,
    clearFieldError,
    setValidationErrors,
    updateTask,
    deleteTask,
    getTaskProgressFromQuery,
  } = useTask();

  // Estados para filtros (estos se mantienen locales)
  const [rubricFilter, setRubricFilter] = useState<string>("all");
  const [termFilter, setTermFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

  // Estado para el dialog de detalles
  const [detailsDialogOpen, setDetailsDialogOpen] = useState<boolean>(false);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<
    string | null
  >(null);

  // Query para obtener detalles de entregas
  const assignmentDetails = useQuery(
    api.functions.assignment.getAssignmentDeliveryDetails,
    selectedTaskForDetails
      ? { assignmentId: selectedTaskForDetails as Id<"assignment"> }
      : "skip"
  );

  // Función para abrir el dialog de detalles
  const handleViewDetails = (taskId: string) => {
    setSelectedTaskForDetails(taskId);
    setDetailsDialogOpen(true);
  };

  const handleUpdateTask = async () => {
    try {
      if (!selectedTask) {
        alert("No hay tarea seleccionada para actualizar");
        return;
      }

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

      await updateTask({
        id: selectedTask._id,
        patch: {
          classCatalogId: formData.classCatalogId,
          termId: formData.termId,
          gradeRubricId: formData.gradeRubricId,
          name: formData.name,
          description: formData.description || undefined,
          dueDate: dueTimestamp,
          maxScore: parseInt(formData.maxScore),
        },
      });

      // Limpiar formulario y cerrar diálogo
      setFormData({
        name: "",
        description: "",
        dueDate: "",
        dueTime: "23:59",
        maxScore: "",
        classCatalogId: "",
        termId: "",
        gradeRubricId: "",
      });
      setValidationErrors({});
      // setSelectedTask(null); // This is now managed by the store
      closeEditModal();
    } catch (error) {
      console.error("Error al actualizar la tarea:", error);
      alert("Error al actualizar la tarea");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
    } catch (error) {
      console.error("Error al eliminar la tarea:", error);
      alert("Error al eliminar la tarea");
    }
  };

  // Componente para contador de caracteres
  const CharacterCounter = ({
    current,
    max,
    // fieldName,
  }: {
    current: number;
    max: number;
    fieldName: string;
  }) => {
    const remaining = max - current;
    const isNearLimit = remaining <= 10;
    const isOverLimit = remaining < 0;

    return (
      <div
        className={`text-xs mt-1 ${isOverLimit ? "text-red-600" : isNearLimit ? "text-amber-600" : "text-gray-500"}`}
      >
        {current}/{max} caracteres{" "}
        {remaining >= 0
          ? `(${remaining} restantes)`
          : `(${Math.abs(remaining)} de más)`}
      </div>
    );
  };

  // Mutaciones
  // const createAssignment = useMutation(
  //   api.functions.assignment.createAssignment
  // );
  // const updateAssignment = useMutation(
  //   api.functions.assignment.updateAssignment
  // );
  // const deleteAssignment = useMutation(
  //   api.functions.assignment.deleteAssignment
  // );

  const uniqueRubrics =
    filteredTasks?.reduce(
      (acc, task) => {
        if (
          task.gradeRubric &&
          typeof task.gradeRubric._id === "string" &&
          !acc.find((r) => r._id === task.gradeRubric!._id)
        ) {
          acc.push({
            _id: task.gradeRubric._id,
            name: task.gradeRubric.name,
          });
        }
        return acc;
      },
      [] as Array<{ _id: string; name: string }>
    ) || [];

  const uniqueTerm =
    filteredTasks?.reduce<Array<{ _id: string; name: string }>>((acc, task) => {
      const term = allTerms?.find((t) => t._id === task.termId);
      if (term && !acc.find((r) => r._id === term._id)) {
        acc.push({ _id: term._id, name: term.name });
      }
      return acc;
    }, []) ?? [];

  const uniqueSubject =
    filteredTasks?.reduce<Array<{ _id: string; name: string }>>((acc, task) => {
      const subject = teacherClasses?.find(
        (t) => t._id === task.classCatalogId
      );
      if (subject && !acc.find((r) => r._id === subject._id)) {
        acc.push({ _id: subject._id, name: subject.name });
      }
      return acc;
    }, []) ?? [];

  const uniqueGradeGroups =
    filteredTasks?.reduce<
      Array<{ id: string; groupId: string; label: string }>
    >((acc, task) => {
      const group = task.group;

      if (group?.grade) {
        const comboId = `${group.grade}-${group._id}`;
        if (!acc.find((gg) => gg.id === comboId)) {
          acc.push({
            id: comboId,
            groupId: group._id,
            label: `Grado ${group.grade} - ${group.name}`,
          });
        }
      }

      return acc;
    }, []) ?? [];

  const filteredTasksList =
    filteredTasks?.filter((task) => {
      if (
        rubricFilter === "all" &&
        termFilter === "all" &&
        subjectFilter === "all" &&
        groupFilter === "all"
      ) {
        return true;
      }

      const rubricMatch =
        rubricFilter === "all" || task.gradeRubric?._id === rubricFilter;

      const termMatch = termFilter === "all" || task.termId === termFilter;

      const subjectMatch =
        subjectFilter === "all" || task.classCatalogId === subjectFilter;

      const groupMatch =
        groupFilter === "all" ||
        `${task.group?.grade}-${task.group?._id}` === groupFilter;

      return rubricMatch && termMatch && subjectMatch && groupMatch;
    }) ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  Gestión de Tareas
                </h1>
                <p className="text-gray-600">
                  Administra las tareas de tus clases
                </p>
              </div>
            </div>
            {/* Usar el componente reutilizable */}
            <TaskCreateForm />
          </div>
        </div>
      </header>

      {/* Edit Task Dialog - simplificado usando el store */}
      <Dialog open={isEditDialogOpen} onOpenChange={closeEditModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Asignación</DialogTitle>
            <DialogDescription>
              Modifica los datos de la asignación
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Selección de Clase */}
            <div className="grid gap-2">
              <Label htmlFor="editClassCatalogId">Clase *</Label>
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
              <Label htmlFor="editTermId">Periodo *</Label>
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
            <div className="grid gap-2">
              <Label htmlFor="editGradeRubricId">
                Rúbrica de Calificación *
              </Label>
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

            <div className="grid gap-2">
              <Label htmlFor="editTaskTitle">Título de la Tarea *</Label>
              <Input
                id="editTaskTitle"
                placeholder="Ej: Ejercicios de Álgebra"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ name: e.target.value });
                  clearFieldError("name");
                }}
              />
              <CharacterCounter
                current={formData.name.length}
                max={100}
                fieldName="name"
              />
              {validationErrors.name && (
                <p className="text-sm text-red-600">
                  {validationErrors.name[0]}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="editTaskDescription">Descripción</Label>
              <Textarea
                id="editTaskDescription"
                placeholder="Describe las instrucciones de la tarea..."
                rows={3}
                value={formData.description}
                onChange={(e) => {
                  setFormData({ description: e.target.value });
                  clearFieldError("description");
                }}
              />
              <CharacterCounter
                current={formData.description.length}
                max={500}
                fieldName="description"
              />
              {validationErrors.description && (
                <p className="text-sm text-red-600">
                  {validationErrors.description[0]}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="editDueDate">Fecha de Entrega *</Label>
                <Input
                  id="editDueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => {
                    setFormData({ dueDate: e.target.value });
                    clearFieldError("dueDate");
                  }}
                />
                {validationErrors.dueDate && (
                  <p className="text-sm text-red-600">
                    {validationErrors.dueDate[0]}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editDueTime">Hora Límite *</Label>
                <Input
                  id="editDueTime"
                  type="time"
                  value={formData.dueTime}
                  onChange={(e) => {
                    setFormData({ dueTime: e.target.value });
                    clearFieldError("dueTime");
                  }}
                />
                {validationErrors.dueTime && (
                  <p className="text-sm text-red-600">
                    {validationErrors.dueTime[0]}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="editMaxScore">Puntuación Máxima *</Label>
              <Input
                id="editMaxScore"
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
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setValidationErrors({});
                closeEditModal();
              }}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateTask}
              disabled={
                isUpdating ||
                !formData.classCatalogId ||
                !formData.termId ||
                !formData.gradeRubricId
              }
              className="cursor-pointer"
            >
              {isUpdating ? "Actualizando..." : "Actualizar Tarea"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4 flex gap-4 items-center">
          <Label htmlFor="groupFilter">Filtrar por Grupo</Label>
          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="w-64 cursor-pointer">
              <SelectValue placeholder="Selecciona un grupo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los grupos</SelectItem>
              {uniqueGradeGroups.map((gg) => (
                <SelectItem key={gg.id} value={gg.id}>
                  {gg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Label htmlFor="subjectFilter">Filtrar por Materia</Label>
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-64 cursor-pointer">
              <SelectValue placeholder="Selecciona una materia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las materias</SelectItem>
              {uniqueSubject.map((subject) => (
                <SelectItem key={subject._id} value={subject._id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Label htmlFor="rubricFilter">Filtrar por Rúbrica</Label>
          <Select value={rubricFilter} onValueChange={setRubricFilter}>
            <SelectTrigger className="w-64 cursor-pointer">
              <SelectValue placeholder="Selecciona una rúbrica " />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las rúbricas</SelectItem>
              {uniqueRubrics.map((rubric) => (
                <SelectItem key={rubric._id} value={rubric._id}>
                  {rubric.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Label htmlFor="termFilter">Filtrar por Periodos</Label>
          <Select value={termFilter} onValueChange={setTermFilter}>
            <SelectTrigger className="w-64 cursor-pointer">
              <SelectValue placeholder="Selecciona un periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los periodos</SelectItem>
              {uniqueTerm.map((term) => (
                <SelectItem key={term._id} value={term._id}>
                  {term.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Lista de Tareas</CardTitle>
            <CardDescription>
              Administra las tareas asignadas a tu clase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTasksList
                ?.sort((a, b) => b._creationTime - a._creationTime) 
                .map((task) => (
                <div
                  key={task._id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow "
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <Link href={`/teacher/classid/tasks/${task._id}`}>
                          <h3 className="text-lg font-semibold">
                            {task.gradeRubric?.name ?? "Sin rúbrica"} -{" "}
                            {task.name}
                            {task.group && (
                              <span className="text-sm font-normal text-gray-600 ml-2">
                                (Grupo: {task.group.grade}
                                {task.group.name})
                              </span>
                            )}
                          </h3>
                        </Link>
                      </div>
                      <p className="text-gray-600 mb-2">{task.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Vence: {new Date(task.dueDate).toLocaleDateString()} a
                          las{" "}
                          {new Date(task.dueDate).toLocaleTimeString("es-MX", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span>Puntuación máxima: {task.maxScore}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(task)}
                        className="cursor-pointer"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Eliminar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Esto eliminará
                              permanentemente la tarea y afectara los datos
                              relacionados a ella.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="cursor-pointer">
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTask(task._id)}
                              className=" bg-white text-red-600 border-2 border-red-600 hover:bg-red-600 hover:text-white cursor-pointer"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t">
                    <div className="flex items-center gap-4">
                      <span className="text-sm">
                        <span className="font-medium">
                          {getTaskProgressFromQuery(
                            task._id,
                            assignmentsProgress
                          )?.submittedCount || 0}
                        </span>{" "}
                        de{" "}
                        <span className="font-medium">
                          {getTaskProgressFromQuery(
                            task._id,
                            assignmentsProgress
                          )?.totalStudents || 0}
                        </span>{" "}
                        entregas
                      </span>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${getTaskProgressFromQuery(task._id, assignmentsProgress)?.progressPercentage || 0}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(task._id)}
                      className="cursor-pointer"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver Entregas
                    </Button>
                  </div>
                </div>
              ))}
              {(!filteredTasks || filteredTasks.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  No hay tareas creadas aún. Crea tu primera tarea usando el
                  botón &quot;Nueva Asignación&quot;.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalles de: {assignmentDetails?.assignment.name}
            </DialogTitle>
          </DialogHeader>

          {assignmentDetails && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Clase:
                  </span>
                  <p className="text-gray-900">
                    {assignmentDetails.classCatalog.name}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Fecha de Entrega:
                  </span>
                  <p className="text-gray-900">
                    {new Date(
                      assignmentDetails.assignment.dueDate
                    ).toLocaleDateString("es-ES")}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Progreso:
                  </span>
                  <p className="text-gray-900">
                    {assignmentDetails.submittedCount}/
                    {assignmentDetails.totalStudents}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Estado:
                  </span>
                  <Badge
                    className={
                      assignmentDetails.submittedCount ===
                      assignmentDetails.totalStudents
                        ? "bg-green-100 text-green-800"
                        : assignmentDetails.submittedCount > 0
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }
                  >
                    {assignmentDetails.submittedCount ===
                    assignmentDetails.totalStudents
                      ? "Completada"
                      : assignmentDetails.submittedCount > 0
                        ? "En Progreso"
                        : "Sin Entregas"}
                  </Badge>
                </div>
                <div className="text-gray-900 ">
                  {assignmentDetails.totalStudents > 0 ? (
                    <div className="flex items-center gap-3">
                      {/* Barra de progreso visual */}
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.round((assignmentDetails.submittedCount / assignmentDetails.totalStudents) * 100)}%`,
                          }}
                        />
                      </div>
                      {/* Porcentaje al lado */}
                      <div className="text-sm font-semibold text-gray-700 min-w-[3rem] text-right">
                        {Math.round(
                          (assignmentDetails.submittedCount /
                            assignmentDetails.totalStudents) *
                            100
                        )}
                        %
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2"></div>
                      <div className="text-sm font-semibold text-gray-700 min-w-[3rem] text-right">
                        0%
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {assignmentDetails.submittedStudents.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-green-700 mb-3 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Estudiantes que Entregaron (
                    {assignmentDetails.submittedCount})
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {assignmentDetails.submittedStudents
                      .filter((student) => student !== null)
                      .map((student, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between gap-2 p-2 bg-green-50 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-800">
                              {student.name}
                            </span>
                          </div>
                          <span className="text-xs text-green-600">
                            {student.grade !== null
                              ? `${student.grade}/${assignmentDetails.assignment.maxScore}`
                              : "Sin calificar"}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {assignmentDetails.pendingStudents.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-red-700 mb-3 flex items-center">
                    <XCircle className="w-5 h-5 mr-2" />
                    Estudiantes Pendientes ({assignmentDetails.pendingCount})
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {assignmentDetails.pendingStudents
                      .filter((student) => student !== null)
                      .map((student, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-red-50 rounded"
                        >
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-red-800">
                            {student.name}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
