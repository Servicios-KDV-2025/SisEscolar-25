"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@repo/convex/convex/_generated/api";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { Authenticated, AuthLoading } from "convex/react";
import { useUser } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
import { Button } from "@repo/ui/components/shadcn/button";
import { Badge } from "@repo/ui/components/shadcn/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { Input } from "@repo/ui/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import {
  FileText,
  Calendar,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  BookText,
  X,
  Plus
} from "@repo/ui/icons";
import {
  taskFormSchema,
  TaskFormData,
} from "../../../../../types/form/taskSchema";
import { useTask } from "../../../../../stores/taskStore";
import { useCurrentSchool } from "../../../../../stores/userSchoolsStore";
import { useUserWithConvex } from "stores/userStore";
import ListStudents from "components/asignaciones/ListStudents";
import { CrudDialog, useCrudDialog } from '@repo/ui/components/dialog/crud-dialog';
import { TaskForm } from 'components/tasks/TaskForm';
import { UseFormReturn } from 'react-hook-form';
import NotAuth from "../../../../../components/NotAuth";
import { useCrudToastMessages } from "../../../../../hooks/useCrudToastMessages";
import { GeneralDashboardSkeleton } from "components/skeletons/GeneralDashboardSkeleton";

export default function TaskManagement() {
  const { user: clerkUser } = useUser();
  const { currentUser, isLoading: userLoading } = useUserWithConvex(clerkUser?.id);
  const { currentSchool, isLoading: schoolLoading } = useCurrentSchool(currentUser?._id);
  const {
    allAssignmentsForFilters,
    allClassesForFilters,
    teacherAssignments: filteredTasks,
    teacherClasses,
    allTerms,
    gradeRubrics,
    assignmentsProgress,
    createTask,
    updateTask,
    deleteTask,
    getTaskProgressFromQuery,
    canCreateTask,
    canReadTask,
    canUpdateTask,
    canDeleteTask,
    currentRole,
    isLoading: permissionsLoading,
  } = useTask(currentSchool?.school._id);

  // Estados para filtros
  const [rubricFilter, setRubricFilter] = useState<string>("all");
  const [termFilter, setTermFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [searchTermTask, setSearchTermTask] = useState("");

  // Estado para el dialog de detalles
  const [detailsDialogOpen, setDetailsDialogOpen] = useState<boolean>(false);
  const [listStudentDialogOpen, setListStudentDialogOpen] = useState<boolean>(false);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<string | null>(null);

  // Query para obtener detalles de entregas
  const assignmentDetails = useQuery(
    api.functions.assignment.getAssignmentDeliveryDetails,
    selectedTaskForDetails
      ? { assignmentId: selectedTaskForDetails as Id<"assignment"> }
      : "skip"
  );

  // Query para obtener los estudiantes del tutor (solo si es tutor)
  const tutorStudents = useQuery(
    api.functions.student.getStudentsByTutor,
    // Aseguramos que solo se ejecute si los IDs son válidos y el rol es CORRECTO
    currentRole === 'tutor' && currentUser?._id && currentSchool?.school._id
      ? {
        tutorId: currentUser._id,
        schoolId: currentSchool.school._id
      }
      : "skip"
  );


  // Filtrar los detalles de la asignación según el rol
  const filteredAssignmentDetails = useMemo(() => {
    if (!assignmentDetails) return null;

    // Si no es tutor, devolver todos los detalles sin filtrar
    if (currentRole !== 'tutor') {
      return assignmentDetails;
    }

    // Si la lista de alumnos del tutor aún está cargando, mostramos todo temporalmente
    if (tutorStudents === undefined) {
      return assignmentDetails;
    }

    // Si ya cargó y el tutor no tiene estudiantes asignados, devolvemos lista vacía
    if (tutorStudents.length === 0) {
      return {
        ...assignmentDetails,
        submittedStudents: [],
        pendingStudents: [],
        submittedCount: 0,
        pendingCount: 0,
        totalStudents: 0,
      };
    }

    // 1. Creamos el Set con los IDs de TUS estudiantes (Estos vienen de la tabla Student, así que usan _id)
    const tutorStudentIds = new Set(
      tutorStudents.map(student => student._id)
    );

    // 2. Filtramos usando 'studentId' que es como viene en el objeto de la tarea
    const filteredSubmittedStudents = assignmentDetails.submittedStudents.filter(
      student => student && tutorStudentIds.has(student.studentId as Id<"student">)
    );

    // 3. Lo mismo para los pendientes, usando 'studentId'
    const filteredPendingStudents = assignmentDetails.pendingStudents.filter(
      student => student && tutorStudentIds.has(student.studentId as Id<"student">)
    );

    const newTotal = filteredSubmittedStudents.length + filteredPendingStudents.length;

    return {
      ...assignmentDetails,
      submittedStudents: filteredSubmittedStudents,
      pendingStudents: filteredPendingStudents,
      submittedCount: filteredSubmittedStudents.length,
      pendingCount: filteredPendingStudents.length,
      totalStudents: newTotal,
    };
  }, [assignmentDetails, tutorStudents, currentRole]);

  const {
    isOpen,
    operation,
    data,
    openCreate,
    openEdit,
    openDelete,
    close,
  } = useCrudDialog(taskFormSchema, {
    name: '',
    description: '',
    dueDate: '',
    dueTime: '23:59',
    maxScore: '',
    classCatalogId: '',
    termId: '',
    gradeRubricId: '',
  });

  //   Mensajes de toast personalizados
  const toastMessages = useCrudToastMessages("Asignación");

  const handleViewDetails = (taskId: string) => {
    setSelectedTaskForDetails(taskId);
    setDetailsDialogOpen(true);
  };

  const handleListStudent = (taskId: string) => {
    setSelectedTaskForDetails(taskId);
    setListStudentDialogOpen(true);
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!currentSchool?.school._id || !currentUser?._id) {
      console.error('Missing required IDs');
      return;
    }

    try {
      if (!values.dueDate || !values.dueTime) {
        console.error('Fecha u hora faltantes');
        return;
      }

      const dueDateTime = new Date(`${values.dueDate}T${values.dueTime}`);

      if (isNaN(dueDateTime.getTime())) {
        console.error('Fecha u hora inválidas');
        return;
      }

      const dueTimestamp = dueDateTime.getTime();

      if (operation === "create") {
        await createTask({
          classCatalogId: values.classCatalogId as Id<"classCatalog">,
          termId: values.termId as Id<"term">,
          gradeRubricId: values.gradeRubricId as Id<"gradeRubric">,
          name: values.name as string,
          description: values.description as string,
          dueDate: dueTimestamp,
          maxScore: parseInt(values.maxScore as string),
        })
        //   Los toasts ahora los maneja el CrudDialog automáticamente
      } else if (operation === "edit" && data?._id) {
        await updateTask({
          id: data._id as Id<"assignment">,
          patch: {
            classCatalogId: values.classCatalogId as Id<"classCatalog">,
            termId: values.termId as Id<"term">,
            gradeRubricId: values.gradeRubricId as Id<"gradeRubric">,
            name: values.name as string,
            description: values.description as string,
            dueDate: dueTimestamp,
            maxScore: parseInt(values.maxScore as string),
          },
        })
        //   Los toasts ahora los maneja el CrudDialog automáticamente
      }

      close();
    } catch (error) {
      //   Los toasts de error los maneja el CrudDialog automáticamente
      console.error('Error al procesar la tarea:', error);
      throw error; // Re-lanzar el error para que el CrudDialog lo maneje
    }
  };

  const handleDelete = async (taskId: string) => {
    await deleteTask(taskId)
    //   Los toasts ahora los maneja el CrudDialog automáticamente
  };

  const uniqueRubrics =
    allAssignmentsForFilters?.reduce(
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
    allAssignmentsForFilters?.reduce<Array<{ _id: string; name: string }>>((acc, task) => {
      const term = allTerms?.find((t) => t._id === task.termId);
      if (term && !acc.find((r) => r._id === term._id)) {
        acc.push({ _id: term._id, name: term.name });
      }
      return acc;
    }, []) ?? [];

  const uniqueSubject =
    allClassesForFilters?.map(clase => ({
      _id: clase?._id,
      name: clase?.name
    })) || [];

  const uniqueGradeGroups =
    allAssignmentsForFilters?.reduce<
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
      const subject = teacherClasses?.find((clase) => clase._id === task.classCatalogId);
      const searchMatch = searchTermTask === "" ||
        task.name.toLowerCase().includes(searchTermTask.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTermTask.toLowerCase()) ||
        task.group?.name.toLowerCase().includes(searchTermTask.toLowerCase()) ||
        task.gradeRubric?.name.toLowerCase().includes(searchTermTask.toLowerCase()) ||
        subject?.subject.toLowerCase().includes(searchTermTask.toLowerCase()) ||
        subject?.name.toLowerCase().includes(searchTermTask.toLowerCase());

      if (searchTermTask !== "" && !searchMatch) {
        return false;
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

  const isLoading =
    userLoading ||
    schoolLoading ||
    permissionsLoading ||
    allAssignmentsForFilters === undefined ||
    uniqueGradeGroups === undefined ||
    uniqueSubject === undefined ||
    uniqueTerm === undefined ||
    uniqueRubrics === undefined ||
    filteredTasksList === undefined;

  if (isLoading) {
    return <GeneralDashboardSkeleton nc={0} />
  }
  return (
    <>
      {canReadTask ? (
        <div className="space-y-8 p-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
            <div className="relative p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <BookText className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold tracking-tight">
                        Asignaciones
                      </h1>
                      <p className="text-lg text-muted-foreground">
                        Administra las asignaciones de los estudiantes
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filtros y Búsqueda
                  </CardTitle>
                  <CardDescription>
                    Encuentra asignaciones por nombre, grupo, materia, rúbrica,
                    periodo o estado
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative mb-6 w-full md:w-[50%]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, materia, grupo, rúbrica o descripción..."
                  value={searchTermTask}
                  onChange={(e) => setSearchTermTask(e.target.value)}
                  className="pl-10"
                />
                {searchTermTask && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {filteredTasksList.length} resultado{filteredTasksList.length !== 1 ? 's' : ''}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchTermTask("")}
                      className="h-6 w-6 p-0 hover:bg-gray-200"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="w-full flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Select value={groupFilter} onValueChange={setGroupFilter}>
                    <SelectTrigger className="w-full cursor-pointer">
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

                  <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                    <SelectTrigger className="w-full cursor-pointer">
                      <SelectValue placeholder="Selecciona una materia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las materias</SelectItem>
                      {uniqueSubject.map((subject) => (
                        <SelectItem key={subject._id} value={subject._id!}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={rubricFilter} onValueChange={setRubricFilter}>
                    <SelectTrigger className="w-full cursor-pointer">
                      <SelectValue placeholder="Selecciona una rúbrica" />
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

                  <Select value={termFilter} onValueChange={setTermFilter}>
                    <SelectTrigger className="w-full cursor-pointer">
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex flex-col gap-2">
                <CardTitle className="flex items-center gap-2">
                  
                  <span>Lista de Asignaciones</span>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 w-fit">
                    {filteredTasksList.length} asignaciones
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Haz clic en una asignación para acceder al panel de calificación de estudiantes.
                </CardDescription>
                </div>
                
                {canCreateTask &&
                    <Button
                      className="cursor-pointer w-full sm:w-auto"
                      onClick={openCreate}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Agregar Asignación</span>
                      <span className="sm:hidden">Agregar Asignación</span>
                    </Button>
                  }
              </div>
            </CardHeader>
            <CardContent>
              <AuthLoading>
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">
                    Cargando información de las asignaciones, por favor espere...
                  </p>
                </div>
              </AuthLoading>
              <Authenticated>
                <div className="space-y-4">
                  {filteredTasksList
                    ?.sort((a, b) => b._creationTime - a._creationTime)
                    .map((task) => (
                      <div
                        key={task._id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 mb-3">
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => (canUpdateTask ? handleListStudent(task._id) : handleViewDetails(task._id))}
                          >
                            <div className="flex flex-col xs:flex-row xs:items-center gap-2 mb-2">
                              <div className="flex items-center">
                                <FileText className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
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
                              </div>
                            </div>
                            <p className="text-gray-600 mb-2 break-words">{task.description}</p>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500">
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
                          <div className="flex flex-col md:flex-row gap-2 mt-3 md:mt-0">
                            {canUpdateTask && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEdit(task)}
                                className="cursor-pointer"
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Editar
                              </Button>
                            )}

                            {canDeleteTask && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 cursor-pointer"
                                onClick={() => openDelete(task)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Eliminar
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-3 pt-3 border-t md:flex-row md:justify-between md:items-center">

                          {/* CAMBIO: Agregamos esta condición para ocultar la barra global si es tutor */}
                          {currentRole !== 'tutor' ? (
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
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
                              <div className="w-full max-w-xs md:w-32 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-600 h-2 rounded-full"
                                  style={{
                                    width: `${getTaskProgressFromQuery(task._id, assignmentsProgress)?.progressPercentage || 0}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          ) : (
                            // Opcional: Puedes poner un texto alternativo o dejarlo vacío
                            <div className="text-sm text-muted-foreground">
                              Clic en Ver Entregas para revisar estatus
                            </div>
                          )}

                          {canReadTask && (
                            <div className="mt-2 md:mt-0 flex-shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(task._id)} // Aquí sí funcionará tu filtro
                                className="cursor-pointer w-full md:w-auto"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Ver Entregas
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  {(!filteredTasks || filteredTasks.length === 0) && (
                    <div className="text-center py-12">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <BookText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <div className="space-y-2 text-center">
                          <h3 className="text-lg font-medium text-foreground mb-2">
                            No se encontraron asignaciones
                          </h3>
                          {currentRole !== 'tutor' ? (
                            <p className="text-muted-foreground mb-4">
                              No hay asignaciones creadas. Crea tu primera asignación para comenzar a calificar.
                            </p>
                          ) : (
                            <>
                              <p className="text-muted-foreground">Aún no se tiene asignaciones al alumno.</p>
                              <p className="text-muted-foreground">Si al alumno ya cuenta con asignaciones y no se ve información comunicate con soporte.</p>
                            </>
                          )}
                        </div>
                        {canCreateTask &&
                          <Button
                            className="cursor-pointer w-full sm:w-auto"
                            onClick={openCreate}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            <span>Agregar Asignación</span>
                          </Button>
                        }
                      </div>
                    </div>
                  )}
                </div>
              </Authenticated>
            </CardContent>
          </Card>

          <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Detalles de: {filteredAssignmentDetails?.assignment.name}
                </DialogTitle>
              </DialogHeader>

              {filteredAssignmentDetails && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Clase:
                      </span>
                      <p className="text-gray-900">
                        {filteredAssignmentDetails.classCatalog.name}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Fecha de Entrega:
                      </span>
                      <p className="text-gray-900">
                        {new Date(
                          filteredAssignmentDetails.assignment.dueDate
                        ).toLocaleDateString("es-MX")}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Progreso:
                      </span>
                      <p className="text-gray-900">
                        {filteredAssignmentDetails.submittedCount}/
                        {filteredAssignmentDetails.totalStudents}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Estado:
                      </span>
                      <Badge
                        className={
                          filteredAssignmentDetails.submittedCount ===
                            filteredAssignmentDetails.totalStudents
                            ? "bg-green-100 text-green-800"
                            : filteredAssignmentDetails.submittedCount > 0
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }
                      >
                        {filteredAssignmentDetails.submittedCount ===
                          filteredAssignmentDetails.totalStudents
                          ? "Completada"
                          : filteredAssignmentDetails.submittedCount > 0
                            ? "En Progreso"
                            : "Sin Entregas"}
                      </Badge>
                    </div>
                    <div className="text-gray-900">
                      {filteredAssignmentDetails.totalStudents > 0 ? (
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.round((filteredAssignmentDetails.submittedCount / filteredAssignmentDetails.totalStudents) * 100)}%`,
                              }}
                            />
                          </div>
                          <div className="text-sm font-semibold text-gray-700 min-w-[3rem] text-right">
                            {Math.round(
                              (filteredAssignmentDetails.submittedCount /
                                filteredAssignmentDetails.totalStudents) *
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

                  {currentRole === 'tutor' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        Mostrando solo los estudiantes asignados a tu tutoría
                      </p>
                    </div>
                  )}

                  {filteredAssignmentDetails.submittedStudents.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-green-700 mb-3 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Estudiantes que Entregaron (
                        {filteredAssignmentDetails.submittedCount})
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {filteredAssignmentDetails.submittedStudents
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
                                  ? `${student.grade}/${filteredAssignmentDetails.assignment.maxScore}`
                                  : "Sin calificar"}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {filteredAssignmentDetails.pendingStudents.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-red-700 mb-3 flex items-center">
                        <XCircle className="w-5 h-5 mr-2" />
                        Estudiantes Pendientes ({filteredAssignmentDetails.pendingCount})
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {filteredAssignmentDetails.pendingStudents
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

          <CrudDialog
            operation={operation}
            title={
              operation === "create"
                ? "Crear Nueva Asignación"
                : operation === "edit"
                  ? "Editar Asignación"
                  : "Ver Asignación"
            }
            description={
              operation === "create"
                ? "Define una nueva Asignación para tus estudiantes"
                : operation === "edit"
                  ? "Modifica los datos de la asignación"
                  : "Información de la asignación"
            }
            schema={taskFormSchema}
            defaultValues={{
              name: '',
              description: '',
              dueDate: '',
              dueTime: '23:59',
              maxScore: '',
              classCatalogId: '',
              termId: '',
              gradeRubricId: '',
            }}
            data={
              operation === "edit" && data
                ? {
                  ...data,
                  dueDate: data.dueDate
                    ? new Date(data.dueDate as number).toISOString().split('T')[0]
                    : '',
                  dueTime: data.dueDate
                    ? new Date(data.dueDate as number).toTimeString().slice(0, 5)
                    : '23:59',
                  maxScore: data.maxScore ? data.maxScore.toString() : '',
                }
                : data
            }
            isOpen={isOpen}
            onOpenChange={close}
            onSubmit={handleSubmit}
            onDelete={handleDelete}
            toastMessages={toastMessages}
            disableDefaultToasts={false}
          >
            {(form, operation) => (
              <TaskForm
                form={form as unknown as UseFormReturn<TaskFormData>}
                operation={operation}
                teacherClasses={teacherClasses}
                allTerms={allTerms}
                gradeRubrics={gradeRubrics}
              />
            )}
          </CrudDialog>

          <ListStudents
            open={listStudentDialogOpen}
            close={setListStudentDialogOpen}
            assignmentDetails={assignmentDetails}
          />
        </div>) : (
        <NotAuth
          pageName="Asignaciones"
          pageDetails="Administra las asignaciones"
          icon={BookText}
        />
      )}
    </>
  );
}