"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
import { Filter, SaveAll, Search, Star, Plus } from "@repo/ui/icons";
import Link from "next/link";
import { TermAverageMatrix } from "../../../../../components/term-average-matrix";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { api } from "@repo/convex/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { useUserWithConvex } from "../../../../../stores/userStore";
import { useUser } from "@clerk/nextjs";
import { useCurrentSchool } from "../../../../../stores/userSchoolsStore";
import { toast } from "@repo/ui/sonner";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { BookCheck } from "lucide-react";
import { usePermissions } from 'hooks/usePermissions';
import { useCrudToastMessages } from "../../../../../hooks/useCrudToastMessages";
import { GeneralDashboardSkeleton } from "components/skeletons/GeneralDashboardSkeleton";

export default function GradeManagementDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchoolCycle, setSelectedSchoolCycle] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");

  const { user: clerkUser } = useUser();
  const { currentUser, isLoading: userLoading } = useUserWithConvex(
    clerkUser?.id
  );
  const {
    currentSchool,
    isLoading: schoolLoading,
    
  } = useCurrentSchool(currentUser?._id);

  const permissions = usePermissions(currentSchool?.school._id);

  const {
    canUpdateTermAverage,
    isLoading: permissionsLoading,
  } = permissions;

  // Restricción: Solo teachers pueden actualizar promedios de periodo
  const canTeacherUpdateTermAverage = canUpdateTermAverage && permissions.currentRole === 'teacher';

  //   Mensajes de toast personalizados
  const toastMessages = useCrudToastMessages("Calificación");

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
        teacherId: permissions.getStudentFilters().teacherId,
        tutorId: permissions.getStudentFilters().tutorId,
      }
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
      ? {
        classCatalogId: selectedClass as Id<"classCatalog">,
        canViewAll: permissions.getStudentFilters().canViewAll,
        teacherId: permissions.getStudentFilters().teacherId,
        tutorId: permissions.getStudentFilters().tutorId,
      }
      : "skip"
  );
  //   Este es el cambio clave: ahora obtienes promedios de todos los términos del ciclo escolar
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
  const updateAverage = useMutation(
    api.functions.studentsClasses.updateStudentClassAverage
  );

  // State synchronization and initial value setting
  useEffect(() => {
    setSelectedClass("");
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
    // Al cambiar el ciclo escolar, limpiamos las selecciones de clase y periodo.
    setSelectedClass("");
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
    if (!students || !currentSchool) {
      toast.error(
        <span style={{ color: '#dc2626' }}>
          Faltan datos de estudiantes o del colegio para guardar.
        </span>,
        {
          className: 'bg-white border border-red-200',
          unstyled: false,
        }
      );
      return;
    }

    const loadingToast = toast.loading("Guardando promedios finales...");

    // Recorre cada estudiante para calcular y guardar su promedio final
    for (const student of students) {
      // student.id aquí es el studentClassId que necesitamos
      const studentClassId = student._id;

      // Usamos la nueva función para calcular el promedio anual
      const finalAverage = calculateAnnualAverage(studentClassId);

      if (finalAverage !== null) {
        try {
          // Llama a la mutación que creamos para guardar en 'studentClass'
          await updateAverage({
            studentClassId: studentClassId as Id<"studentClass">,
            schoolId: currentSchool.school._id,
            averageScore: finalAverage,
          });
        } catch (error) {
          console.error(
            `Error guardando promedio final para el estudiante con ID ${student.student?._id}:`,
            error
          );
          toast.error(
            <span style={{ color: '#dc2626' }}>
              Error al guardar el promedio para {student.student?.name}.
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

    toast.dismiss(loadingToast);
    toast.success(
      <span style={{ color: '#16a34a', fontWeight: 600 }}>
        ¡Promedios finales de todos los alumnos guardados en su inscripción!
      </span>,
      {
        className: 'bg-white border border-green-200',
        unstyled: false,
      }
    );
  };

  const calculateAnnualAverage = (studentClassId: string): number | null => {
    if (!allTermAverages) return null;

    // 'allTermAverages' viene de tu query y tiene la forma { studentClassId: [avg1, avg2] }
    const studentAverages = allTermAverages[studentClassId];

    if (!studentAverages || studentAverages.length === 0) {
      return null;
    }

    let totalScoreSum = 0;
    let validTermsCount = 0;

    studentAverages.forEach((avg) => {
      // Nos aseguramos de promediar solo si hay una calificación
      if (avg.averageScore !== null && avg.averageScore !== undefined) {
        totalScoreSum += avg.averageScore;
        validTermsCount++;
      }
    });

    if (validTermsCount === 0) {
      return null;
    }

    // Devolvemos el promedio final redondeado
    return Math.round(totalScoreSum / validTermsCount);
  };

  // Handle loading state
  const isDataLoading =
    classes === undefined ||
    terms === undefined ||
    schoolCycles === undefined ||
    students === undefined ||
    allTermAverages === undefined;
  const isLoading =
    userLoading ||
    schoolLoading ||
    permissionsLoading ||
    schoolCycles === undefined ||
    classes === undefined ||
    terms === undefined ||
    students === undefined ||
    allTermAverages === undefined;

  // Show a general loading screen for initial data fetching
  // if (
  //   !isLoaded ||
  //   userLoading ||
  //   schoolLoading ||
  //   (currentUser && !currentSchool && !schoolError)
  // ) {
  //   return (
  //     <div className="space-y-8 p-6 max-w-7xl mx-auto">
  //       <div className="flex items-center justify-center min-h-[400px]">
  //         <div className="space-y-4 text-center">
  //           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
  //           <p className="text-muted-foreground">Cargando información...</p>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  // Logic to handle grade updates. This now uses the upsert mutation.
  const handleUpdateGrade = async (
    studentClassId: string,
    termId: string,
    averageScore: number | null,
    comment: string
  ) => {
    // Only proceed if a user is logged in and the score is a number
    if (!currentUser || averageScore === null) return;

    try {
      await upsertGrade({
        studentClassId: studentClassId as Id<"studentClass">,
        termId: termId as Id<"term">,
        averageScore: averageScore,
        comments: comment,
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
      console.error("Error al actualizar la calificación:", error);
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

  // Check for missing data and display specific messages
  const hasSchoolCycles = schoolCycles && schoolCycles.length > 0;
  const hasClasses = classes && classes.length > 0;
  const hasTerms = terms && terms.length > 0;
  const hasStudents = students && students.length > 0;

  // if (!hasSchoolCycles) {
  //   return (
  //     <div className="min-h-screen bg-background p-6">
  //       <div className="mx-auto max-w-7xl space-y-6">
  //         <h1 className="text-3xl font-bold text-foreground">
  //           Calificaciones por Periodo
  //         </h1>
  //         <Card>
  //           <CardContent className="pt-6">
  //             <div className="text-center p-8">
  //               <p className="text-muted-foreground">Aún no has registrado:</p>
  //               <ul className="list-disc list-inside mt-4 inline-block text-left text-muted-foreground">
  //                 {!hasSchoolCycles && <li>Ciclos escolares</li>}
  //                 {!hasStudents && <li>Estudiantes en esta clase.</li>}
  //                 {!hasTerms && <li>Periodos en este ciclo</li>}
  //                 {!hasClasses && <li>Clases</li>}
  //               </ul>
  //             </div>
  //           </CardContent>
  //         </Card>
  //       </div>
  //     </div>
  //   );
  // }

  //   Transformar los datos de los promedios en un Map antes de pasarlos al componente
  const averagesMap = new Map();
  if (allTermAverages) {
    Object.entries(allTermAverages).forEach(([studentClassId, avgArray]) => {
      averagesMap.set(studentClassId, avgArray);
    });
  }

  if (isLoading) {
    return <GeneralDashboardSkeleton nc={0} />;
  }

  // Main UI when all data is available
  return (
    <div className="space-y-8 p-6 min-w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Star className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">
                    Calificaciones por Periodo
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Administra las calificaciones de los periodos por grupo y
                    clase.
                  </p>
                </div>
              </div>
            </div>
           
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
              onValueChange={(value) => {
                setSelectedSchoolCycle(value);
                setSelectedClass("");
              }}
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
            {canTeacherUpdateTermAverage && (
              <Badge
                variant="outline"
                className="bg-black-50 text-black-700 border-black-200 w-fit"
              >
                {terms?.length} periodos
              </Badge>
            )}
            </div>
          </CardTitle>
          {canTeacherUpdateTermAverage ? (
              <Button
                onClick={handleSaveAverages}
                size="lg"
                className="gap-2"
                disabled={!currentSchool}
              >
                <SaveAll className="w-4 h-4" />
                Guardar promedios
              </Button>
            ) : (
              <Badge
                variant="outline"
                className="bg-black-50 text-black-700 border-black-200 w-fit"
              >
                {terms?.length} periodos
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Si está cargando */}
          {(
            isLoading
          ) ? (
            <div className="space-y-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Cargando promedio...</p>
            </div>
          ) : (hasStudents && hasTerms && hasClasses && !isDataLoading) ? (
            <TermAverageMatrix
              students={filteredAndSortedStudents}
              terms={terms!}
              averages={averagesMap}
              onAverageUpdate={handleUpdateGrade}
              canUpdateRubric={canTeacherUpdateTermAverage}
            />
          ) : (
            <div className="flex justify-center">
              <div className="space-y-4 text-center">
                <BookCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No se pueden mostrar las calificaciones
                </h3>
                <p className="">Registra:</p>
                <div className="flex justify-center gap-3">
                  {!hasStudents && (
                    <Link href={`/administracion/asignacion-de-clases`}>
                      <Button>
                        <Plus className="w-4 h-4" />
                        Estudiantes en esta clase
                      </Button>
                    </Link>
                  )}
                  {!hasTerms && (
                    <Link href={`/administracion/periodos`}>
                      <Button>
                        <Plus className="w-4 h-4" />
                        Periodos en este ciclo
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
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
