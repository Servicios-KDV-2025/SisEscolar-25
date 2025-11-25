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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/components/shadcn/tooltip";
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
  Pencil,
  LayoutList,
} from "lucide-react";
import {
  CrudDialog,
  useCrudDialog,
} from "@repo/ui/components/dialog/crud-dialog";
import { toast } from "@repo/ui/sonner";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@repo/ui/components/shadcn/tabs";
import { WeeklySchedule } from "../../../../../components/clase/horario-semanal";

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
  activeSchoolCycleId?: string;
}
interface StepTwoProps {
  form: FullClassForm;
  setFormStep: React.Dispatch<React.SetStateAction<number>>;
  schedules: Schedule[] | undefined;
  getDayName: (day: string) => string;
  formatTime: (time: string) => string;
  conflictScheduleIds: string[];
  existingClass?: { _id: Id<"classCatalog">; name: string; } | null; // permitir null
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
  activeSchoolCycleId,
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
        activeSchoolCycleId={activeSchoolCycleId}
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
  existingClass, // ← NUEVO PROP
}: StepTwoProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-center">
        Paso 2: Horarios Disponibles
      </h3>

      {/* ✅ MENSAJE SI LA CLASE YA EXISTE */}
      {existingClass && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">
                Clase existente detectada
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Esta combinación de materia, profesor, grupo y aula ya existe.
                Los horarios seleccionados se agregarán a la clase existente: <strong>{existingClass.name}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      <FormField
        control={form.control}
        name="selectedScheduleIds"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Seleccionar Horarios *</FormLabel>
            <FormControl>
              <TooltipProvider>
                <div className="grid gap-2 max-h-60 overflow-y-auto border rounded-md p-4">
                  {schedules?.map((schedule) => {
                    const isConflict = conflictScheduleIds.includes(schedule._id);
                    return (
                      <Tooltip key={schedule._id}>
                        <TooltipTrigger asChild>
                          <div className="flex items-center space-x-3">
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
                              className={`text-sm font-medium leading-none flex-1 cursor-pointer ${isConflict
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
                        </TooltipTrigger>
                        {isConflict && (
                          <TooltipContent side="right">
                            <p className="text-xs">
                              ⚠️ Este horario ya está asignado a otra clase con el mismo profesor o aula
                            </p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={() => setFormStep(1)}>
          ← Volver
        </Button>
        <Button type="submit">
          {existingClass ? "Agregar Horarios" : "Guardar Clase"}
        </Button>
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
  
  // Estado para el estudiante seleccionado (solo para tutores)
  const [selectedStudentId, setSelectedStudentId] = useState<Id<"student"> | "all">("all");
  
  const [formStep, setFormStep] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditingClassDetails, setIsEditingClassDetails] = useState(false);
  const {
    filter,
    searchTerm,
    setFilter,
    setSearchTerm,
    setClasses,
    updateClass,
    filterByActiveCycle,
    setFilterByActiveCycle,
    setActiveSchoolCycleId,
  } = useClassScheduleStore();

  const { subjects } = useSubject(currentSchool?.school._id);
  const { groups } = useGroup(currentSchool?.school._id);

  const crudDialog = useCrudDialog(EditClassFormSchema, {
    classCatalogId: "",
    selectedScheduleIds: [],
    status: "active",
  });

  const createForm: FullClassForm = useForm<z.infer<typeof FullClassSchema>>({
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

  const editClassForm: FullClassForm = useForm<z.infer<typeof FullClassSchema>>(
    {
      resolver: zodResolver(FullClassSchema),
      // La clave para solucionar el error de TypeScript fue agregar este bloque:
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
    }
  );

  const editWatchedTeacherId = editClassForm.watch("teacherId");
  const editWatchedClassroomId = editClassForm.watch("classroomId");

  const editConflictScheduleIds = useQuery(
    api.functions.schedule.getScheduleConflicts,
    currentSchool?.school._id &&
      isEditingClassDetails &&
      editWatchedTeacherId &&
      editWatchedClassroomId &&
      (crudDialog.data as ClassItem)?.classCatalogId
      ? {
        schoolId: currentSchool.school._id,
        teacherId: editWatchedTeacherId as Id<"user">,
        classroomId: editWatchedClassroomId as Id<"classroom">,
        classCatalogIdToExclude: (crudDialog.data as ClassItem).classCatalogId as Id<"classCatalog">,

      }
      : "skip"
  );

  const editScheduleConflicts = useQuery(
    api.functions.schedule.getScheduleConflictsForEdit,
    (() => {
      const classItem = crudDialog.data as ClassItem | null;
      return currentSchool?.school._id &&
        crudDialog.operation === "edit" &&
        !isEditingClassDetails &&
        classItem?.teacher?._id &&
        classItem?.classroom?._id &&
        classItem?.classCatalogId
        ? {
          schoolId: currentSchool.school._id,
          teacherId: classItem.teacher._id as Id<"user">,
          classroomId: classItem.classroom._id as Id<"classroom">,
          classCatalogIdToExclude: classItem.classCatalogId as Id<"classCatalog">,
        }
        : "skip";
    })()
  );

  const existingClassOnEdit = useQuery(
    api.functions.classCatalog.checkDuplicateClass,
    (() => {
      const watchedData = editClassForm.watch();
      const currentClassItem = crudDialog.data as ClassItem | null;

      return currentSchool?.school._id &&
        isEditingClassDetails &&
        watchedData.subjectId &&
        watchedData.classroomId &&
        watchedData.teacherId &&
        watchedData.groupId &&
        watchedData.schoolCycleId &&
        currentClassItem?.classCatalogId
        ? {
          schoolId: currentSchool.school._id,
          subjectId: watchedData.subjectId as Id<"subject">,
          classroomId: watchedData.classroomId as Id<"classroom">,
          teacherId: watchedData.teacherId as Id<"user">,
          groupId: watchedData.groupId as Id<"group">,
          schoolCycleId: watchedData.schoolCycleId as Id<"schoolCycle">,
          excludeClassCatalogId: currentClassItem.classCatalogId as Id<"classCatalog">, // Excluir la clase actual
        }
        : "skip";
    })()
  );

  const existingClass = useQuery(
    api.functions.classCatalog.checkDuplicateClass,
    (() => {
      const watchedData = createForm.watch();
      return currentSchool?.school._id &&
        isCreateDialogOpen &&
        watchedData.subjectId &&
        watchedData.classroomId &&
        watchedData.teacherId &&
        watchedData.groupId &&
        watchedData.schoolCycleId
        ? {
          schoolId: currentSchool.school._id,
          subjectId: watchedData.subjectId as Id<"subject">,
          classroomId: watchedData.classroomId as Id<"classroom">,
          teacherId: watchedData.teacherId as Id<"user">,
          groupId: watchedData.groupId as Id<"group">,
          schoolCycleId: watchedData.schoolCycleId as Id<"schoolCycle">,
        }
        : "skip";
    })()
  );

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

  // Obtener estudiantes del tutor
  const tutorStudents = useQuery(
    api.functions.student.getStudentsByTutor,
    currentRole === "tutor" && currentSchool && currentUser
      ? {
          schoolId: currentSchool.school._id as Id<"school">,
          tutorId: currentUser._id as Id<"user">,
        }
      : "skip"
  );

  // Obtener las clases del estudiante seleccionado (solo para tutores)
  const studentClasses = useQuery(
    api.functions.studentsClasses.getStudentClassesByStudentId,
    currentRole === "tutor" && 
    currentSchool && 
    selectedStudentId !== "all" && 
    typeof selectedStudentId === "string"
      ? {
          schoolId: currentSchool.school._id as Id<"school">,
          studentId: selectedStudentId as Id<"student">,
        }
      : "skip"
  );

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

  // --- NUEVO useEffect PARA SINCRONIZAR EL CICLO ACTIVO ---
  useEffect(() => {
    if (activeCycle) {
      setActiveSchoolCycleId(activeCycle._id);
    } else {
      setActiveSchoolCycleId(null);
    }
  }, [activeCycle, setActiveSchoolCycleId]);
  // --- FIN ---

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

  // const teachers = useQuery(
  //   api.functions.userSchool.getByRole,
  //   currentSchool?.school._id
  //     ? { schoolId: currentSchool?.school._id, role: "teacher" }
  //     : "skip"
  // );

  // const teacherUserIds = teachers?.map((relation) => relation._id) || [];
  // const teachersData = useQuery(
  //   api.functions.users.getUsersByIds,
  //   teacherUserIds.length > 0
  //     ? { userIds: teacherUserIds, status: "active" }
  //     : "skip"
  // );
  const teachersData = useQuery(
    api.functions.userSchool.getByRole,
    currentSchool?.school._id
      ? { schoolId: currentSchool?.school._id, role: "teacher" }
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
  const filteredClasses = useFilteredClasses(
    classesRaw as ClassItem[] | undefined
  );

  useEffect(() => {
    if (classesRaw) {
      const filtered = classesRaw.filter(
        (c): c is NonNullable<typeof c> => c !== null
      );
      setClasses(filtered as ClassItem[]);
    }
  }, [classesRaw, setClasses]);
  useEffect(() => {
    const itemToEdit = crudDialog.data as ClassItem | null;

    if (crudDialog.operation === "edit" && itemToEdit) {
      editClassForm.reset({
        name: itemToEdit.name,
        status: itemToEdit.status,
        schoolCycleId: itemToEdit.schoolCycle?._id || itemToEdit.schoolCycleId || activeCycle?._id || "",
        subjectId: itemToEdit.subject?._id ?? "",
        classroomId: itemToEdit.classroom?._id ?? "",
        teacherId: itemToEdit.teacher?._id ?? "",
        groupId: itemToEdit.group?._id ?? "",
        selectedScheduleIds: itemToEdit.selectedScheduleIds ?? [],
      });
      // Reset del estado de edición
      setIsEditingClassDetails(false);
    }
  }, [crudDialog.data, crudDialog.operation, editClassForm, activeCycle]);

  // Mutations and Actions
  const createClassWithSchedule = useAction(
    api.actions.actionsclassSchedule.createClassWithSchedule
  );
  const updateClassAndSchedules = useMutation(
    api.functions.classSchedule.updateClassAndSchedules
  );
  const updateClassCatalog = useMutation(
    api.functions.classCatalog.updateClassCatalog
  );
  const deleteClassAndSchedulesAction = useAction(
    api.actions.actionsclassSchedule.deleteClassAndSchedules
  );
  const validateConflictsMutation = useMutation(
    api.functions.classSchedule.validateScheduleConflicts
  );

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

    // ... (validación de horarios seleccionados, no cambia)
    if (!values.selectedScheduleIds || values.selectedScheduleIds.length === 0) {
      toast.error("Horarios requeridos", {
        description: "Debes asignar al menos un horario a la clase.",
      });
      return;
    }

    try {
      if (!currentSchool?.school._id || !currentUser?._id)
        throw new Error(
          "La información de la escuela o del usuario no está disponible."
        );

      // ✅ INICIO DE LA VALIDACIÓN (TU SUGERENCIA)
      if (existingClass) {
        
        // 1. COMPROBAR SI QUIEREN GUARDARLA COMO INACTIVA
        if (values.status === 'inactive') {
          // 2. MOSTRAR ADVERTENCIA Y DETENER TODO
          toast.error("Acción no permitida", {
            description: "Ya existe una clase con estas características. No puede ser creada o combinada como 'inactiva'. Por favor, establécela como 'activa' para continuar.",
            duration: 5000,
          });
          return; // <-- Detenemos la ejecución
        }
        
        // 3. SI LLEGA AQUÍ, ES 'active' Y PROCEDE A COMBINAR
        console.log("📌 Clase existente encontrada, combinando como 'activa'...");

        // Obtener los horarios actuales de la clase existente
        const existingClassWithSchedules = classesRaw?.find(
          c => c?.classCatalogId === existingClass._id
        );

        const existingScheduleIds = existingClassWithSchedules?.selectedScheduleIds || [];

        // Combinar horarios existentes con los nuevos seleccionados
        const combinedSchedules = [
          ...new Set([
            ...existingScheduleIds,
            ...values.selectedScheduleIds,
          ]),
        ] as Id<"schedule">[];

        await toast.promise(
          updateClassAndSchedules({
            oldClassCatalogId: existingClass._id as Id<"classCatalog">,
            newClassCatalogId: existingClass._id as Id<"classCatalog">,
            selectedScheduleIds: combinedSchedules,
            status: "active" // <-- Usamos 'active'
          }),
          {
            loading: "Asignando horarios a la clase existente...",
            success: "¡Horarios asignados exitosamente a la clase existente!",
            error: (err) => err.message || "No se pudo completar la operación.",
          }
        );

        setIsCreateDialogOpen(false);
        createForm.reset({
          status: "active",
          schoolCycleId: activeCycle?._id || "",
        });
        return;
      }
      // ✅ FIN DE LA VALIDACIÓN

      // Si no existe, crear nueva clase (aquí sí respeta 'active' o 'inactive')
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
          selectedScheduleIds: values.selectedScheduleIds as Id<"schedule">[],
        }),
        {
          loading: "Creando nueva clase...",
          success: "¡Clase creada exitosamente!",
          error: (err) => err.message || "No se pudo completar la operación.",
        }
      );

      setIsCreateDialogOpen(false);
      createForm.reset({
        status: "active",
        schoolCycleId: activeCycle?._id || "",
      });
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
        throw new Error("No se pudo obtener la información de la clase original");
      }

      const finalScheduleIds = formData.selectedScheduleIds as Id<"schedule">[];

      // Verificar si los horarios seleccionados son exactamente los mismos que ya tenía la clase
      const originalScheduleIds = originalClass.selectedScheduleIds || [];
      const sameSchedules =
        finalScheduleIds.length === originalScheduleIds.length &&
        finalScheduleIds.every(id => originalScheduleIds.includes(id));

      // Solo validar conflictos si hay cambios en los horarios
      if (!sameSchedules) {
        // ✅ Validar conflictos independientemente del estado
        const validation = await validateConflictsMutation({
          classCatalogId: formData.classCatalogId as Id<"classCatalog">,
          selectedScheduleIds: finalScheduleIds,
          isEdit: true,
          originalClassCatalogId: originalClass.classCatalogId as Id<"classCatalog">,
        });

        if (validation.hasConflicts) {
          const conflictMessages = validation.conflicts
            .map((c: { message: string }) => c.message)
            .join("\n");

          toast.error("Conflictos de Horario Detectados", {
            description: conflictMessages,
            duration: 5000,
          });
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
      crudDialog.close();
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

  const handleUpdateClassDetails = async (
    data: z.infer<typeof FullClassSchema>
  ) => {
    const originalClass = crudDialog.data as ClassItem | null;

    if (!originalClass || !currentSchool) {
      toast.error("No se pudo obtener la información de la clase");
      return;
    }

    console.log("🔄 Actualizando clase con datos:", data);

    try {
      // ✅ SI EXISTE UNA CLASE DUPLICADA, COMBINARLAS
      if (existingClassOnEdit && existingClassOnEdit._id !== originalClass.classCatalogId) {
        console.log("📌 Clase duplicada encontrada, combinando clases...");

        // Obtener los horarios de ambas clases
        const originalScheduleIds = originalClass.selectedScheduleIds || [];
        const targetClass = classesRaw?.find(
          c => c?.classCatalogId === existingClassOnEdit._id
        );
        const targetScheduleIds = targetClass?.selectedScheduleIds || [];

        // Combinar horarios (sin duplicados)
        const combinedSchedules = [
          ...new Set([
            ...targetScheduleIds,
            ...originalScheduleIds,
          ]),
        ] as Id<"schedule">[];

        await toast.promise(
          (async () => {
            // 1. Actualizar la clase existente con los horarios combinados
            await updateClassAndSchedules({
              oldClassCatalogId: existingClassOnEdit._id as Id<"classCatalog">,
              newClassCatalogId: existingClassOnEdit._id as Id<"classCatalog">,
              selectedScheduleIds: combinedSchedules,
              status: data.status,
            });

            // 2. Eliminar la clase original ya que se fusionó con la existente
            await deleteClassAndSchedulesAction({
              classCatalogId: originalClass.classCatalogId as Id<"classCatalog">,
            });

            return true;
          })(),
          {
            loading: "Combinando clases...",
            success: () => {
              setIsEditingClassDetails(false);
              crudDialog.close();
              return `¡Clases combinadas exitosamente! Los horarios se agregaron a "${existingClassOnEdit.name}".`;
            },
            error: (err) => {
              console.error("❌ Error al combinar:", err);
              return "No se pudo completar la combinación de clases.";
            },
          }
        );

        return; // Salir después de combinar
      }

      // ✅ SI NO HAY DUPLICADO, ACTUALIZAR NORMALMENTE
      await toast.promise(
        updateClassCatalog({
          classCatalogId: originalClass.classCatalogId as Id<"classCatalog">,
          schoolId: currentSchool.school._id as Id<"school">,
          schoolCycleId: data.schoolCycleId as Id<"schoolCycle">,
          subjectId: data.subjectId as Id<"subject">,
          classroomId: data.classroomId as Id<"classroom">,
          teacherId: data.teacherId as Id<"user">,
          groupId: data.groupId as Id<"group">,
          name: data.name,
          status: data.status,
          updatedAt: Date.now(),
        }),
        {
          loading: "Actualizando la información de la clase...",
          success: async () => {
            setIsEditingClassDetails(false);

            const updatedSubject = subjects?.find(s => s._id === data.subjectId);
            const updatedClassroom = classrooms?.find(c => c.id === data.classroomId);
            const updatedTeacher = teachersData?.find(t => t._id === data.teacherId);
            const updatedGroup = groups?.find(g => g._id === data.groupId);
            const updatedSchoolCycle = schoolCycles?.find(sc => sc._id === data.schoolCycleId);

            const updatedClassItem: ClassItem = {
              ...originalClass,
              name: data.name,
              status: data.status,
              schoolCycleId: data.schoolCycleId,
              schoolCycle: updatedSchoolCycle ? {
                _id: updatedSchoolCycle._id,
                name: updatedSchoolCycle.name,
                startDate: updatedSchoolCycle.startDate,
                endDate: updatedSchoolCycle.endDate,
              } : originalClass.schoolCycle,
              subject: updatedSubject ? {
                _id: updatedSubject._id,
                name: updatedSubject.name,
                credits: updatedSubject.credits,
              } : originalClass.subject,
              classroom: updatedClassroom ? {
                _id: updatedClassroom.id as string,
                name: updatedClassroom.name,
                location: updatedClassroom.location,
                capacity: updatedClassroom.capacity,
              } : originalClass.classroom,
              teacher: updatedTeacher ? {
                _id: updatedTeacher._id,
                name: updatedTeacher.name,
                lastName: updatedTeacher.lastName,
                email: updatedTeacher.email,
              } : originalClass.teacher,
              group: updatedGroup ? {
                _id: updatedGroup._id,
                name: updatedGroup.name,
                grade: updatedGroup.grade,
              } : originalClass.group,
            };

            updateClass(originalClass._id, updatedClassItem);
            crudDialog.setData(updatedClassItem);

            const needsScheduleUpdate =
              JSON.stringify(data.selectedScheduleIds?.sort()) !==
              JSON.stringify(originalClass.selectedScheduleIds?.sort());

            if (needsScheduleUpdate && data.selectedScheduleIds) {
              await handleEdit({
                classCatalogId: originalClass.classCatalogId,
                selectedScheduleIds: data.selectedScheduleIds,
                status: data.status,
              });
            }

            return "Clase actualizada exitosamente.";
          },
          error: (error) => {
            console.error("❌ Error al actualizar:", error);
            return "No se pudo actualizar la clase.";
          },
        }
      );
    } catch (error) {
      console.error("❌ Error en handleUpdateClassDetails:", error);
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
      value: (classesRaw?.length ?? 0).toString(),
      icon: ClockPlus,
      trend: "Clases registradas en total",
    },
    {
      title: "Clases activas",
      value: (
        classesRaw?.filter((c) => c?.status === "active") ?? []
      ).length.toString(),
      icon: Book,
      trend: "Clases actualmente activas",
    },
    {
      title: "Clases inactivas",
      value: (
        classesRaw?.filter((c) => c?.status === "inactive") ?? []
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

  // Función para transformar los datos al formato esperado por WeeklySchedule
  const transformClassesForWeeklySchedule = useMemo(() => {
    // Si es tutor y hay un estudiante seleccionado, filtrar por las clases del estudiante
    let classesToTransform = classesRaw;
    
    if (currentRole === "tutor" && selectedStudentId !== "all" && studentClasses) {
      // Obtener los IDs de las clases del estudiante
      const studentClassIds = new Set(
        studentClasses
          .filter((sc): sc is NonNullable<typeof sc> => sc !== null && sc.class?._id !== undefined)
          .map((sc) => sc.class._id)
      );
      
      // Filtrar las clases que están en las inscripciones del estudiante
      classesToTransform = classesRaw?.filter((c) => 
        c && c.classCatalogId && studentClassIds.has(c.classCatalogId)
      );
    }

    if (!classesToTransform) return [];

    const dayMap: Record<string, string> = {
      "lun.": "Lunes",
      "mar.": "Martes",
      "mié.": "Miércoles",
      "jue.": "Jueves",
      "vie.": "Viernes",
    };

    const transformed = classesToTransform
      .filter((c): c is NonNullable<typeof c> => c !== null && c.status === "active")
      .map((classItem) => {
        // Obtener nombre del profesor
        const teacherName = classItem.teacher
          ? `${classItem.teacher.name}${classItem.teacher.lastName ? ` ${classItem.teacher.lastName}` : ""}`.trim()
          : "Sin profesor";

        // Transformar horarios, filtrando nulls
        const transformedSchedules = (classItem.schedules || [])
          .filter((s): s is NonNullable<typeof s> => s !== null)
          .map((schedule) => ({
            day: dayMap[schedule.day] || schedule.day,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
          }));

        return {
          id: classItem.classCatalogId || classItem._id,
          name: classItem.name,
          subject: classItem.subject?.name || "Sin asignatura",
          teacher: teacherName,
          grade: classItem.group?.grade || "",
          group: classItem.group?.name || "",
          classroom: classItem.classroom ? { name: classItem.classroom.name } : null,
          schedules: transformedSchedules,
          status: classItem.status as "active" | "inactive",
        };
      })
      .filter((c) => c.schedules.length > 0);

    

    return transformed;
  }, [classesRaw, currentRole, selectedStudentId, studentClasses]);

  // Si el rol es tutor o teacher, solo mostrar el WeeklySchedule
  const isTutorOrTeacher = currentRole === "tutor" || currentRole === "teacher";

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
          {canCreateScheduleAssignament && currentRole !== "teacher" && (
            <Button
              size="lg"
              className="gap-2"
              onClick={() => {
                setFormStep(1);

                createForm.reset({
                  status: "active",
                  schoolCycleId: activeCycle?._id || "",
                });
                setIsCreateDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Agregar Clase
            </Button>
          )}
        </div>
      </div>

      {isTutorOrTeacher ? (
        <div className="space-y-4">
          {currentRole === "tutor" && tutorStudents && tutorStudents.length > 0 && (
            <Card className="p-4">
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Seleccionar Estudiante</h3>
                  <p className="text-sm text-muted-foreground">
                    Elige el estudiante para ver su horario
                  </p>
                </div>
                <Select
                  value={selectedStudentId === "all" ? "all" : selectedStudentId}
                  onValueChange={(value) => {
                    setSelectedStudentId(value === "all" ? "all" : (value as Id<"student">));
                  }}
                >
                  <SelectTrigger className="w-full text-muted-foreground">
                    <SelectValue placeholder="Selecciona un estudiante" />
                  </SelectTrigger>
                  <SelectContent className="text-muted-foreground">
                    <SelectItem value="all" className="text-muted-foreground">Selecciona un estudiante</SelectItem>
                    {tutorStudents.map((student) => (
                      <SelectItem key={student._id} value={student._id}>
                        {student.name} {student.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Card>
          )}
          {currentRole === "tutor" && selectedStudentId === "all" ? (
            <Card className="p-12">
              <div className="text-center">
                <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No has seleccionado un estudiante
                </h3>
                <p className="text-muted-foreground">
                  Por favor, selecciona un estudiante para ver su horario de clases.
                </p>
              </div>
            </Card>
          ) : (
            <WeeklySchedule 
              classes={transformClassesForWeeklySchedule} 
              studentName={
                currentRole === "tutor" && 
                selectedStudentId !== "all" && 
                tutorStudents
                  ? (() => {
                      const student = tutorStudents.find((s) => s._id === selectedStudentId);
                      return student ? `${student.name} ${student.lastName || ""}`.trim() : undefined;
                    })()
                  : undefined
              }
            />
          )}
        </div>
      ) : (
        <>
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

       <Tabs defaultValue="list" className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 gap-2 md:gap-6 h-auto cursor-pointer">
          <TabsTrigger value="list"
           className="flex items-center justify-center gap-2 p-3 md:p-2 h-auto md:h-10 text-sm md:text-base  cursor-pointer"

          >
          <LayoutList className="h-4 w-4 md:h-4 md:w-4 flex-shrink-0"  />
          Vista de Lista</TabsTrigger>
          <TabsTrigger value="schedules"
          className="flex items-center justify-center gap-2 p-3 md:p-2 h-auto md:h-10 text-sm md:text-base cursor-pointer"

          >
          <Clock className="h-4 w-4 md:h-4 md:w-4 flex-shrink-0"  />
          Vista Horario Semanal</TabsTrigger>
        </TabsList>
        <TabsContent value="list">

          <Card className="mb-6 mt-6">
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
                <div className="flex flex-col md:flex-row gap-4 md:items-center">
                  <Select
                    onValueChange={(v) =>
                      setFilter(v as "all" | "active" | "inactive")
                    }
                    value={filter || "all"}
                  >
                    <SelectTrigger className="w-full md:w-[160px]">
                      <SelectValue placeholder="Filtrar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Activos</SelectItem>
                      <SelectItem value="inactive">Inactivos</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* --- CHECKBOX AÑADIDO --- */}
                  <div className="flex items-center space-x-2 pt-2 md:pt-0">
                    <Checkbox
                      id="filter-active-cycle"
                      checked={filterByActiveCycle}
                      onCheckedChange={(checked) =>
                        setFilterByActiveCycle(checked as boolean)
                      }
                      disabled={!activeCycle}
                    />
                    <label
                      htmlFor="filter-active-cycle"
                      className={`text-sm font-medium leading-none cursor-pointer ${!activeCycle ? "text-muted-foreground opacity-70" : ""
                        }`}
                    >
                      Mostrar solo ciclo activo
                    </label>
                  </div>
                  {/* --- FIN DEL CHECKBOX --- */}
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
                Intenta ajustar los filtros o agrega una nueva clase con horario.
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
                    <CardTitle className="text-lg font-semibold leading-tight text-center md:text-left line-clamp-2 break-words flex-1 min-w-0">
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
        key={(crudDialog.data as ClassItem)?._id || "crud-dialog-new"}
        operation={crudDialog.operation}
        title={
          isEditingClassDetails
            ? "Editar Clase"
            : crudDialog.operation === "edit"
              ? "Editar Asignación de Horario"
              : "Ver Asignación de Horario"
        }
        schema={EditClassFormSchema}
        defaultValues={(() => {
          // ✅ CORRECCIÓN: Construir defaultValues correctamente
          const item = crudDialog.data as ClassItem | null;
          if (!item) {
            return {
              classCatalogId: "",
              selectedScheduleIds: [],
              status: "active",
            };
          }

          // ✅ IMPORTANTE: Retornar los valores correctos
          return {
            _id: item._id,
            classCatalogId: item.classCatalogId,
            selectedScheduleIds: item.selectedScheduleIds || [],
            status: item.status,
          };
        })()}
        data={crudDialog.data}
        isOpen={crudDialog.isOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setIsEditingClassDetails(false);
          }
          crudDialog.close();
        }}
        onSubmit={(data) => {
          if (isEditingClassDetails) {
            return editClassForm.handleSubmit(handleUpdateClassDetails)();
          } else {
            return handleEdit(data);
          }
        }}
        submitButtonText={
          crudDialog.operation === "view"
            ? undefined
            : isEditingClassDetails
              ? (existingClassOnEdit && existingClassOnEdit._id !== (crudDialog.data as ClassItem)?.classCatalogId
                ? "Combinar con clase existente"
                : "Actualizar Clase")
              : "Guardar Cambios"
        }
        onDelete={handleDelete}
      >
        {/*
          *
          * 👇 PRIMERA CORRECCIÓN AQUÍ (Línea 1039 original)
          * Se cambia 'operation' por '_operation' para no usarla.
          *
          */}
        {(form) => {
          // ✅ CORRECCIÓN: Verificar que los datos existan antes de renderizar
          const currentClassItem = crudDialog.data as ClassItem | null;


          if (!currentClassItem && crudDialog.operation !== "create") {
            return (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Cargando datos...</p>
              </div>
            );
          }

          return (
            <div>
              {isEditingClassDetails ? (
                <>
                  <ClassCatalogForm
                    form={editClassForm}
                    operation="edit"
                    subjects={subjects}
                    groups={groups}
                    schoolCycles={schoolCycles}
                    classrooms={classrooms}
                    teachers={teachersData}
                    activeSchoolCycleId={activeCycle?._id}
                    existingClassWarning={existingClassOnEdit} // ← AGREGAR ESTA PROP
                  />

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditingClassDetails(false)}
                    >
                      Volver a Horarios
                    </Button>

                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="classCatalogId"
                      render={() => (
                        <FormItem>
                          <FormLabel>Clase</FormLabel>
                          <div className="flex h-10 w-full items-center justify-between rounded-md px-3 py-2 text-sm ring-offset-background">
                            {currentClassItem?.name || "Cargando..."}
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
                            {crudDialog.operation === "view" ? (
                              <div className="flex h-10 w-full items-center">
                                <Badge
                                  variant={field.value === "active" ? "default" : "secondary"}
                                  className={
                                    field.value === "active"
                                      ? "bg-green-600 text-white flex-shrink-0"
                                      : "bg-gray-600/70 text-white flex-shrink-0"
                                  }
                                >
                                  {field.value === "active" ? "Activa" : "Inactiva"}
                                </Badge>
                              </div>
                            ) : (
                              <Select
                                onValueChange={field.onChange}
                                value={field.value as "active" | "inactive"}

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
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* ✅ CORRECCIÓN: Verificar que currentClassItem exista */}
                  {currentClassItem && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 justify-between">
                          <div>Información de la Clase</div>
                          {crudDialog.operation === "edit" && (
                            <Button
                              variant="outline"
                              onClick={() => setIsEditingClassDetails(true)}
                              className="cursor-pointer"
                            >
                              <Pencil className="h-4 w-4" />
                              Editar Clase
                            </Button>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">
                              Materia:
                            </span>
                            <p className="text-sm">
                              {currentClassItem.subject?.name || "N/A"}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">
                              Aula:
                            </span>
                            <p className="text-sm">
                              {currentClassItem.classroom?.name || "N/A"}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">
                              Profesor:
                            </span>
                            <p className="text-sm">
                              {currentClassItem.teacher?.name || "N/A"}{" "}
                              {currentClassItem.teacher?.lastName || ""}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">
                              Grupo:
                            </span>
                            <p className="text-sm">
                              {currentClassItem.group?.grade || ""}{" "}
                              {currentClassItem.group?.name || "N/A"}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">
                              Ciclo Escolar:
                            </span>
                            <p className="text-sm">
                              {currentClassItem.schoolCycle?.name || "N/A"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">
                        {crudDialog.operation === "view" // <--- Corrección aquí también
                          ? "Horarios Asignados"
                          : "Horarios Disponibles"}
                      </h3>
                      {crudDialog.operation !== "view" && ( // <--- Corrección aquí también
                        <span className="text-sm text-muted-foreground">
                          {Array.isArray(form.watch("selectedScheduleIds"))
                            ? (form.watch("selectedScheduleIds") as string[]).length
                            : 0}{" "}
                          seleccionados
                        </span>
                      )}
                    </div>
                    {crudDialog.operation === "view" || crudDialog.operation === "delete" ? (
                      <div className="space-y-2">
                        {(() => {
                          // ✅ CORRECCIÓN: Usar currentClassItem en lugar de form.watch
                          const selectedScheduleIds = currentClassItem?.selectedScheduleIds || [];
                          const selectedSchedules = schedules?.filter((schedule) =>
                            selectedScheduleIds.includes(schedule._id)
                          ) || [];

                          if (selectedSchedules.length === 0) {
                            return (
                              <div className="text-center py-8 text-muted-foreground">
                                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No hay horarios asignados</p>
                              </div>
                            );
                          }

                          const schedulesByDay = selectedSchedules.reduce(
                            (acc, schedule) => {
                              const day = schedule.day;
                              if (!acc[day]) {
                                acc[day] = [];
                              }
                              acc[day].push(schedule);
                              return acc;
                            },
                            {} as Record<string, typeof selectedSchedules>
                          );

                          const sortedDays = [
                            "lun.",
                            "mar.",
                            "mié.",
                            "jue.",
                            "vie.",
                          ].filter((day) => schedulesByDay[day]);

                          return (
                            <Accordion
                              type="multiple"
                              className="w-full"
                              defaultValue={sortedDays}
                            >
                              {sortedDays.map((day) => (
                                <AccordionItem key={day} value={day}>
                                  <AccordionTrigger className="hover:no-underline">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">
                                        {getDayName(day)}
                                      </span>
                                      <Badge variant="secondary" className="text-xs">
                                        {schedulesByDay[day]?.length} horario
                                        {schedulesByDay[day]?.length !== 1 ? "s" : ""}
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
                      // Sección de edición de horarios (sin cambios)
                      <FormField
                        control={form.control}
                        name="selectedScheduleIds"
                        render={({ field }) => {
                          const activeConflicts = isEditingClassDetails
                            ? (editConflictScheduleIds || [])
                            : (editScheduleConflicts || []);

                          return (
                            <FormItem>
                              <FormLabel>Seleccionar Horarios</FormLabel>
                              <FormControl>
                                <TooltipProvider>
                                  <div className="grid gap-2 max-h-60 overflow-y-auto border rounded-md p-4">
                                    {schedules?.map((schedule) => {
                                      const isConflict = activeConflicts.includes(schedule._id);
                                      const isCurrentlySelected = Array.isArray(field.value)
                                        ? (field.value as string[]).includes(schedule._id)
                                        : false;
                                      const belongsToCurrentClass = currentClassItem?.selectedScheduleIds?.includes(schedule._id);
                                      const isDisabled = isConflict && !isCurrentlySelected && !belongsToCurrentClass;

                                      return (
                                        <Tooltip key={schedule._id}>
                                          <TooltipTrigger asChild>
                                            <div className="flex items-center space-x-2">
                                              <Checkbox
                                                id={`edit-${schedule._id}`}
                                                checked={isCurrentlySelected}
                                                disabled={isDisabled || crudDialog.operation === "view" || crudDialog.operation === "delete"} // <--- Corrección aquí también
                                                onCheckedChange={(checked) => {
                                                  const currentIds = Array.isArray(field.value)
                                                    ? (field.value as string[])
                                                    : [];
                                                  if (checked) {
                                                    field.onChange([...currentIds, schedule._id]);
                                                  } else {
                                                    field.onChange(
                                                      currentIds.filter((id: string) => id !== schedule._id)
                                                    );
                                                  }
                                                }}
                                              />
                                              <label
                                                htmlFor={`edit-${schedule._id}`}
                                                className={`text-sm font-medium leading-none flex-1 cursor-pointer ${isDisabled
                                                  ? "text-muted-foreground opacity-50 cursor-not-allowed"
                                                  : ""
                                                  } ${isCurrentlySelected && !isDisabled
                                                    ? "text-primary"
                                                    : ""
                                                  }`}
                                              >
                                                <div className="flex items-center justify-between">
                                                  <span className="font-medium flex items-center gap-2">
                                                    {getDayName(schedule.day)}
                                                    {isCurrentlySelected && (
                                                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                                        Asignado
                                                      </span>
                                                    )}
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
                                          </TooltipTrigger>
                                          {isDisabled && (
                                            <TooltipContent side="right" className="max-w-xs">
                                              <p className="text-xs">
                                                ⚠️ Este horario ya está ocupado por otra clase
                                              </p>
                                            </TooltipContent>
                                          )}
                                        </Tooltip>
                                      );
                                    })}
                                  </div>
                                </TooltipProvider>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        }}
      </CrudDialog>

      {/* Dialogo para Creación (multi-paso) */}
      {/* <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                  activeSchoolCycleId={activeCycle?._id}
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
                  existingClass={existingClass} // ← AGREGAR ESTA LÍNEA
                />
              )}
            </form>
          </Form>
        </DialogContent>
      </Dialog> */}
      </TabsContent>
      <TabsContent value="schedules">
        <WeeklySchedule classes={transformClassesForWeeklySchedule} />
      </TabsContent>
      </Tabs>
        </>
        
      )}
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
                  activeSchoolCycleId={activeCycle?._id}
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
                  existingClass={existingClass} // ← AGREGAR ESTA LÍNEA
                />
              )}
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}