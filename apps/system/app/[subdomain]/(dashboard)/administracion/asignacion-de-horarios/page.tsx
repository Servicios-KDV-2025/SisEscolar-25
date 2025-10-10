"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@repo/convex/convex/_generated/api";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useUserWithConvex } from "../../../../../stores/userStore";
import { useCurrentSchool } from "../../../../../stores/userSchoolsStore";
import { useGroup } from "stores/groupStore";
import { useSubject } from "stores/subjectStore";
import {
  useClassScheduleStore,
  useFilteredClasses,
  ClassItem,
} from "../../../../../stores/classSchudeleStore";
import {
  EditClassFormSchema,
  Schedule,
} from "../../../../../types/form/classScheduleSchema";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@repo/ui/components/shadcn/card";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Checkbox } from "@repo/ui/components/shadcn/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/shadcn/accordion";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/shadcn/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@repo/ui/components/shadcn/dialog";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Clock,
  MapPin,
  User,
  GraduationCap,
  Users,
  Filter,
} from "lucide-react";
import {
  CrudDialog,
  useCrudDialog,
} from "@repo/ui/components/dialog/crud-dialog";
import { toast } from "sonner";
import { Book, ClockPlus } from "@repo/ui/icons";
import { z } from "zod";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FullClassSchema } from "@/types/fullClassSchema";
import { ClassCatalogForm } from "../../../../../components/ClassCatalogForm";
import { usePermissions } from "hooks/usePermissions";
import { Subject as SubjectType } from "stores/subjectStore";
import { Group as GroupType } from "stores/groupStore";
import {
  ClassroomType,
  SchoolCycleType,
  TeacherType,
} from "@/types/temporalSchema";

// Tipos para los props de los componentes de pasos
type FullClassForm = UseFormReturn<z.infer<typeof FullClassSchema>>;

interface StepOneProps {
  form: FullClassForm;
  setFormStep: React.Dispatch<React.SetStateAction<number>>;
  subjects: SubjectType[] | undefined;
  groups: GroupType[] | undefined;
  schoolCycles: SchoolCycleType[] | undefined;
  classrooms?: ClassroomType[] | undefined;
  teachers: TeacherType[] | undefined;
  closeDialog: () => void;
}
interface StepTwoProps {
  form: FullClassForm;
  setFormStep: React.Dispatch<React.SetStateAction<number>>;
  schedules: Schedule[] | undefined;
  getDayName: (day: string) => string;
  formatTime: (time: string) => string;
  conflictScheduleIds: string[];
}

// Componente para el Paso 1 del formulario de creación
function StepOneContent({
  form,
  setFormStep,
  subjects,
  groups,
  schoolCycles,
  classrooms,
  teachers,
  closeDialog,
}: StepOneProps) {
  const handleNext = async () => {
    const isValid = await form.trigger([
      "name",
      "schoolCycleId",
      "subjectId",
      "classroomId",
      "teacherId",
      "groupId",
    ]);
    if (isValid) setFormStep(2);
  };
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-center">
        Paso 1: Información de la Clase
      </h3>
      <ClassCatalogForm
        form={form}
        operation="create"
        subjects={subjects}
        groups={groups}
        schoolCycles={schoolCycles}
        classrooms={classrooms}
        teachers={teachers}
      />
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={closeDialog}>
          Cancelar
        </Button>
        <Button type="button" onClick={handleNext}>
          Siguiente: Asignar Horario →
        </Button>
      </div>
    </div>
  );
}

