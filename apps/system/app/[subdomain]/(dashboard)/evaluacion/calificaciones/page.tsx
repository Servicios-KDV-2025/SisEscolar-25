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
import { NullifiedContextProvider } from "@dnd-kit/core/dist/components/DragOverlay/components";

export default function GradeManagementDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchoolCycle, setSelectedSchoolCycle] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");

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
    canCreateAssignance,
    canCreateRubric,
    canUpdateRubric,
    currentRole,
    isLoading: permissionsLoading,
  } = permissions;

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

  // State synchronization and initial value setting
  useEffect(() => {
    // Solo ejecutamos si hay ciclos y NO hay uno seleccionado manualmente
    if (schoolCycles && schoolCycles.length > 0 && !selectedSchoolCycle) {

      console.log("Buscando ciclo activo en:", schoolCycles);

      // Buscamos el ciclo usando TODAS las variantes posibles
      const activeCycle = schoolCycles.find((c: any) => {
        // Opción 1: Booleano directo (active: true, isActive: true, current: true)
        if (c.active === true) return true;
        if (c.isActive === true) return true;
        if (c.isCurrent === true) return true;
        if (c.current === true) return true;

        // Opción 2: String "true" (por si se guardó como texto)
        if (String(c.active) === "true") return true;
        if (String(c.isActive) === "true") return true;

        // Opción 3: Estado de texto (status: "active", state: "ACTIVO")
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
        setSelectedSchoolCycle(schoolCycles[0]!._id as string);

        // Agrega esto para cumplir el criterio de "Aviso claro"
        toast.info("No se detectó un ciclo activo. Se ha cargado el primer ciclo disponible.");
      }
    }

    // Inicialización de Clases (sin cambios)
    if (classes && classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0]!._id as string);
    }

    // Inicialización de Periodos (sin cambios)
    if (terms && terms.length > 0 && !selectedTerm) {
      setSelectedTerm(terms[0]!._id as string);
    }
  }, [
    schoolCycles,
    // Quitamos selectedSchoolCycle de las dependencias para evitar loops, 
    // pero mantenemos la lógica interna (!selectedSchoolCycle) para respetar la elección del usuario.
    // Nota: Si Convex actualiza schoolCycles, esto se volverá a ejecutar.
    classes, selectedClass,
    terms, selectedTerm
  ]);

  useEffect(() => {
    setSelectedClass("");
    setSelectedTerm("");
  }, [selectedSchoolCycle]);

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
    students.length === 0 ||
    rubrics === undefined ||
    rubrics.length === 0 ||
    grades === undefined;
  const isLoading =
    userLoading ||
    schoolLoading ||
    permissionsLoading ||
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

  if (isLoading) {
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
                          ): cycle.status === "active" ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs ml-1">
                              Activo
                            </Badge>
                          ): null}
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
                <Badge
                  variant="outline"
                  className="bg-black-50 text-black-700 border-black-200 w-fit"
                >
                  {assignments?.length} asignaciones
                </Badge>
              </div>
            </CardTitle>
            <div className="flex flex-col gap-2 md:flex-row">
              {canCreateAssignance &&
                <Button
                  className="cursor-pointer"
                  onClick={openCreate}
                  size="lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Asignación
                </Button>
              }
              {currentRole !== 'tutor' && (
                <Button
                  onClick={handleSaveAverages}
                  size="lg"
                  className="gap-2"
                  disabled={
                    isDataLoading ||
                    !currentSchool ||
                    !students ||
                    students.length === 0 ||
                    currentRole === 'auditor'
                  }
                >
                  <SaveAll className="w-4 h-4" />
                  Guardar Promedios
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="w-full">
          {
            isLoading
              ? (
                <div className="space-y-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground">
                    Cargando calificaciones...
                  </p>
                </div>
              ) : (isDataLoading || !hasSchoolCycles || !hasClasses || !hasTerms) ? (
                <div className="flex justify-center">
                  <div className="space-y-4 text-center">
                    <BookCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      No se pueden mostrar las calificaciones
                    </h3>

                    {currentRole !== 'tutor' ? (
                      <p className="">Registra:</p>
                    ) : (
                      <p className="">Comunicate con soporte para más información.</p>
                    )}
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
                      {canCreateRubric &&
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
                      canUpdateRubric={canUpdateRubric}
                    />
                  </div>
                </div>
              )}
        </CardContent>
      </Card>

      <CrudDialog
        operation={operation}
        title="Crear Nueva Asignación"
        description="Define una nueva Asignación para tus estudiantes"
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