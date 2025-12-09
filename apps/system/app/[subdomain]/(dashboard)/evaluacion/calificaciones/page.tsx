"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import { GradeMatrix } from "../../../../../components/grade-matrix";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { api } from "@repo/convex/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { toast } from "@repo/ui/sonner";
import { Button } from "@repo/ui/components/shadcn/button";
import { Filter, BookCheck, SaveAll, Search, Plus } from "@repo/ui/icons";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { SquareStack } from "lucide-react";
import { Input } from "@repo/ui/components/shadcn/input";
import Link from "next/link";
import { useUserWithConvex } from "stores/userStore";
import { useCurrentSchool } from "stores/userSchoolsStore";
import { usePermissions } from 'hooks/usePermissions';
import { CrudDialog, useCrudDialog } from '@repo/ui/components/dialog/crud-dialog';
import { TaskForm } from 'components/tasks/TaskForm';
import { UseFormReturn } from 'react-hook-form';
import { TaskFormData, taskFormSchema } from '@/types/form/taskSchema';
import { useTask } from 'stores/taskStore';
import { useCrudToastMessages } from "../../../../../hooks/useCrudToastMessages";
import { GeneralDashboardSkeleton } from "components/skeletons/GeneralDashboardSkeleton";
import { AlertCircle, RefreshCw, XCircle } from '@repo/ui/icons';

