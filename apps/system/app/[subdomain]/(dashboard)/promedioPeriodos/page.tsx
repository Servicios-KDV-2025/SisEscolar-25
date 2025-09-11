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
import { TermAverageMatrix } from "./term-average-matrix";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { api } from "@repo/convex/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { useUserWithConvex } from "../../../../stores/userStore";
import { useUser } from "@clerk/nextjs";
import { useCurrentSchool } from "../../../../stores/userSchoolsStore";
import { toast } from "sonner";

export default function GradeManagementDashboard() {
  const [selectedSchoolCycle, setSelectedSchoolCycle] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");

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

  const students = useQuery(
    api.functions.student.getStudentWithClasses,
    selectedClass
      ? { classCatalogId: selectedClass as Id<"classCatalog"> }
      : "skip"
  );
  // ✨ Este es el cambio clave: ahora obtienes promedios de todos los términos del ciclo escolar
  const allTermAverages = useQuery(
    api.functions.termAverages.getAnnualAveragesForStudents,
    selectedSchoolCycle && selectedClass
      ? {
          schoolCycleId: selectedSchoolCycle as Id<"schoolCycle">,
          classCatalogId: selectedClass as Id<"classCatalog">,
        }
      : "skip"
  );

  // Mutations
  const upsertGrade = useMutation(api.functions.termAverages.upsertTermAverage);

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

  // Handle loading state
  const isDataLoading =
    classes === undefined ||
    terms === undefined ||
    schoolCycles === undefined ||
    students === undefined ||
    allTermAverages === undefined;

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
            <p className="text-muted-foreground">Cargando información...</p>
          </div>
        </div>
      </div>
    );
  }

  // Logic to handle grade updates. This now uses the upsert mutation.
  const handleUpdateGrade = async (
    studentClassId: string,
    termId: string,
    averageScore: number | null
  ) => {
    // Only proceed if a user is logged in and the score is a number
    if (!currentUser || averageScore === null) return;

    try {
      await upsertGrade({
        studentClassId: studentClassId as Id<"studentClass">,
        termId: termId as Id<"term">,
        averageScore: averageScore,
        registeredById: currentUser._id as Id<"user">,
      });
      toast.success("Promedio actualizado correctamente.");
    } catch (error) {
      console.error("Error al actualizar la calificación:", error);
      toast.error("Hubo un error al actualizar el promedio.");
    }
  };


  // Check for missing data and display specific messages
  const hasSchoolCycles = schoolCycles && schoolCycles.length > 0;
  const hasClasses = classes && classes.length > 0;
  const hasTerms = terms && terms.length > 0;
  const hasStudents = students && students.length > 0;

  if (!hasSchoolCycles) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <h1 className="text-3xl font-bold text-foreground">
            Calificaciones por Periodo
          </h1>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center p-8">
                <p className="text-muted-foreground">Aún no has registrado:</p>
                <ul className="list-disc list-inside mt-4 inline-block text-left text-muted-foreground">
                  {!hasSchoolCycles && <li>Ciclos escolares</li>}
                  {!hasStudents && <li>Estudiantes en esta clase.</li>}
                  {!hasTerms && <li>Periodos en este ciclo</li>}
                  {!hasClasses && <li>Clases</li>}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ✨ Transformar los datos de los promedios en un Map antes de pasarlos al componente
  const averagesMap = new Map();
  if (allTermAverages) {
    Object.entries(allTermAverages).forEach(([studentClassId, avgArray]) => {
      averagesMap.set(studentClassId, avgArray);
    });
  }

  // Main UI when all data is available
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <h1 className="text-3xl font-bold text-foreground">
          Calificaciones por Periodo
        </h1>
        <Card>
          <CardContent className="py-0">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 gap-4">
                <Select
                  value={selectedSchoolCycle}
                  onValueChange={(value) => {
                    setSelectedSchoolCycle(value);
                    setSelectedClass("");
                  }}
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
                  {hasClasses && (<Select value={selectedClass} onValueChange={setSelectedClass}>
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
                </Select>)}
                
                

              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grade Matrix */}
        <Card>
          <CardContent>
            {/* Si no hay estudiantes o no hay Periodos, muestra un mensaje */}
            {hasStudents && hasTerms && hasClasses && !isDataLoading ? (
              <TermAverageMatrix
                students={students!}
                terms={terms!}
                averages={averagesMap} // ✨ PASAMOS EL MAP CORREGIDO
                onAverageUpdate={handleUpdateGrade}
              />
            ) : (
              <div className="text-center text-muted-foreground p-8">
                <p className="text-muted-foreground">Aún no has registrado:</p>
                <ul className="list-disc list-inside mt-4 inline-block text-left text-muted-foreground">
                  {!hasStudents && <li>Estudiantes en esta clase.</li>}
                  {!hasTerms && <li>Periodos en este ciclo</li>}
                  {!hasClasses && <li>Clases</li>}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
