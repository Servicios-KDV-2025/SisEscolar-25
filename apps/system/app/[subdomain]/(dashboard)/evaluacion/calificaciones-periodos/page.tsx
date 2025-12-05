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
    isLoading: permissionsLoading,
  } = permissions;

  // Restricción: Solo teachers pueden actualizar promedios de periodo
  const canTeacherUpdateTermAverage = permissions.canUpdateTermAverage && permissions.currentRole === 'teacher';

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

  // 1. Efecto para inicializar el Ciclo Escolar
  useEffect(() => {
    if (schoolCycles && schoolCycles.length > 0 && !selectedSchoolCycle) {
      console.log("Buscando ciclo activo en:", schoolCycles);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const activeCycle = schoolCycles.find((c: any) => {
        if (c.active === true) return true;
        if (c.isActive === true) return true;
        if (c.isCurrent === true) return true;
        if (c.current === true) return true;
        if (String(c.active) === "true") return true;
        if (String(c.isActive) === "true") return true;
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

  // 3. Efecto para manejar cambio de ciclo escolar
  useEffect(() => {
    if (selectedSchoolCycle) {
      // Resetear la selección de clase cuando cambia el ciclo
      setSelectedClass("");

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

    for (const student of students) {
      const studentClassId = student._id;
      const finalAverage = calculateAnnualAverage(studentClassId);

      if (finalAverage !== null) {
        try {
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

    const studentAverages = allTermAverages[studentClassId];

    if (!studentAverages || studentAverages.length === 0) {
      return null;
    }

    let totalScoreSum = 0;
    let validTermsCount = 0;

    studentAverages.forEach((avg) => {
      if (avg.averageScore !== null && avg.averageScore !== undefined) {
        totalScoreSum += avg.averageScore;
        validTermsCount++;
      }
    });

    if (validTermsCount === 0) {
      return null;
    }

    return Math.round(totalScoreSum / validTermsCount);
  };

  // Handle loading state
  const isDataLoading =
    classes === undefined ||
    terms === undefined ||
    schoolCycles === undefined ||
    students === undefined ||
    allTermAverages === undefined;
    
  const isInitialLoading = userLoading || schoolLoading || permissionsLoading;

  const handleUpdateGrade = async (
    studentClassId: string,
    termId: string,
    averageScore: number | null,
    comment: string
  ) => {
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

  const hasSchoolCycles = schoolCycles && schoolCycles.length > 0;
  const hasClasses = classes && classes.length > 0;
  const hasTerms = terms && terms.length > 0;
  const hasStudents = students && students.length > 0;

  const selectedCycle = schoolCycles?.find(c => c._id === selectedSchoolCycle);
  const selectedCycleStatus = selectedCycle?.status;
  const canUpdateAveragesWithCycle = permissions.hasPermissionWithCycleCheck("update:termAverages", selectedCycleStatus);

  const averagesMap = new Map();
  if (allTermAverages) {
    Object.entries(allTermAverages).forEach(([studentClassId, avgArray]) => {
      averagesMap.set(studentClassId, avgArray);
    });
  }

  if (isInitialLoading) {
    return <GeneralDashboardSkeleton nc={0} />;
  }

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
                          {cycle.status === "inactive" && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs ml-1">
                              Inactivo
                            </Badge>
                          )}
                          {cycle.status === "active" && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs ml-1">
                              Activo
                            </Badge>
                          )}
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
                    {terms?.length || 0} periodos
                  </Badge>
                )}
              </div>
            </CardTitle>
            {canTeacherUpdateTermAverage ? (
              <Button
                onClick={handleSaveAverages}
                size="lg"
                className="gap-2"
                disabled={!currentSchool || !canUpdateAveragesWithCycle}
              >
                <SaveAll className="w-4 h-4" />
                Guardar promedios
              </Button>
            ) : (
              <Badge
                variant="outline"
                className="bg-black-50 text-black-700 border-black-200 w-fit"
              >
                {terms?.length || 0} periodos
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isDataLoading ? (
            <div className="space-y-4 text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Cargando calificaciones...</p>
            </div>
          ) : (hasStudents && hasTerms && hasClasses) ? (
            <TermAverageMatrix
              key={selectedSchoolCycle}
              students={filteredAndSortedStudents}
              terms={terms!}
              averages={averagesMap}
              onAverageUpdate={handleUpdateGrade}
              canUpdateRubric={canTeacherUpdateTermAverage && canUpdateAveragesWithCycle}
            />
          ) : (
            <div className="flex justify-center">
              <div className="space-y-4 text-center">
                <BookCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No se pueden mostrar las calificaciones
                </h3>
                {selectedCycleStatus && selectedCycleStatus !== "active" ? (
                  <div className="space-y-3">
                    <p className="text-muted-foreground">
                      Este ciclo está {selectedCycleStatus === "archived" ? "archivado" : "inactivo"}.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Selecciona una clase para ver los datos históricos.
                    </p>
                  </div>
                ) : !selectedClass ? (
                  <p className="text-muted-foreground">
                    Selecciona una clase para ver las calificaciones.
                  </p>
                ) : (
                  <>
                    <p className="text-muted-foreground">Registra:</p>
                    <div className="flex flex-col gap-3 items-center">
                      {!hasStudents && (
                        <Link href={`/administracion/asignacion-de-clases`}>
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Estudiantes en esta clase
                          </Button>
                        </Link>
                      )}
                      {!hasTerms && (
                        <Link href={`/administracion/periodos`}>
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Periodos en este ciclo
                          </Button>
                        </Link>
                      )}
                      {!hasClasses && (
                        <Link href={`/administracion/clases`}>
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Clases
                          </Button>
                        </Link>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}