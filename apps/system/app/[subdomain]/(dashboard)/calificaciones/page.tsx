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
import { GradeMatrix } from "./grade-matrix";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { api } from "@repo/convex/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { useUserWithConvex } from "../../../../stores/userStore";
import { useUser } from "@clerk/nextjs";
import { useCurrentSchool } from "../../../../stores/userSchoolsStore";
import { toast } from "sonner";
import { Button } from "@repo/ui/components/shadcn/button";
import { Filter, Plus, Users } from "@repo/ui/icons";
//import { Badge } from "@repo/ui/components/shadcn/badge";

export default function GradeManagementDashboard() {
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

  // Fetch data with Convex
  const schoolCycles = useQuery(
    api.functions.schoolCycles.ObtenerCiclosEscolares,
    currentSchool ? { escuelaID: currentSchool.school._id } : "skip"
  );
  const classes = useQuery(
    api.functions.classCatalog.getClassesBySchoolCycle,
    selectedSchoolCycle
      ? { schoolCycleId: selectedSchoolCycle as Id<"schoolCycle"> }
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
        }
      : "skip"
  );
  const students = useQuery(
    api.functions.student.getStudentWithClasses,
    selectedClass
      ? { classCatalogId: selectedClass as Id<"classCatalog"> }
      : "skip"
  );
  const assignments = useQuery(
    api.functions.assignment.getAssignmentsByClassAndTerm,
    selectedClass && selectedTerm
      ? {
          classCatalogId: selectedClass as Id<"classCatalog">,
          termId: selectedTerm as Id<"term">,
        }
      : "skip"
  );
  const grades = useQuery(
    api.functions.grades.getGradesByClassAndTerm,
    selectedClass && selectedTerm
      ? {
          classCatalogId: selectedClass as Id<"classCatalog">,
          termId: selectedTerm as Id<"term">,
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
    if (schoolCycles && schoolCycles.length > 0 && !selectedSchoolCycle) {
      setSelectedSchoolCycle(schoolCycles[0]!._id as string);
    }
  }, [schoolCycles, selectedSchoolCycle]);

  useEffect(() => {
    if (classes && classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0]!._id as string);
    }
  }, [classes, selectedClass]);

  useEffect(() => {
    if (terms && terms.length > 0 && !selectedTerm) {
      setSelectedTerm(terms[0]!._id as string);
    }
  }, [terms, selectedTerm]);

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

      const studentClassId = student.id;
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

  // Show a general loading screen for initial data fetching
  if (
    !isLoaded ||
    userLoading ||
    schoolLoading ||
    (currentUser && !currentSchool && !schoolError)
  ) {
    return (
      <div className="space-y-8 p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="space-y-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">
              Cargando información de las materias...
            </p>
          </div>
        </div>
      </div>
    );
  }

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

  // Main UI when all data is available
  return (
    <div className="space-y-8 p-6 min-w-full max-w-[1582px] mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">
                    Gestión de Calificaciones Asignaciones
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Administra las calificaciones de las asignaciones por grupo
                    y clase.
                    {currentSchool?.school && (
                      <span className="block text-sm mt-1">
                        {currentSchool.school.name}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            <Button
              size="lg"
              className="gap-2"
              // onClick={handleOpenCreate}
              // disabled={isLoading || !currentSchool || isCrudLoading}
            >
              <Plus className="w-4 h-4" />
              Agregar Asignación
            </Button>
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
                Filtra las calificaciones por ciclo escolar, clase y periodo.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
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
              <Select value={selectedClass} onValueChange={setSelectedClass}>
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

      <div className="flex justify-end">
        <Button onClick={handleSaveAverages} disabled={isDataLoading}>
          Guardar promedios
        </Button>
      </div>

      <Card>
        <CardContent className="w-full" >
          {isDataLoading || !hasSchoolCycles || !hasClasses || !hasTerms ? (
            <div className="flex justify-center">
              <div className="space-y-4 text-center">
                <p className="text-muted-foreground">Aún no has registrado:</p>
                <ul className="list-disc list-inside mt-4 inline-block text-left text-muted-foreground">
                  {!assignments && <li>Asignaciones en esta clase.</li>}
                  {!hasTerms && <li>Periodos en este ciclo</li>}
                  {!hasClasses && <li>Clases en este ciclo</li>}
                  {!hasSchoolCycles && <li>Ciclos</li>}
                  {(!rubrics || rubrics.length === 0) && <li>Rubricas</li>}
                  {(!students || students.length === 0) && (
                    <li>Clases por alumno</li>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <div className="w-full">
              <GradeMatrix
                students={students!}
                assignments={assignments!}
                grades={grades!}
                onGradeUpdate={handleUpdateGrade}
                calculateAverage={calculateAverage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
