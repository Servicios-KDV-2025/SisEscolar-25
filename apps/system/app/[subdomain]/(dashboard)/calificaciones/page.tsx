"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@repo/ui/components/shadcn/card";
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

export default function GradeManagementDashboard() {
  const [selectedSchoolCycle, setSelectedSchoolCycle] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");

  const { user: clerkUser, isLoaded } = useUser();
  const { currentUser, isLoading: userLoading } = useUserWithConvex(
    clerkUser?.id
  );
  const { currentSchool, isLoading: schoolLoading, error: schoolError } =
    useCurrentSchool(currentUser?._id);

  // Fetch data with Convex
  const schoolCycles = useQuery(
    api.functions.schoolCycles.ObtenerCiclosEscolares,
    currentSchool ? { escuelaID: currentSchool.school._id } : "skip"
  );
  const classes = useQuery(
    api.functions.classCatalog.getAllClassCatalog,
    currentSchool ? { schoolId: currentSchool.school._id } : "skip"
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
    api.functions.assignments.getAssignmentsByClassAndTerm,
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

  // Handle loading state
  const isDataLoading =
    assignments === undefined ||
    classes === undefined ||
    terms === undefined ||
    schoolCycles === undefined ||
    students === undefined ||
    rubrics === undefined ||
    grades === undefined;

  // Show a general loading screen for initial data fetching
  if (!isLoaded || userLoading || schoolLoading || (currentUser && !currentSchool && !schoolError)) {
      return (
          <div className="space-y-8 p-6 max-w-7xl mx-auto">
              <div className="flex items-center justify-center min-h-[400px]">
                  <div className="space-y-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-muted-foreground">Cargando información de las materias...</p>
                  </div>
              </div>
          </div>
      )
  };

  // Logic to handle grade updates. This now uses the upsert mutation.
  const handleUpdateGrade = async (
    studentClassId: string,
    assignmentId: string,
    score: number | null
  ) => {
    // Only proceed if a user is logged in and the score is a number
    if (!currentUser || score === null) return;

    try {
      await upsertGrade({
        studentClassId: studentClassId as Id<"studentClass">,
        assignmentId: assignmentId as Id<"assignment">,
        score: score,
        registeredById: currentUser._id as Id<"user">,
      });
    } catch (error) {
      console.error("Error al actualizar la calificación:", error);
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
        const rubricPercentage =
          (totals.totalScore / totals.totalMaxScore) * 100;

        // Multiplicar por el peso de la rúbrica (ej. 10% del total)
        // Asumimos que el peso es un valor decimal (ej. 0.1 para 10%)
        finalGrade += rubricPercentage * rubric.weight;
      }
    });

    return Math.round(finalGrade);
  };

  // Conditionally render based on data availability
  if (isDataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Cargando datos del periodo...</p>
        </div>
      </div>
    );
  }

  // Check for missing data and display specific messages
  const hasSchoolCycles = schoolCycles && schoolCycles.length > 0;
  const hasClasses = classes && classes.length > 0;
  const hasTerms = terms && terms.length > 0;

  if (!hasSchoolCycles || !hasClasses || !hasTerms) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <h1 className="text-3xl font-bold text-foreground">
            Matriz de Calificaciones
          </h1>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center p-8">
                <p className="text-muted-foreground">
                  Aún no has registrado:
                </p>
                <ul className="list-disc list-inside mt-4 inline-block text-left text-muted-foreground">
                  {!hasSchoolCycles && <li>Ciclos escolares</li>}
                  {!hasClasses && <li>Clases</li>}
                  {!hasTerms && <li>Periodos</li>}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main UI when all data is available
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <h1 className="text-3xl font-bold text-foreground">
          Matriz de Calificaciones
        </h1>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 gap-4">
                <Select
                  value={selectedSchoolCycle}
                  onValueChange={setSelectedSchoolCycle}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Ciclo Escolar" />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolCycles.map((cycle) => (
                      <SelectItem key={cycle._id} value={cycle._id as string}>
                        {cycle.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-40">
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
                <Select
                  value={selectedTerm}
                  onValueChange={setSelectedTerm}
                  disabled={!selectedSchoolCycle}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.map((term) => (
                      <SelectItem key={term._id} value={term._id as string}>
                        {term.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-2">
                  {/* Display Rubrics Information */}
                  {rubrics && rubrics.length > 0 && (
                    <div
                      className={`grid grid-cols-1 md:grid-cols-2 gap-4 w-full ${
                        rubrics.length === 1 ? "lg:grid-cols-1" : ""
                      } ${rubrics.length === 2 ? "lg:grid-cols-2" : ""} ${
                        rubrics.length >= 3 ? "lg:grid-cols-3" : ""
                      }`}
                    >
                      {rubrics.map((rubric) => (
                        <div
                          key={rubric._id}
                          className="flex justify-center border border-border rounded-md px-2 py-1 bg-secondary/50"
                        >
                          <h3 className="font-semibold px-2">
                            {rubric.name}:
                          </h3>
                          <h3 className="font-semibold">
                            {rubric.weight * 100}%
                          </h3>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grade Matrix */}
        <Card>
          <CardContent>
            {students && students.length === 0 ? (
              <div className="text-center text-muted-foreground p-8">
                No hay estudiantes en esta clase.
              </div>
            ) : rubrics && rubrics.length === 0 ? (
              <div className="text-center text-muted-foreground p-8">
                No hay rúbricas para esta clase y periodo.
              </div>
            ) : (
              <GradeMatrix
                students={students!}
                assignments={assignments!}
                grades={grades!}
                onGradeUpdate={handleUpdateGrade}
                calculateAverage={calculateAverage}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}