export default function GradeManagementDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchoolCycle, setSelectedSchoolCycle] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [isSlowLoading, setIsSlowLoading] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [connectionError, setConnectionError] = useState(false);



  const { user: clerkUser } = useUser();
  const { currentUser, isLoading: userLoading } = useUserWithConvex(
    clerkUser?.id
  );
  const {
    currentSchool,
    isLoading: schoolLoading,

  } = useCurrentSchool(currentUser?._id);

  const { createTask } = useTask(currentSchool?.school._id);

  //   Mensajes de toast personalizados
  const toastMessages = useCrudToastMessages("Calificación");
  const toastMessagesAsignacion = useCrudToastMessages("Asignación");

  const {
    isOpen,
    operation,
    data,
    openCreate,
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
  })

  const permissions = usePermissions();

  const {
    canCreateRubric,
    canUpdateRubric,
    currentRole,
    isLoading: permissionsLoading,
    hasPermissionWithCycleCheck,
  } = permissions;

  // Restricción: Solo teachers pueden realizar acciones CRUD
  const canTeacherCreateRubric = canCreateRubric && currentRole === 'teacher';
  const canTeacherUpdateRubric = canUpdateRubric && currentRole === 'teacher';

  // Fetch data with Convex
  const schoolCycles = useQuery(
    api.functions.schoolCycles.ObtenerCiclosEscolares,
    currentSchool ? { escuelaID: currentSchool.school._id } : "skip"
  );
  const classes = useQuery(
    api.functions.classCatalog.getClassesBySchoolCycle,
    selectedSchoolCycle && currentSchool
      ? {
        schoolId: currentSchool.school._id as Id<"school">,
        schoolCycleId: selectedSchoolCycle as Id<"schoolCycle">,
        canViewAll: permissions.getStudentFilters().canViewAll,
        tutorId: permissions.getStudentFilters().tutorId,
        teacherId: permissions.getStudentFilters().teacherId
      }
      : "skip"
  );
  const terms = useQuery(
    api.functions.terms.getTermsByCycleId,
    selectedSchoolCycle
      ? { schoolCycleId: selectedSchoolCycle as Id<"schoolCycle"> }
      : "skip"
  );
  const rubrics = useQuery(
    api.functions.gradeRubrics.getGradeRubricByClassAndTerm,
    selectedClass && selectedTerm
      ? {
        classCatalogId: selectedClass as Id<"classCatalog">,
        termId: selectedTerm as Id<"term">,
        canViewAll: permissions.getStudentFilters().canViewAll,
        teacherId: permissions.getStudentFilters().teacherId,
        tutorId: permissions.getStudentFilters().tutorId,
      }
      : "skip"
  );
  const students = useQuery(
    api.functions.student.getStudentWithClasses,
    selectedClass
      ? {
        classCatalogId: selectedClass as Id<"classCatalog">,
        canViewAll: permissions.getStudentFilters().canViewAll,
        tutorId: permissions.getStudentFilters().tutorId,
        teacherId: permissions.getStudentFilters().teacherId
      }
      : "skip"
  );
  const assignments = useQuery(
    api.functions.assignment.getAssignmentsByClassAndTerm,
    selectedClass && selectedTerm
      ? {
        classCatalogId: selectedClass as Id<"classCatalog">,
        termId: selectedTerm as Id<"term">,
        canViewAll: permissions.getStudentFilters().canViewAll,
        tutorId: permissions.getStudentFilters().tutorId,
        teacherId: permissions.getStudentFilters().teacherId
      }
      : "skip"
  );
  const grades = useQuery(
    api.functions.grades.getGradesByClassAndTerm,
    selectedClass && selectedTerm
      ? {
        classCatalogId: selectedClass as Id<"classCatalog">,
        termId: selectedTerm as Id<"term">,
        canViewAll: permissions.getStudentFilters().canViewAll,
        tutorId: permissions.getStudentFilters().tutorId,
        teacherId: permissions.getStudentFilters().teacherId
      }
      : "skip"
  );

  // Mutations
  const upsertGrade = useMutation(api.functions.grades.upsertGrade);
  const upsertTermAverage = useMutation(
    api.functions.termAverages.upsertTermAverage
  );

  // ✅ VARIABLES DE LOADING (Línea ~168)
  const isInitialLoading = userLoading || schoolLoading || permissionsLoading;

  const isTableDataLoading =
    assignments === undefined ||
    classes === undefined ||
    terms === undefined ||
    schoolCycles === undefined ||
    students === undefined ||
    rubrics === undefined ||
    grades === undefined;

  const hasNoData =
    !selectedClass ||
    !selectedTerm ||
    students?.length === 0 ||
    rubrics?.length === 0 ||
    connectionError ||
    loadingTimeout;

  // State synchronization and initial value setting
  // 1. Efecto para inicializar el Ciclo Escolar
  useEffect(() => {
    if (schoolCycles && schoolCycles.length > 0 && !selectedSchoolCycle) {
      console.log("Buscando ciclo activo en:", schoolCycles);

      // Buscamos el ciclo usando TODAS las variantes posibles
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const activeCycle = schoolCycles.find((c: any) => {
        // Opción 1: Booleano directo
        if (c.active === true) return true;
        if (c.isActive === true) return true;
        if (c.isCurrent === true) return true;
        if (c.current === true) return true;

        // Opción 2: String "true"
        if (String(c.active) === "true") return true;
        if (String(c.isActive) === "true") return true;

        // Opción 3: Estado de texto
        if (c.status?.toLowerCase() === "active") return true;
        if (c.status?.toLowerCase() === "activo") return true;
        if (c.state?.toLowerCase() === "active") return true;

        return false;
      });

      if (activeCycle) {
        console.log("¡ENCONTRADO! Ciclo activo:", activeCycle);
        setSelectedSchoolCycle(activeCycle._id as string);
      } else {
        console.warn("NO SE ENCONTRÓ NINGÚN ACTIVO. Usando el primero por defecto.");
        if (schoolCycles[0]) {
          setSelectedSchoolCycle(schoolCycles[0]._id as string);
        }
        toast.info("No se detectó un ciclo activo. Se ha cargado el primer ciclo disponible.");
      }
    }
  }, [schoolCycles, selectedSchoolCycle]);

  // 2. Efecto para inicializar la Clase
  useEffect(() => {
    if (classes && classes.length > 0 && !selectedClass && selectedSchoolCycle) {
      const cycle = schoolCycles?.find(c => c._id === selectedSchoolCycle);
      // Solo auto-seleccionar si el ciclo está activo
      if (cycle?.status === "active") {
        setSelectedClass(classes[0]!._id as string);
      }
    }
  }, [classes, selectedClass, selectedSchoolCycle, schoolCycles]);

  // 3. Efecto para inicializar el Periodo
  useEffect(() => {
    if (terms && terms.length > 0 && !selectedTerm && selectedSchoolCycle) {
      const cycle = schoolCycles?.find(c => c._id === selectedSchoolCycle);
      // Solo auto-seleccionar si el ciclo está activo
      if (cycle?.status === "active") {
        setSelectedTerm(terms[0]!._id as string);
      }
    }
  }, [terms, selectedTerm, selectedSchoolCycle, schoolCycles]);

  useEffect(() => {
    if (selectedSchoolCycle) {
      // Resetear las selecciones dependientes cuando cambia el ciclo
      setSelectedClass("");
      setSelectedTerm("");

      // Mostrar mensaje si el ciclo no está activo
      const cycle = schoolCycles?.find(c => c._id === selectedSchoolCycle);
      if (cycle?.status !== "active") {
        toast.info(
          <span style={{ color: '#ea580c' }}>
            Este ciclo está {cycle?.status === "archived" ? "archivado" : "inactivo"}.
            Los datos son de solo lectura.
          </span>,
          {
            className: 'bg-white border border-orange-200',
            unstyled: false,
          }
        );
      }
    }
  }, [selectedSchoolCycle, schoolCycles]);

  useEffect(() => {
    if (!isTableDataLoading) {
      setIsSlowLoading(false);
      setLoadingTime(0);
      setLoadingTimeout(false);
      setConnectionError(false);
      return;
    }

    const startTime = Date.now();

    // Mostrar mensaje de "carga lenta" después de 5 segundos
    const slowTimeoutId = setTimeout(() => {
      setIsSlowLoading(true);
    }, 5000);

    // Mostrar error de conexión después de 15 segundos
    const errorTimeoutId = setTimeout(() => {
      setLoadingTimeout(true);
      setConnectionError(true);

      toast.error(
        <span style={{ color: '#dc2626' }}>
          Error al cargar los datos
        </span>,
        {
          className: 'bg-white border border-red-200',
          unstyled: false,
          description: 'No se pudo conectar al servidor o no hay datos disponibles'
        }
      );
    }, 15000); // 15 segundos

    // Actualizar contador cada segundo
    const intervalId = setInterval(() => {
      setLoadingTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => {
      clearTimeout(slowTimeoutId);
      clearTimeout(errorTimeoutId);
      clearInterval(intervalId);
    };
  }, [isTableDataLoading]);

  const filteredAndSortedStudents = students
    ? students
      .filter((student) => {
        if (!student || !student.student) return false;
        const fullName =
          `${student.student.name || ""} ${student.student.lastName || ""}`.toLowerCase();
        const searchTermLower = searchTerm.toLowerCase();
        return fullName.includes(searchTermLower);
      })
      .sort((a, b) => {
        const lastNameA = a.student?.name || "";
        const lastNameB = b.student?.name || "";
        const nameA = a.student?.name || "";
        const nameB = b.student?.name || "";

        const lastNameComparison = lastNameA.localeCompare(lastNameB);
        if (lastNameComparison !== 0) {
          return lastNameComparison;
        }
        return nameA.localeCompare(nameB);
      })
    : [];

  const handleSaveAverages = async () => {
    if (
      !students ||
      !selectedTerm ||
      !assignments ||
      !rubrics ||
      !grades ||
      !currentUser
    )
      return;

    for (const student of students) {
      if (!student.student) continue;

      const studentClassId = student._id;
      const newAverage = calculateAverage(studentClassId);

      if (newAverage !== null) {
        try {
          await upsertTermAverage({
            studentClassId: studentClassId as Id<"studentClass">,
            termId: selectedTerm as Id<"term">,
            averageScore: newAverage,
            registeredById: currentUser._id as Id<"user">,
          });
        } catch (error) {
          console.error(
            `Error guardando promedio para ${student.student.name}:`,
            error
          );
          toast.error(
            <span style={{ color: '#dc2626' }}>
              Error guardando promedio para {student.student.name}
            </span>,
            {
              className: 'bg-white border border-red-200',
              unstyled: false,
              description: error instanceof Error ? error.message : undefined
            }
          );
        }
      }
    }
    toast.success(
      <span style={{ color: '#16a34a', fontWeight: 600 }}>
        ¡Promedios de todos los alumnos guardados!
      </span>,
      {
        className: 'bg-white border border-green-200',
        unstyled: false,
      }
    );
  };

  // Handle loading state
  const isDataLoading =
    assignments === undefined ||
    classes === undefined ||
    terms === undefined ||
    schoolCycles === undefined ||
    students === undefined ||
    rubrics === undefined ||
    grades === undefined;

  // Logic to handle grade updates.
  const handleUpdateGrade = async (
    studentClassId: string,
    assignmentId: string,
    score: number | null,
    comments: string
  ) => {
    if (!currentUser || score === null) return;

    try {
      await upsertGrade({
        studentClassId: studentClassId as Id<"studentClass">,
        assignmentId: assignmentId as Id<"assignment">,
        score: score,
        comments: comments,
        registeredById: currentUser._id as Id<"user">,
      });
      toast.success(
        <span style={{ color: '#16a34a', fontWeight: 600 }}>
          {toastMessages.editSuccess}
        </span>,
        {
          className: 'bg-white border border-green-200',
          unstyled: false,
        }
      );
    } catch (error) {
      toast.error(
        <span style={{ color: '#dc2626' }}>
          {toastMessages.editError}
        </span>,
        {
          className: 'bg-white border border-red-200',
          unstyled: false,
          description: error instanceof Error ? error.message : undefined
        }
      );
    }
  };

  const calculateAverage = (studentClassId: string): number | null => {
    if (!assignments || !rubrics || !grades) return null;

    const studentGrades = grades.filter(
      (g) => g.studentClassId === studentClassId
    );

    const rubricTotals = new Map<
      Id<"gradeRubric">,
      { totalScore: number; totalMaxScore: number }
    >();

    studentGrades.forEach((grade) => {
      const assignment = assignments.find((a) => a._id === grade.assignmentId);
      if (assignment && grade.score !== null) {
        const rubricId = assignment.gradeRubricId;

        if (!rubricTotals.has(rubricId)) {
          rubricTotals.set(rubricId, {
            totalScore: 0,
            totalMaxScore: 0,
          });
        }

        const totals = rubricTotals.get(rubricId)!;
        totals.totalScore += grade.score;
        totals.totalMaxScore += assignment.maxScore;
      }
    });

    let finalGrade = 0;
    rubricTotals.forEach((totals, rubricId) => {
      const rubric = rubrics.find((r) => r._id === rubricId);
      if (rubric && totals.totalMaxScore > 0) {
        const rubricPercentage = Math.round(
          (totals.totalScore / totals.totalMaxScore) * 100
        );
        finalGrade += rubricPercentage * rubric.weight;
      }
    });

    return Math.round(finalGrade);
  };

  const hasSchoolCycles = schoolCycles && schoolCycles.length > 0;
  const hasClasses = classes && classes.length > 0;
  const hasTerms = terms && terms.length > 0;

  // Get selected cycle status
  const selectedCycle = schoolCycles?.find(c => c._id === selectedSchoolCycle);
  const selectedCycleStatus = selectedCycle?.status;

  // Check permissions with cycle status
  // Check permissions with cycle status
  const canCreateAssignanceWithCycle = hasPermissionWithCycleCheck("create:assignance", selectedCycleStatus);
  const canTeacherCreateAssignance = canCreateAssignanceWithCycle && currentRole === 'teacher';
  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!currentSchool?.school._id || !currentUser?._id) {
      console.error('Missing required IDs');
      return;
    }

    const dueDateTime = new Date(`${values.dueDate}T${values.dueTime}`);
    const dueTimestamp = dueDateTime.getTime();

    await createTask({
      classCatalogId: values.classCatalogId as Id<"classCatalog">,
      termId: values.termId as Id<"term">,
      gradeRubricId: values.gradeRubricId as Id<"gradeRubric">,
      name: values.name as string,
      description: values.description as string,
      dueDate: dueTimestamp,
      maxScore: parseInt(values.maxScore as string),
    });
  }

  if (isInitialLoading) {
    return <GeneralDashboardSkeleton nc={0} />;
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <BookCheck className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">
                    Calificaciones de Asignaciones
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Administra las calificaciones de las Asignaciones del curso.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="grid grid-cols-1">
        <Card className=" flex flex-row items-center justify-between">
          <div className="flex items-center gap-3 pl-6 flex-shrink-0">
            <SquareStack className="h-5 w-5" />
            <h3 className="font-semibold tracking-tight">
              Ponderación del Periodo
            </h3>
          </div>
          <CardContent>
            {rubrics ? (
              rubrics.length > 0 ? (
                <div className=" flex flex-row gap-4 py-0 flex-wrap justify-center text-xl">
                  {rubrics.map((rubric) => (
                    <div key={rubric._id}>
                      {rubric.name}: {Math.round(rubric.weight * 100)}%
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No hay rúbricas definidas para esta clase y periodo.
                </p>
              )
            ) : (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            )}
          </CardContent>
        </Card>
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
                Filtra las calificaciones por ciclo escolar, clase y periodo.
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
                  placeholder="Buscar por nombre, apellido"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={selectedSchoolCycle}
                onValueChange={setSelectedSchoolCycle}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Ciclo Escolar" />
                </SelectTrigger>
                <SelectContent>
                  {hasSchoolCycles &&
                    schoolCycles.map((cycle) => (
                      <SelectItem key={cycle._id} value={cycle._id as string}>
                        <div className="flex items-center gap-2">
                          <span>{cycle.name}</span>
                          {cycle.status === "archived" && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs ml-1">
                              Archivado
                            </Badge>
                          )}
                          {cycle.status === "inactive" ? (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs ml-1">
                              Inactivo
                            </Badge>
                          ) : cycle.status === "active" ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs ml-1">
                              Activo
                            </Badge>
                          ) : null}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {selectedSchoolCycle && schoolCycles && (
                <div className="flex items-center gap-2">
                  {(() => {
                    const selected = schoolCycles.find(c => c._id === selectedSchoolCycle);
                    if (selected?.status === "archived") {
                      return (
                        <Badge className="bg-blue-100 text-blue-800 border border-blue-200 whitespace-nowrap">
                          Ciclo Archivado
                        </Badge>
                      );
                    }
                    if (selected?.status === "inactive") {
                      return (
                        <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 whitespace-nowrap">
                          Ciclo Inactivo
                        </Badge>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>
            {hasClasses && (
              <Select
                value={selectedClass}
                onValueChange={setSelectedClass}
                disabled={!selectedSchoolCycle}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Clase" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls._id} value={cls._id as string}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {hasTerms && (
              <Select
                value={selectedTerm}
                onValueChange={setSelectedTerm}
                disabled={!selectedSchoolCycle}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Periodo" />
                </SelectTrigger>
                <SelectContent>
                  {hasTerms &&
                    terms.map((term) => (
                      <SelectItem key={term._id} value={term._id as string}>
                        {term.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grade Matrix */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>
            <div className="flex flex-col gap-2">
            <span>Calificaciones</span>
            {canTeacherCreateAssignance && (
              <Badge
                variant="outline"
                className="bg-black-50 text-black-700 border-black-200 w-fit"
              >
                {assignments?.length} asignaciones
              </Badge>
            )}
            </div>
          </CardTitle>
          {canTeacherCreateAssignance ? (
            <div className="flex flex-col gap-2 md:flex-row">
              <Button
                className="cursor-pointer"
                onClick={openCreate}
                size="lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Asignación
              </Button>
              {canTeacherUpdateRubric && (
                <Button
                  onClick={handleSaveAverages}
                  size="lg"
                  className="gap-2"
                  disabled={
                    isDataLoading ||
                    !currentSchool ||
                    !students ||
                    students.length === 0
                  }
                >
                  <SaveAll className="w-4 h-4" />
                  Guardar Promedios
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2 md:flex-row">
              {canTeacherUpdateRubric && (
                <Button
                  onClick={handleSaveAverages}
                  size="lg"
                  className="gap-2"
                  disabled={
                    isDataLoading ||
                    !currentSchool ||
                    !students ||
                    students.length === 0
                  }
                >
                  <SaveAll className="w-4 h-4" />
                  Guardar Promedios
                </Button>
              )}
              <Badge
                variant="outline"
                className="bg-black-50 text-black-700 border-black-200 w-fit"
              >
                {assignments?.length} asignaciones
              </Badge>
            </div>
          )}
          </div>
        </CardHeader>
        <CardContent className="w-full">
          {
            isTableDataLoading && !loadingTimeout
              ? (
                <div className="space-y-4 text-center py-8">
                  {/* Spinner con contador de tiempo */}
                  <div className="relative inline-flex">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    {loadingTime > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-muted-foreground">
                          {loadingTime}s
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Mensaje principal */}
                  <p className="text-muted-foreground font-medium">
                    Cargando calificaciones...
                  </p>

                  {/* Mensaje de carga lenta (aparece después de 5 segundos) */}
                  {isSlowLoading && (
                    <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center justify-center gap-2 text-orange-600">
                        <AlertCircle className="h-5 w-5" />
                        <p className="font-medium">
                          Esto está tomando más tiempo de lo esperado...
                        </p>
                      </div>

                      
                    </div>
                  )}
                </div>
              ) : (hasNoData || !hasSchoolCycles || !hasClasses || !hasTerms) ? (
                <div className="flex justify-center">
                  <div className="space-y-4 text-center">
                    {/* Ícono según el tipo de error */}
                    {connectionError ? (
                      <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    ) : (
                      <BookCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    )}

                    {/* Título según el tipo de error */}
                    <h3 className="text-lg font-medium mb-2">
                      {connectionError
                        ? "Error de conexión al servidor"
                        : "No se pueden mostrar las calificaciones"
                      }
                    </h3>

                    {/* Mensaje específico según el error */}
                    {connectionError ? (
                      <div className="space-y-3">
                        <p className="text-muted-foreground">
                          No se pudo cargar la información. Esto puede deberse a:
                        </p>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-left max-w-md mx-auto">
                          <ul className="space-y-2">
                            <li className="flex items-start gap-2">
                              <span className="text-red-500 mt-0.5">•</span>
                              <span>Problemas de conexión a internet</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-red-500 mt-0.5">•</span>
                              <span>El servidor no responde</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-red-500 mt-0.5">•</span>
                              <span>No existen datos para este ciclo/clase/periodo</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-red-500 mt-0.5">•</span>
                              <span>Tiempo de espera agotado</span>
                            </li>
                          </ul>
                        </div>

                        <div className="flex gap-2 justify-center pt-4">
                          <Button
                            onClick={() => {
                              setConnectionError(false);
                              setLoadingTimeout(false);
                              window.location.reload();
                            }}
                            className="gap-2"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Reintentar
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() => {
                              setConnectionError(false);
                              setLoadingTimeout(false);
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>

                        <p className="text-xs text-muted-foreground mt-4">
                          Si el problema persiste, verifica tu conexión a internet o contacta a soporte técnico.
                        </p>
                      </div>
                    ) : 
                       selectedCycleStatus && selectedCycleStatus !== "active" ? (
                        <div className="space-y-3">
                          <p className="text-muted-foreground">
                            Este ciclo está {selectedCycleStatus === "archived" ? "archivado" : "inactivo"}.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Selecciona una clase y periodo para ver los datos históricos.
                          </p>
                        </div>
                      ) : !selectedClass || !selectedTerm ? (
                        <p className="text-muted-foreground">
                          Selecciona una clase y un periodo para ver las calificaciones.
                        </p>
                      ) : currentRole !== 'tutor' ? (
                        <p className="text-muted-foreground">Registra:</p>
                      ) : (
                        <p className="text-muted-foreground">Comunícate con soporte para más información.</p>
                      )}

                    {/* Solo mostrar botones si el ciclo está activo Y no hay datos */}
                    {!connectionError && selectedCycleStatus === "active" && (
                      <div className="flex flex-col items-center gap-4 w-full" >
                        {/*esta es la 1ra fila de botones*/}
                        <div className="flex flex-row gap-4 justify-center w-full"  >
                          {(!assignments && canCreateRubric) && (
                            <Link href={`/evaluacion/asignaciones`}>
                              <Button>
                                <Plus className="w-4 h-4" />
                                Asignaciones
                              </Button>
                            </Link>
                          )}

                          {!hasTerms && (
                            <Link href={`/administracion/periodos`}>
                              <Button>
                                <Plus className="w-4 h-4" />
                                Periodos
                              </Button>
                            </Link>
                          )}
                          {!hasClasses && (
                            <Link href={`/administracion/clases`}>
                              <Button>
                                <Plus className="w-4 h-4" />
                                Clases
                              </Button>
                            </Link>
                          )}
                        </div>

                        {/*esta es la 2da fila de botones*/}
                        {canTeacherCreateRubric &&
                          <div className="flex flex-row gap-4 justify-center w-full">
                            {!hasSchoolCycles && (
                              <Link href='/administracion/ciclos-escolares'>
                                <Button>
                                  <Plus className="w-4 h-4" />
                                  Ciclos Escolares
                                </Button>
                              </Link>
                            )}
                            {(!rubrics || rubrics.length === 0) && (
                              <Link href={`/evaluacion/rubricas`}>
                                <Button>
                                  <Plus className="w-4 h-4" />
                                  Rubricas
                                </Button>
                              </Link>
                            )}
                            {(!students || students.length === 0) && (
                              <Link href={`/administracion/asignacion-de-clases`}>
                                <Button>
                                  <Plus className="w-4 h-4" />
                                  Asignación de clases{" "}
                                </Button>
                              </Link>
                            )}
                          </div>
                        }
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <div className="min-w-full">
                    <GradeMatrix
                      students={filteredAndSortedStudents}
                      assignments={assignments!}
                      grades={grades!}
                      onGradeUpdate={handleUpdateGrade}
                      calculateAverage={calculateAverage}
                      canUpdateRubric={canTeacherUpdateRubric}
                    />
                  </div>
                </div>
              )
          }
        </CardContent>
      </Card>

      <CrudDialog
        operation={operation}
        title="Registrar Nueva Calificación"
        description="Ingresa la calificación correspondiente para el alumno y mantén actualizado su desempeño académico."
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
        data={data}
        isOpen={isOpen}
        onOpenChange={close}
        onSubmit={handleSubmit}
        toastMessages={toastMessagesAsignacion}
        disableDefaultToasts={false}
      >
        {(form, operation) => (
          <TaskForm
            form={form as unknown as UseFormReturn<TaskFormData>}
            operation={operation}
            teacherClasses={classes}
            allTerms={terms}
          />
        )}
      </CrudDialog>
    </div>
  );
}
