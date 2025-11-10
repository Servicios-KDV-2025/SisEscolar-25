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
import { toast } from "sonner";
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

export default function GradeManagementDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchoolCycle, setSelectedSchoolCycle] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");

  const { user: clerkUser, isLoaded } = useUser();
  const { currentUser, isLoading: userLoading } = useUserWithConvex(
    clerkUser?.id
  );
  const {
    currentSchool,
    isLoading: schoolLoading,
    error: schoolError,
  } = useCurrentSchool(currentUser?._id);

  const { createTask } = useTask(currentSchool?.school._id);

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
    isLoading,
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
    // Establece el ciclo escolar por defecto si no hay uno seleccionado
    if (schoolCycles && schoolCycles.length > 0 && !selectedSchoolCycle) {
      setSelectedSchoolCycle(schoolCycles[0]!._id as string);
    }

    // Establece la clase por defecto si no hay una seleccionada
    if (classes && classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0]!._id as string);
    }

    // Establece el periodo por defecto si no hay uno seleccionado
    if (terms && terms.length > 0 && !selectedTerm) {
      setSelectedTerm(terms[0]!._id as string);
    }
  }, [
    schoolCycles, selectedSchoolCycle,
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
        // Obtenemos los datos de forma segura, usando '' como fallback
        const lastNameA = a.student?.name || "";
        const lastNameB = b.student?.name || "";
        const nameA = a.student?.name || "";
        const nameB = b.student?.name || "";

        // La lógica de comparación ahora es segura
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

    // Recorre cada estudiante y guarda su promedio
    for (const student of students) {
      if (!student.student) continue;

      const studentClassId = student._id;
      const newAverage = calculateAverage(studentClassId);

      if (newAverage !== null) {
        try {
          // Llama a la mutación para guardar el promedio del periodo
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
          toast.error(`Error guardando promedio para ${student.student.name}`);
        }
      }
    }
    toast.success("¡Promedios de todos los alumnos guardados!");
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

  // Logic to handle grade updates. This now uses the upsert mutation.
  const handleUpdateGrade = async (
    studentClassId: string,
    assignmentId: string,
    score: number | null,
    comments: string // Agrega el argumento de comentario aquí
  ) => {
    // Only proceed if a user is logged in and the score is a number
    if (!currentUser || score === null) return;

    try {
      await upsertGrade({
        studentClassId: studentClassId as Id<"studentClass">,
        assignmentId: assignmentId as Id<"assignment">,
        score: score,
        comments: comments,
        registeredById: currentUser._id as Id<"user">,
      });
      toast.success("Calificación de asignación actualizada.");
    } catch (error) {
      toast.error(
        "Error al actualizar la calificación:" + (error as Error).message
      );
    }
  };

  // Logic to calculate the student's weighted average
  const calculateAverage = (studentClassId: string): number | null => {
    if (!assignments || !rubrics || !grades) return null;

    const studentGrades = grades.filter(
      (g) => g.studentClassId === studentClassId
    );

    // 1. Crear un mapa para acumular los puntajes totales por rúbrica.
    const rubricTotals = new Map<
      Id<"gradeRubric">,
      { totalScore: number; totalMaxScore: number }
    >();

    // 2. Iterar sobre las calificaciones y agrupar por rúbrica.
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

    // 3. Calcular el promedio final aplicando el peso de cada rúbrica.
    let finalGrade = 0;
    rubricTotals.forEach((totals, rubricId) => {
      const rubric = rubrics.find((r) => r._id === rubricId);
      if (rubric && totals.totalMaxScore > 0) {
        // Calcular el porcentaje de la categoría (ej. 100% en Tareas)
        const rubricPercentage = Math.round(
          (totals.totalScore / totals.totalMaxScore) * 100
        );

        // Multiplicar por el peso de la rúbrica (ej. 10% del total)
        // Asumimos que el peso es un valor decimal (ej. 0.1 para 10%)
        finalGrade += rubricPercentage * rubric.weight;
      }
    });

    return Math.round(finalGrade);
  };

  // Conditionally render based on data availability

  // Check for missing data and display specific messages
  const hasSchoolCycles = schoolCycles && schoolCycles.length > 0;
  const hasClasses = classes && classes.length > 0;
  const hasTerms = terms && terms.length > 0;

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!currentSchool?.school._id || !currentUser?._id) {
      console.error('Missing required IDs');
      return;
    }

    try {
      // Combinar fecha y hora para crear el timestamp
      const dueDateTime = new Date(`${values.dueDate}T${values.dueTime}`);
      const dueTimestamp = dueDateTime.getTime();

      // Aquí necesitarías la función createTask - puede que necesites importarla o crearla
      await createTask({
        classCatalogId: values.classCatalogId as Id<"classCatalog">,
        termId: values.termId as Id<"term">,
        gradeRubricId: values.gradeRubricId as Id<"gradeRubric">,
        name: values.name as string,
        description: values.description as string,
        dueDate: dueTimestamp,
        maxScore: parseInt(values.maxScore as string),
      });

      close();
    } catch (error) {
      console.error('Error al procesar la tarea:', error);
    }
  }


  // Main UI when all data is available
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
            <div className="flex flex-col gap-4 sm:flex-col sm:items-center sm:gap-8 lg:gap-2">
              {canCreateAssignance &&
                <Button
                  className="cursor-pointer"
                  onClick={openCreate}
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
                      {cycle.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
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
          <CardTitle className="flex items-center justify-between">
            <span>Calificaciones</span>
            <Badge
              variant="outline"
              className="bg-black-50 text-black-700 border-black-200"
            >
              {assignments?.length} asignaciones
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="w-full">
          {(
            !isLoaded ||
            userLoading ||
            schoolLoading ||
            isLoading ||
            (currentUser && !currentSchool && !schoolError)
          ) ? (
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
