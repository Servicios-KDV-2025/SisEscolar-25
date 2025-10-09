"use client";

import React, { useEffect, useState } from "react";
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
import { Subject as SubjectType } from "stores/subjectStore";
import { Group as GroupType } from "stores/groupStore";
import {
  ClassroomType,
  SchoolCycleType,
  TeacherType,
} from "@/types/temporalSchema";

// type CrudDialogType = ReturnType<typeof useCrudDialog>;
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
  occupiedScheduleIds: string[];
  conflictScheduleIds: string[];
}

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

function StepTwoContent({
  form,
  setFormStep,
  schedules,
  getDayName,
  formatTime,
  occupiedScheduleIds,
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
                  const isOccupied = occupiedScheduleIds.includes(schedule._id);
                  const isConflict = conflictScheduleIds.includes(schedule._id);
                  const isDisabled = isOccupied || isConflict;
                  return (
                    <div
                      key={schedule._id}
                      className="flex items-center space-x-3"
                    >
                      <Checkbox
                        id={schedule._id}
                        checked={field.value?.includes(schedule._id)}
                        disabled={isDisabled}
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
                          isDisabled
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
  const { user: clerkUser } = useUser();
  const { currentUser } = useUserWithConvex(clerkUser?.id);
  const [formStep, setFormStep] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false); // Estado para el diálogo de creación
  const { currentSchool } = useCurrentSchool(currentUser?._id);
  const { subjects } = useSubject(currentSchool?.school._id);
  const { groups } = useGroup(currentSchool?.school._id);

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

  const { filter, searchTerm, setFilter, setSearchTerm, setClasses } =
    useClassScheduleStore();
  const filteredClasses = useFilteredClasses();
  const activeCycle = useQuery(
    api.functions.schoolCycles.ObtenerCicloActivo,
    currentSchool?.school._id ? { escuelaID: currentSchool.school._id } : "skip"
  );
  const allClassCatalogs = useQuery(
    api.functions.classCatalog.getAllClassCatalog,
    currentSchool?.school._id ? { schoolId: currentSchool.school._id } : "skip"
  );
  const classCatalogs = allClassCatalogs?.filter(
    (classCatalog) => classCatalog.schoolCycleId === activeCycle?._id
  );
  const schedules = useQuery(
    api.functions.schedule.getSchedulesBySchools,
    currentSchool?.school._id ? { schoolId: currentSchool.school._id } : "skip"
  );
  const classes = useQuery(
    api.functions.classSchedule.getClassSchedules,
    currentSchool?.school._id ? { schoolId: currentSchool.school._id } : "skip"
  );

  const createClassWithSchedule = useAction(
    api.actions.actionsclassSchedule.createClassWithSchedule
  );
  const updateClassAndSchedules = useMutation(
    api.functions.classSchedule.updateClassAndSchedules
  );
  // const deleteClassSchedule = useMutation(
  //   api.functions.classSchedule.deleteClassSchedule
  // );
  const deleteClassAndSchedulesAction = useAction(
    api.actions.actionsclassSchedule.deleteClassAndSchedules
  );

  const validateConflictsMutation = useMutation(
    api.functions.classSchedule.validateScheduleConflicts
  );

  const crudDialog = useCrudDialog(EditClassFormSchema);
  const watchedTeacherId = createForm.watch("teacherId");
  const watchedClassroomId = createForm.watch("classroomId");

  const occupiedScheduleIds = useQuery(
    api.functions.schedule.getOccupiedScheduleIds,
    currentSchool?.school._id ? { schoolId: currentSchool.school._id } : "skip"
  );
  // const classBeingEdited = crudDialog.data as ClassItem | null; // Obtenemos la clase que se está editando

  // const conflictScheduleIdsEdit = useQuery(
  //   api.functions.schedule.getScheduleConflictsForEdit, 
  //   classBeingEdited &&
  //     currentSchool?.school._id &&
  //     classBeingEdited.teacher &&
  //     classBeingEdited.classroom
  //     ? {
  //         schoolId: currentSchool.school._id,
  //         teacherId: classBeingEdited.teacher._id as Id<"user">,
  //         classroomId: classBeingEdited.classroom._id as Id<"classroom">,
  //         classCatalogIdToExclude:
  //           classBeingEdited.classCatalogId as Id<"classCatalog">,
  //       }
  //     : "skip"
  // );
  const conflictScheduleIds = useQuery(
    api.functions.schedule.getScheduleConflicts, // Ajusta la ruta si es necesario
    // Solo ejecuta la consulta si tenemos los tres IDs necesarios
    currentSchool?.school._id && watchedTeacherId && watchedClassroomId
      ? {
          schoolId: currentSchool.school._id,
          teacherId: watchedTeacherId as Id<"user">,
          classroomId: watchedClassroomId as Id<"classroom">,
        }
      : "skip" // Si no, no hagas nada
  );

  useEffect(() => {
    if (classes) {
      const classItems = classes.filter(
        (c): c is NonNullable<typeof c> => c !== null
      ) as unknown as ClassItem[];
      setClasses(classItems);
    }
  }, [classes, setClasses]);

  const formatTime = (time: string) =>
    new Date(`2000-01-01T${time}`).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  const getDayName = (day: string) =>
    ({
      "lun.": "Lunes",
      "mar.": "Martes",
      "mié.": "Miércoles",
      "jue.": "Jueves",
      "vie.": "Viernes",
    })[day] || day;

  const handleCreateSubmit = async (data: Record<string, unknown>) => {
    // La lógica de estado de carga se puede añadir aquí si se desea
    const values = FullClassSchema.parse(data);
    if (
      !values.selectedScheduleIds ||
      values.selectedScheduleIds.length === 0
    ) {
      toast.error("Selección requerida", {
        description:
          "Debes seleccionar al menos un horario para guardar la clase.",
      });
      return; // Detenemos la ejecución aquí
    }
    try {
      if (!currentSchool?.school._id || !currentUser?._id)
        throw new Error(
          "La información de la escuela o del usuario no está disponible."
        );
      toast.info("Guardando clase...");
      await createClassWithSchedule({
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
      });
      toast.success("¡Clase creada exitosamente!");
      setIsCreateDialogOpen(false); // Cierra el diálogo de creación
    } catch (error) {
      console.error("Error al crear la clase:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo completar la operación."
      );
    }
  };

  const handleEdit = async (data: Record<string, unknown>) => {
    const formData = EditClassFormSchema.parse(data);
    try {
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
        // if (validation.hasConflicts) {
        //   throw new Error(
        //     `Conflictos detectados: ${validation.conflicts.map((c: { message: string }) => c.message).join(", ")}`
        //   );
        // }
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

  // const handleDelete = async (id: string) => {
  //   await deleteClassSchedule({ classCatalogId: id as Id<"classCatalog"> });
  //   toast.success("Asignación eliminada exitosamente");
  // };

  const handleDelete = async (id: string) => {
    try {
      toast.info("Eliminando clase y horarios asociados...");

      await deleteClassAndSchedulesAction({
        classCatalogId: id as Id<"classCatalog">,
      });

      toast.success("Clase y horarios eliminados exitosamente");
    } catch (error) {
      console.error("Error al eliminar la clase y sus horarios:", error);
      toast.error("No se pudo completar la eliminación.");
    }
  };

  const stats = [
    {
      title: "Total de asignaciones activas",
      value: classes?.length.toString() || "0",
      icon: ClockPlus,
      trend: "Asignaciones registradas",
    },
    {
      title: "Total de asignaciones inactivas",
      value: (
        classes?.filter((cls) => cls?.status === "inactive") ?? []
      ).length.toString(),
      icon: ClockPlus,
      trend: "Asignaciones registradas",
    },
    {
      title: "Total de clases activas",
      value: (
        classCatalogs?.filter((cls) => cls?.status === "active") ?? []
      ).length.toString(),
      icon: Book,
      trend: "Clases registradas",
    },
    {
      title: "Total de horarios activos",
      value: (
        schedules?.filter((s) => s?.status === "active") ?? []
      ).length.toString(),
      icon: Clock,
      trend: "Horarios registrados",
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
        </div>
      </div>

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

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" /> Filtros y Búsqueda
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
                  placeholder="Buscar por clase..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select
                onValueChange={(value) =>
                  setFilter(value as "all" | "active" | "inactive")
                }
                // El 'value' se mantiene igual, con 'all' como fallback
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Clases con Horario</span>
            <Badge variant="outline">
              {filteredClasses.length} asignaciones
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredClasses.length === 0 ? (
            <div className="text-center py-12">
              <ClockPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                No se encontraron asignaciones
              </h3>
              <p className="text-muted-foreground mb-4">
                Intenta ajustar los filtros o agrega una nueva clase con
                horario.
              </p>
              <Button
                size="lg"
                className="gap-2"
                onClick={() => {
                  setFormStep(1);
                  createForm.reset();
                  crudDialog.openCreate();
                }}
              >
                <Plus className="h-4 w-4" />
                Agregar Clase
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-9">
              {filteredClasses.map((classItem, index) => (
                <Card
                  key={`${classItem._id}-${classItem.classCatalogId}-${index}`}
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
                    {/* Materia */}
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

                    {/* Aula */}
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

                    {/* Profesor */}
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

                    {/* Grupo */}
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

                    {/* Horarios */}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        crudDialog.openView(classItem);
                      }}
                      className="hover:scale-105 transition-transform cursor-pointer"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        crudDialog.openEdit(classItem);
                      }}
                      className="hover:scale-105 transition-transform cursor-pointer"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        crudDialog.openDelete(classItem);
                      }}
                      className="hover:scale-105 transition-transform cursor-pointer text-destructive hover:text-destructive bg-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para Editar/Ver/Eliminar (simple) */}
      <CrudDialog
        operation={crudDialog.operation}
        title="Editar Asignación"
        schema={EditClassFormSchema}
        data={crudDialog.data}
        isOpen={crudDialog.isOpen}
        onOpenChange={crudDialog.close}
        onSubmit={handleEdit}
        onDelete={handleDelete}
        deleteButtonText="Eliminar Asignación"
        description="Edita la asignación de horarios para esta clase."
      >
        {(formFromDialog, operation) => (
          <Form {...formFromDialog}>
            {/* <form onSubmit={formFromDialog.handleSubmit(handleEdit)}> */}
            <div className="space-y-6">
              <FormField
                control={formFromDialog.control}
                name="classCatalogId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clase</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value as string}
                      disabled={operation === "view"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione una clase" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classCatalogs?.map((cc) => (
                          <SelectItem key={cc._id} value={cc._id}>
                            {cc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={formFromDialog.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={formFromDialog.control}
                name="selectedScheduleIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horarios Asignados</FormLabel>
                    <FormControl>
                      <div className="grid gap-2 max-h-60 overflow-y-auto border rounded-md p-4">
                        {schedules?.map((schedule) => {
                          // const isOccupied = (
                          //   occupiedScheduleIds || []
                          // ).includes(schedule._id);
                          // const isConflict = (
                          //   conflictScheduleIdsEdit || []
                          // ).includes(schedule._id);
                          // const isDisabled = isOccupied || isConflict;
                          return (
                            <div
                              key={schedule._id}
                              className="flex items-center space-x-3"
                            >
                              <Checkbox
                                id={`edit-${schedule._id}`}
                                checked={
                                  Array.isArray(field.value) &&
                                  field.value.includes(schedule._id)
                                }
                                disabled={operation === "view"}
                                onCheckedChange={(checked) => {
                                  const currentIds = Array.isArray(field.value)
                                    ? field.value
                                    : [];

                                  return checked
                                    ? field.onChange([
                                        ...currentIds,
                                        schedule._id,
                                      ])
                                    : field.onChange(
                                        currentIds.filter(
                                          (id) => id !== schedule._id
                                        )
                                      );
                                }}
                              />
                              <label
                                htmlFor={`edit-${schedule._id}`}
                                className={`text-sm font-medium leading-none flex-1 cursor-pointer}`}
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
            </div>
          </Form>
        )}
      </CrudDialog>

      {/* Diálogo para Creación (multi-paso) */}
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
                  console.error(
                    "Errores de validación del formulario:",
                    errors
                  );
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
                  occupiedScheduleIds={occupiedScheduleIds || []}
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
