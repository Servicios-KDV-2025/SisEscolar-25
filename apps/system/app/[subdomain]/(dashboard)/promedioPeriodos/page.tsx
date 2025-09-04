// components/grade-management-dashboard.tsx
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
import { TermAverageMatrix } from "./term-average-matrix"; // ✨ Importa el nuevo componente
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { api } from "@repo/convex/convex/_generated/api";
import { useQuery } from "convex/react";
import { useUserWithConvex } from "../../../../stores/userStore";
import { useUser } from "@clerk/nextjs";
import { useCurrentSchool } from "../../../../stores/userSchoolsStore";

export default function GradeManagementDashboard() {
  const [selectedSchoolCycle, setSelectedSchoolCycle] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");

  const { user: clerkUser, isLoaded } = useUser();
  const { currentUser, isLoading: userLoading } = useUserWithConvex(clerkUser?.id);
  const { currentSchool, isLoading: schoolLoading, error: schoolError } = useCurrentSchool(currentUser?._id);

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
  const students = useQuery(
    api.functions.student.getStudentWithClasses,
    selectedClass
      ? { classCatalogId: selectedClass as Id<"classCatalog"> }
      : "skip"
  );

  // ✨ Nuevo fetch para obtener los promedios de los periodos para cada estudiante
  const termAverages = useQuery(
    api.functions.termAverages.getAnnualAveragesForStudents,
    selectedSchoolCycle && selectedClass ? { 
        schoolCycleId: selectedSchoolCycle as Id<"schoolCycle">,
        classCatalogId: selectedClass as Id<"classCatalog"> 
    } : "skip"
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

  const isLoading = !isLoaded || userLoading || schoolLoading;

  if (isLoading || (currentUser && !currentSchool && !schoolError)) {
    return (
      <div className="space-y-8 p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="space-y-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Cargando información...</p>
          </div>
        </div>
      </div>
    );
  }

  const hasSchoolCycles = schoolCycles && schoolCycles.length > 0;
  const hasClasses = classes && classes.length > 0;
  const hasTerms = terms && terms.length > 0;

  if (!hasSchoolCycles || !hasClasses || !hasTerms) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <h1 className="text-3xl font-bold text-foreground">
            Promedios por Periodo
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
  
  // Conditionally render based on data availability
  if (students === undefined || termAverages === undefined || terms === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Cargando datos de los estudiantes...</p>
        </div>
      </div>
    );
  }

  // Check for missing data and display specific messages
  

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <h1 className="text-3xl font-bold text-foreground">
          Promedios por Periodo
        </h1>
        <Card>
          <CardContent>
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
              </div>
            </div>
          </CardContent>
        </Card>

{(students!.length === 0)? (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center p-8 text-muted-foreground">
              No hay estudiantes en esta clase.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  ):(<TermAverageMatrix
          students={students}
          averages={new Map(Object.entries(termAverages))}
          terms={terms}
        />)}
      </div>
    </div>
  );
}