// Componente para el Paso 2 del formulario de creación
function StepTwoContent({
  form,
  setFormStep,
  schedules,
  getDayName,
  formatTime,
  conflictScheduleIds,
}: StepTwoProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-center">
        Paso 2: Horarios Disponibles (Opcional)
      </h3>
      <FormField
        control={form.control}
        name="selectedScheduleIds"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Seleccionar Horarios</FormLabel>
            <FormControl>
              <div className="grid gap-2 max-h-60 overflow-y-auto border rounded-md p-4">
                {schedules?.map((schedule) => {
                  const isConflict = conflictScheduleIds.includes(schedule._id);
                  return (
                    <div
                      key={schedule._id}
                      className="flex items-center space-x-3"
                    >
                      <Checkbox
                        id={schedule._id}
                        checked={field.value?.includes(schedule._id)}
                        disabled={isConflict}
                        onCheckedChange={(checked) => {
                          const currentIds = field.value || [];
                          return checked
                            ? field.onChange([...currentIds, schedule._id])
                            : field.onChange(
                                currentIds.filter((id) => id !== schedule._id)
                              );
                        }}
                      />
                      <label
                        htmlFor={schedule._id}
                        className={`text-sm font-medium leading-none flex-1 cursor-pointer ${
                          isConflict
                            ? "text-muted-foreground opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {getDayName(schedule.day)}
                          </span>
                          <span className="text-muted-foreground">
                            {formatTime(schedule.startTime)} -{" "}
                            {formatTime(schedule.endTime)}
                          </span>
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={() => setFormStep(1)}>
          ← Volver
        </Button>
        <Button type="submit">Guardar Clase</Button>
      </div>
    </div>
  );
}

export default function HorariosPorClasePage() {
  const { user: clerkUser, isLoaded } = useUser();
  const { currentUser, isLoading: userLoading } = useUserWithConvex(
    clerkUser?.id
  );
  const { currentSchool, isLoading: schoolLoading } = useCurrentSchool(
    currentUser?._id
  );

  const [formStep, setFormStep] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { filter, searchTerm, setFilter, setSearchTerm, setClasses } =
    useClassScheduleStore();

  const { subjects } = useSubject(currentSchool?.school._id);
  const { groups } = useGroup(currentSchool?.school._id);

  const {
    getStudentFilters,
    canCreateScheduleAssignament,
    canUpdateScheduleAssignament,
    canDeleteScheduleAssignament,
    currentRole,
    isLoading: permissionsLoading,
  } = usePermissions(currentSchool?.school._id);

  const classFilters = useMemo(() => {
    return getStudentFilters?.() || { canViewAll: false };
  }, [getStudentFilters]);

  // Data Fetching
  const classesRaw = useQuery(
    api.functions.classSchedule.getClassScheduleWithRoleFilter,
    currentSchool && classFilters
      ? {
          schoolId: currentSchool?.school._id as Id<"school">,
          canViewAll: classFilters.canViewAll,
          tutorId: classFilters.tutorId,
          teacherId: classFilters.teacherId,
        }
      : "skip"
  );

  const activeCycle = useQuery(
    api.functions.schoolCycles.ObtenerCicloActivo,
    currentSchool?.school._id ? { escuelaID: currentSchool.school._id } : "skip"
  );

  const allClassCatalogs = useQuery(
    api.functions.classCatalog.getAllClassCatalog,
    currentSchool && classFilters
      ? {
          schoolId: currentSchool?.school._id as Id<"school">,
          canViewAll: classFilters.canViewAll,
          tutorId: classFilters.tutorId,
          teacherId: classFilters.teacherId,
        }
      : "skip"
  );

  const classCatalogs = allClassCatalogs?.filter(
    (classCatalog) => classCatalog.schoolCycleId === activeCycle?._id
  );

  const schedules = useQuery(
    api.functions.schedule.getSchedulesBySchools,
    currentSchool?.school._id ? { schoolId: currentSchool.school._id } : "skip"
  );

  const schoolCycles = useQuery(
    api.functions.schoolCycles.ObtenerCiclosEscolares,
    currentSchool?.school._id
      ? { escuelaID: currentSchool?.school._id }
      : "skip"
  );

  const teachers = useQuery(
    api.functions.userSchool.getByRole,
    currentSchool?.school._id
      ? { schoolId: currentSchool?.school._id, role: "teacher" }
      : "skip"
  );

  const teacherUserIds = teachers?.map((relation) => relation._id) || [];
  const teachersData = useQuery(
    api.functions.users.getUsersByIds,
    teacherUserIds.length > 0
      ? { userIds: teacherUserIds, status: "active" }
      : "skip"
  );

  const classrooms = useQuery(
    api.functions.classroom.viewAllClassrooms,
    currentSchool?.school._id ? { schoolId: currentSchool?.school._id } : "skip"
  );

  // Loading state consolidado
  const isLoading =
    !isLoaded ||
    userLoading ||
    schoolLoading ||
    permissionsLoading ||
    classesRaw === undefined;

  // Store management
  const classItems = classesRaw as ClassItem[] | undefined;
  const filteredClasses = useFilteredClasses(classItems);

  useEffect(() => {
    if (classItems) {
      const filtered = classItems.filter(
        (c): c is NonNullable<typeof c> => c !== null
      );
      setClasses(filtered);
    }
  }, [classItems, setClasses]);

  // Mutations and Actions
  const createClassWithSchedule = useAction(
    api.actions.actionsclassSchedule.createClassWithSchedule
  );
  const updateClassAndSchedules = useMutation(
    api.functions.classSchedule.updateClassAndSchedules
  );
  const deleteClassAndSchedulesAction = useAction(
    api.actions.actionsclassSchedule.deleteClassAndSchedules
  );
  const validateConflictsMutation = useMutation(
    api.functions.classSchedule.validateScheduleConflicts
  );

  // Forms and Dialogs
  const crudDialog = useCrudDialog(EditClassFormSchema, {
    classCatalogId: "",
    selectedScheduleIds: [],
    status: "active",
  });

  const createForm = useForm<z.infer<typeof FullClassSchema>>({
    resolver: zodResolver(FullClassSchema),
    defaultValues: {
      name: "",
      status: "active",
      selectedScheduleIds: [],
      schoolCycleId: "",
      subjectId: "",
      classroomId: "",
      teacherId: "",
      groupId: "",
    },
  });

  const watchedTeacherId = createForm.watch("teacherId");
  const watchedClassroomId = createForm.watch("classroomId");

  const conflictScheduleIds = useQuery(
    api.functions.schedule.getScheduleConflicts,
    currentSchool?.school._id && watchedTeacherId && watchedClassroomId
      ? {
          schoolId: currentSchool.school._id,
          teacherId: watchedTeacherId as Id<"user">,
          classroomId: watchedClassroomId as Id<"classroom">,
        }
      : "skip"
  );

  // Helper Functions
  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDayName = (day: string) => {
    const dayMap: Record<string, string> = {
      "lun.": "Lunes",
      "mar.": "Martes",
      "mié.": "Miércoles",
      "jue.": "Jueves",
      "vie.": "Viernes",
    };
    return dayMap[day] || day;
  };

  // Handlers
  const handleCreateSubmit = async (data: Record<string, unknown>) => {
    const values = FullClassSchema.parse(data);
    if (
      !values.selectedScheduleIds ||
      values.selectedScheduleIds.length === 0
    ) {
      toast.info("Clase creada sin horarios", {
        description: "Podrás asignarle horarios más tarde editando la clase.",
      });
    }
    try {
      if (!currentSchool?.school._id || !currentUser?._id)
        throw new Error(
          "La información de la escuela o del usuario no está disponible."
        );

      await toast.promise(
        createClassWithSchedule({
          classData: {
            name: values.name,
            schoolCycleId: values.schoolCycleId as Id<"schoolCycle">,
            subjectId: values.subjectId as Id<"subject">,
            classroomId: values.classroomId as Id<"classroom">,
            teacherId: values.teacherId as Id<"user">,
            groupId: values.groupId as Id<"group">,
            status: values.status,
            schoolId: currentSchool.school._id,
            createdBy: currentUser._id,
          },
          selectedScheduleIds: (values.selectedScheduleIds ||
            []) as Id<"schedule">[],
        }),
        {
          loading: "Guardando clase...",
          success: "¡Clase creada exitosamente!",
          error: (err) => err.message || "No se pudo completar la operación.",
        }
      );
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Error al crear la clase:", error);
    }
  };

  const handleEdit = async (data: Record<string, unknown>) => {
    try {
      const formData = EditClassFormSchema.parse(data);

      if (formData.selectedScheduleIds.length === 0) {
        throw new Error("Debe seleccionar al menos un horario");
      }
      const originalClass = crudDialog.data as ClassItem | null;
      if (!originalClass) {
        throw new Error(
          "No se pudo obtener la información de la clase original"
        );
      }

      const finalScheduleIds = formData.selectedScheduleIds as Id<"schedule">[];
      if (formData.status === "active") {
        const validation = await validateConflictsMutation({
          classCatalogId: formData.classCatalogId as Id<"classCatalog">,
          selectedScheduleIds: finalScheduleIds,
          isEdit: true,
          originalClassCatalogId:
            originalClass.classCatalogId as Id<"classCatalog">,
        });
        if (validation.hasConflicts) {
          // Formateamos el mensaje de error para el toast
          const conflictMessages = validation.conflicts
            .map((c: { message: string }) => c.message)
            .join(", ");

          toast.error("Conflictos de Horario Detectados", {
            description: conflictMessages,
          });

          // Detenemos la ejecución para que no intente guardar
          return;
        }
      }

      await updateClassAndSchedules({
        oldClassCatalogId: originalClass.classCatalogId as Id<"classCatalog">,
        newClassCatalogId: formData.classCatalogId as Id<"classCatalog">,
        selectedScheduleIds: finalScheduleIds,
        status: formData.status,
      });

      toast.success("Asignación actualizada exitosamente");
    } catch (error) {
      console.error("Error al editar horario:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Ocurrió un problema al actualizar el horario";
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await toast.promise(
        deleteClassAndSchedulesAction({
          classCatalogId: id as Id<"classCatalog">,
        }),
        {
          loading: "Eliminando clase y horarios asociados...",
          success: "Clase y horarios eliminados exitosamente.",
          error: "No se pudo completar la eliminación.",
        }
      );
    } catch (error) {
      console.error("Error al eliminar la clase y sus horarios:", error);
    }
  };

  const stats = [
    {
      title: "Total de clases",
      value: classItems?.length.toString() || "0",
      icon: ClockPlus,
      trend: "Clases registradas en total",
    },
    {
      title: "Clases activas",
      value: (
        classItems?.filter((c) => c?.status === "active") ?? []
      ).length.toString(),
      icon: Book,
      trend: "Clases actualmente activas",
    },
    {
      title: "Clases inactivas",
      value: (
        classItems?.filter((c) => c?.status === "inactive") ?? []
      ).length.toString(),
      icon: ClockPlus,
      trend: "Clases actualmente inactivas",
    },
    {
      title: "Horarios activos",
      value: (
        schedules?.filter((s) => s?.status === "active") ?? []
      ).length.toString(),
      icon: Clock,
      trend: "Horarios disponibles para asignar",
    },
  ];

  return (
    <div className="space-y-8 p-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
        <div className="relative p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <ClockPlus className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">
                Clases y Horarios
              </h1>
              <p className="text-lg text-muted-foreground">
                Administra las clases y sus asignaciones de horarios.
              </p>
            </div>
          </div>
          {canCreateScheduleAssignament && (
            <Button
              size="lg"
              className="gap-2"
              onClick={() => {
                setFormStep(1);
                createForm.reset();
                setIsCreateDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Agregar Clase
            </Button>
          )}
        </div>
      </div>

      {(currentRole === "superadmin" ||
        currentRole === "admin" ||
        currentRole === "auditor") && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="relative overflow-hidden group hover:shadow-lg transition-all duration-300"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.trend}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros y Búsqueda
              </CardTitle>
              <CardDescription>
                Encuentra las clases y filtra por estado
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por clase, materia, profesor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {(currentRole === "superadmin" ||
              currentRole === "admin" ||
              currentRole === "auditor") && (
              <div className="flex gap-2">
                <Select
                  onValueChange={(v) =>
                    setFilter(v as "all" | "active" | "inactive")
                  }
                  value={filter || "all"}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filtrar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="inactive">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Clases con Horario</span>
            <Badge variant="outline">{filteredClasses.length} clases</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando clases...</p>
              </div>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="text-center py-12">
              <ClockPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                No se encontraron clases
              </h3>
              <p className="text-muted-foreground mb-4">
                {currentRole === "tutor"
                  ? "En caso de alguna inconsistencia con la información, comunícate con soporte."
                  : "Intenta ajustar los filtros o agrega una nueva clase con horario."}
              </p>
              {canCreateScheduleAssignament && (
                <Button
                  size="lg"
                  className="gap-2"
                  onClick={() => {
                    setFormStep(1);
                    createForm.reset();
                    setIsCreateDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Agregar Clase
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-9">
              {filteredClasses.map((classItem) => (
                <Card
                  key={classItem._id}
                  className="w-full max-w-md hover:shadow-lg transition-shadow duration-200 flex flex-col h-full"
                >
                  <CardHeader className="flex items-center gap-2 justify-between">
                    <CardTitle className="text-lg font-semibold leading-tight line-clamp-2 break-words flex-1 min-w-0">
                      {classItem.name}
                    </CardTitle>
                    <Badge
                      variant={
                        classItem?.status === "active" ? "default" : "secondary"
                      }
                      className={
                        classItem?.status === "active"
                          ? "bg-green-600 text-white flex-shrink-0 ml-2"
                          : "flex-shrink-0 ml-2 bg-gray-600/70 text-white"
                      }
                    >
                      {classItem?.status === "active" ? "Activa" : "Inactiva"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {classItem.subject && (
                      <div className="flex items-center gap-2">
                        <span className="w-5 flex justify-center">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {classItem.subject.name}
                          </p>
                          {classItem.subject.credits && (
                            <p className="text-xs text-muted-foreground">
                              {classItem.subject.credits}{" "}
                              {classItem.subject.credits === 1
                                ? "Crédito"
                                : "Créditos"}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {classItem.classroom && (
                      <div className="flex items-center gap-2">
                        <span className="w-5 flex justify-center">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {classItem.classroom.name}
                          </p>
                          {classItem.classroom.location && (
                            <p className="text-xs text-muted-foreground truncate">
                              {classItem.classroom.location}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Capacidad: {classItem.classroom.capacity}{" "}
                            estudiantes
                          </p>
                        </div>
                      </div>
                    )}
                    {classItem.teacher && (
                      <div className="flex items-center gap-2">
                        <span className="w-5 flex justify-center">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {classItem.teacher.name}{" "}
                            {classItem.teacher.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {classItem.teacher.email}
                          </p>
                        </div>
                      </div>
                    )}
                    {classItem.group && (
                      <div className="flex items-center gap-2">
                        <span className="w-5 flex justify-center">
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {classItem.group.grade} {classItem.group.name}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="w-5 flex justify-center">
                          <Clock className="h-4 w-4" />
                        </span>
                        <span>
                          {classItem.schedules.length} horario
                          {classItem.schedules.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 pt-2 border-t mt-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => crudDialog.openView(classItem)}
                      className="hover:scale-105 transition-transform cursor-pointer"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canUpdateScheduleAssignament && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => crudDialog.openEdit(classItem)}
                        className="hover:scale-105 transition-transform cursor-pointer"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {canDeleteScheduleAssignament && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => crudDialog.openDelete(classItem)}
                        className="hover:scale-105 transition-transform cursor-pointer text-destructive hover:text-destructive bg-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogo para Editar/Ver/Eliminar */}
      <CrudDialog
        operation={crudDialog.operation}
        title={
          crudDialog.operation === "edit"
            ? "Editar Asignación de Horario"
            : "Ver Asignación de Horario"
        }
        schema={EditClassFormSchema}
        defaultValues={
          crudDialog.operation === "edit" && crudDialog.data
            ? {
                _id: (crudDialog.data as ClassItem)._id,
                classCatalogId: (crudDialog.data as ClassItem).classCatalogId,
                selectedScheduleIds: (crudDialog.data as ClassItem)
                  .selectedScheduleIds,
                status: (crudDialog.data as ClassItem).status,
              }
            : crudDialog.defaultValues
        }
        data={crudDialog.data}
        isOpen={crudDialog.isOpen}
        onOpenChange={crudDialog.close}
        onSubmit={handleEdit}
        onDelete={handleDelete}
        submitButtonText={
          crudDialog.operation === "edit" ? "Guardar Cambios" : undefined
        }
      >
        {(form, operation) => (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="classCatalogId"
                render={() => (
                  <FormItem>
                    <FormLabel>Clase</FormLabel>
                    <div className="flex h-10 w-full items-center justify-between rounded-md  px-3 py-2 text-sm  ring-offset-background">
                      {(crudDialog.data as ClassItem)?.name || "Cargando..."}
                    </div>
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

            {(form.watch("classCatalogId") as string) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Información de la Clase
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {
                    (() => {
                      const selectedClassCatalog = classCatalogs?.find(
                        (cc) => cc._id === form.watch("classCatalogId")
                      );

                      if (!selectedClassCatalog) return null;

                      return (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">
                              Materia:
                            </span>
                            <p className="text-sm">
                              {selectedClassCatalog.subject?.name || "N/A"}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">
                              Aula:
                            </span>
                            <p className="text-sm">
                              {selectedClassCatalog.classroom?.name || "N/A"}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">
                              Profesor:
                            </span>
                            <p className="text-sm">
                              {selectedClassCatalog.teacher?.name || "N/A"}{" "}
                              {selectedClassCatalog.teacher?.lastName || ""}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">
                              Grupo:
                            </span>
                            <p className="text-sm">
                              {selectedClassCatalog.group?.name || "N/A"}
                            </p>
                          </div>
                        </div>
                      );
                    })() as React.ReactNode
                  }
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  {operation === "view"
                    ? "Horarios Asignados"
                    : "Horarios Disponibles"}
                </h3>
                {operation !== "view" && (
                  <span className="text-sm text-muted-foreground">
                    {Array.isArray(form.watch("selectedScheduleIds"))
                      ? (form.watch("selectedScheduleIds") as string[]).length
                      : 0}{" "}
                    seleccionados
                  </span>
                )}
              </div>
              {operation === "view" ? (
                <div className="space-y-2">
                  {(() => {
                    const selectedSchedules =
                      schedules?.filter((schedule) =>
                        (
                          form.watch("selectedScheduleIds") as string[]
                        )?.includes(schedule._id)
                      ) || [];
                    const schedulesByDay = selectedSchedules.reduce(
                      (acc, schedule) => {
                        const day = schedule.day;
                        if (!acc[day]) {
                          acc[day] = [];
                        }
                        acc[day].push(schedule);
                        return acc;
                      },
                      {} as Record<string, Schedule[]>
                    );
                    const sortedDays = [
                      "lun.",
                      "mar.",
                      "mié.",
                      "jue.",
                      "vie.",
                    ].filter((day) => schedulesByDay[day]);
                    if (sortedDays.length === 0) {
                      return (
                        <div className="text-center py-8 text-muted-foreground">
                          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No hay horarios asignados</p>
                        </div>
                      );
                    }
                    return (
                      <Accordion type="multiple" className="w-full">
                        {sortedDays.map((day) => (
                          <AccordionItem key={day} value={day}>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {getDayName(day)}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {schedulesByDay[day]?.length || 0} horario
                                  {(schedulesByDay[day]?.length || 0) !== 1
                                    ? "s"
                                    : ""}
                                </Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 pt-2">
                                {schedulesByDay[day]?.map((schedule) => (
                                  <div
                                    key={schedule._id}
                                    className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                                  >
                                    <div className="flex items-center gap-3">
                                      <Clock className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium">
                                        {formatTime(schedule.startTime)} -{" "}
                                        {formatTime(schedule.endTime)}
                                      </span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {schedule.name}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    );
                  })()}
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="selectedScheduleIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seleccionar Horarios</FormLabel>
                      <FormControl>
                        <div className="grid gap-2 max-h-60 overflow-y-auto border rounded-md p-4">
                          {schedules?.map((schedule: Schedule) => (
                            <div
                              key={schedule._id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`edit-${schedule._id}`}
                                checked={
                                  Array.isArray(field.value)
                                    ? (field.value as string[]).includes(
                                        schedule._id
                                      )
                                    : false
                                }
                                onCheckedChange={(checked) => {
                                  const currentIds = Array.isArray(field.value)
                                    ? (field.value as string[])
                                    : [];
                                  if (checked) {
                                    field.onChange([
                                      ...currentIds,
                                      schedule._id,
                                    ]);
                                  } else {
                                    field.onChange(
                                      currentIds.filter(
                                        (id: string) => id !== schedule._id
                                      )
                                    );
                                  }
                                }}
                                disabled={
                                  operation !== "create" && operation !== "edit"
                                }
                              />
                              <label
                                htmlFor={`edit-${schedule._id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">
                                    {getDayName(schedule.day)}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {formatTime(schedule.startTime)} -{" "}
                                    {formatTime(schedule.endTime)}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {schedule.name}
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>
        )}
      </CrudDialog>

      {/* Dialogo para Creación (multi-paso) */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Crear Nueva Clase</DialogTitle>
            <DialogDescription>
              Completa la información de la clase y asigna horarios.
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit(
                handleCreateSubmit,
                (errors) => {
                  console.error("Validation errors:", errors);
                  toast.error("Por favor, revisa el formulario", {
                    description:
                      "Algunos campos tienen errores o están incompletos.",
                  });
                }
              )}
            >
              {formStep === 1 && (
                <StepOneContent
                  form={createForm}
                  setFormStep={setFormStep}
                  subjects={subjects}
                  groups={groups}
                  teachers={teachersData}
                  classrooms={classrooms}
                  schoolCycles={schoolCycles}
                  closeDialog={() => setIsCreateDialogOpen(false)}
                />
              )}
              {formStep === 2 && (
                <StepTwoContent
                  form={createForm}
                  setFormStep={setFormStep}
                  schedules={schedules}
                  getDayName={getDayName}
                  formatTime={formatTime}
                  conflictScheduleIds={conflictScheduleIds || []}
                />
              )}
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
