"use client";

import { useEffect, useMemo } from "react";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/shadcn/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/shadcn/table";
import { Switch } from "@repo/ui/components/shadcn/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { Label } from "@repo/ui/components/shadcn/label";
import { Slider } from "@repo/ui/components/shadcn/slider";
import { Badge } from "@repo/ui/components/shadcn/badge";
import {
  AlertCircle,
  AlertTriangle,
  Pencil,
  Plus,
  Trash2,
  BadgeCheck,
  CircleX,
  Filter,
  ClipboardPenLine,
} from "@repo/ui/icons";
// Importaciones de Convex
import { api } from "@repo/convex/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { Id } from "@repo/convex/convex/_generated/dataModel";

import { useCurrentSchool } from "../../../../../stores/userSchoolsStore";
import { useUser } from "@clerk/nextjs";
import { useUserWithConvex } from "../../../../../stores/userStore";
import { useGradeRubricStore } from "../../../../../stores/gradeRubricStore";
import { usePermissions } from 'hooks/usePermissions';

// Tipo para rúbricas con datos extendidos
type RubricWithDetails = {
  classCatalogName: string;
  termName: string;
  schoolCycleName: string;
  schoolCycleStatus: string;
} & {
  _id: Id<"gradeRubric">;
  _creationTime: number;
  classCatalogId: Id<"classCatalog">;
  termId: Id<"term">;
  name: string;
  weight: number;
  maxScore: number;
  createdBy: Id<"user">;
  status: boolean;
  classCatalogName?: string;
  termName?: string;
  schoolCycleName?: string;
  schoolCycleStatus?: string;
};

export default function RubricDashboard() {
  // Usar el store
  const {
    selectedSchoolCycle,
    selectedClass,
    selectedTerm,
    selectedClassSchoolCycleName,
    rubrics,
    rubricPercentage,
    isModalOpen,
    editingRubric,
    formData,

    // Acciones de filtros
    setSelectedSchoolCycle,
    setSelectedClass,
    setSelectedTerm,
    setSelectedClassSchoolCycleName,
    clearFilters,

    // Acciones del modal
    setModalOpen,
    setEditingRubric,
    setFormData,
    resetForm,

    // Cálculos
    getTotalWeight,
    getAvailableWeight,
    canActivateRubric,
    canCreateRubric,
    getValidationMessage,
    isNameDuplicate,
    getDuplicateInfo,
  } = useGradeRubricStore();

  const { user: clerkUser } = useUser();
  const { currentUser } = useUserWithConvex(clerkUser?.id);

  // Get current school information using the subdomain
  const { currentSchool, isLoading: schoolLoading } = useCurrentSchool(
    currentUser?._id
  );

  const {
    currentRole,
    canCreateRubric: canCreateRubricPermission,
    canUpdateRubric,
    canDeleteRubric,
    getStudentFilters,
    // isLoading: permissionsLoading
  } = usePermissions(currentSchool?.school._id);

  const studentFilters = useMemo(() => {
    return getStudentFilters?.() || { canViewAll: false };
  }, [getStudentFilters]);

  // Obtener el ciclo escolar activo
  const activeSchoolCycle = useQuery(
    api.functions.schoolCycles.ObtenerCicloActivo,
    currentSchool ? { escuelaID: currentSchool.school._id } : "skip"
  );

  const schoolCycles = useQuery(
    api.functions.schoolCycles.ObtenerCiclosEscolares,
    currentSchool ? { escuelaID: currentSchool.school._id } : "skip"
  );

  const classes = useQuery(
    api.functions.classCatalog.getAllClassCatalog,
    currentSchool ? {
      schoolId: currentSchool?.school._id as Id<'school'>,
      canViewAll: studentFilters.canViewAll,
      teacherId: studentFilters.teacherId,
      tutorId: studentFilters.tutorId,
    } : 'skip'
  );

  const terms = useQuery(
    api.functions.terms.getTermsByCycleId,
    selectedSchoolCycle
      ? { schoolCycleId: selectedSchoolCycle as Id<"schoolCycle"> }
      : "skip"
  );

  // Consulta para obtener todas las rúbricas cuando no hay filtros específicos
  const allRubricsQuery = useQuery(
    api.functions.gradeRubrics.getAllGradeRubricsBySchool,
    (currentSchool && selectedSchoolCycle)
      ? {
        schoolId: currentSchool.school._id,
        schoolCycleId: selectedSchoolCycle as Id<"schoolCycle">,
        canViewAll: studentFilters.canViewAll,
        teacherId: studentFilters.teacherId,
        tutorId: studentFilters.tutorId,
      }
      : "skip"
  );

  // Consulta para obtener rúbricas filtradas cuando se seleccionan filtros específicos
  const filteredRubricsQuery = useQuery(
    api.functions.gradeRubrics.getGradeRubricByClassAndTerm,
    selectedClass && selectedTerm
      ? {
        classCatalogId: selectedClass as Id<"classCatalog">,
        termId: selectedTerm as Id<"term">,
        canViewAll: studentFilters.canViewAll,
        teacherId: studentFilters.teacherId,
        tutorId: studentFilters.tutorId,
      }
      : "skip"
  );

  // Consulta para obtener el porcentaje de rúbricas por clase y período
  const rubricPercentageQuery = useQuery(
    api.functions.gradeRubrics.getRubricPercentageByClassAndTerm,
    selectedClass && selectedTerm
      ? {
        classCatalogId: selectedClass as Id<"classCatalog">,
        termId: selectedTerm as Id<"term">,
        canViewAll: studentFilters.canViewAll,
        teacherId: studentFilters.teacherId,
        tutorId: studentFilters.tutorId,
      }
      : "skip"
  );

  // Sincronizar datos con el store
  useEffect(() => {
    if (allRubricsQuery !== undefined) {
      useGradeRubricStore.getState().setAllRubrics(allRubricsQuery);
    }
  }, [allRubricsQuery]);

  useEffect(() => {
    if (filteredRubricsQuery !== undefined) {
      useGradeRubricStore.getState().setFilteredRubrics(filteredRubricsQuery);
    }
  }, [filteredRubricsQuery]);

  useEffect(() => {
    if (rubricPercentageQuery !== undefined) {
      useGradeRubricStore.getState().setRubricPercentage(rubricPercentageQuery);
    }
  }, [rubricPercentageQuery]);

  // Determinar qué rúbricas mostrar
  useEffect(() => {
    const currentRubrics =
      selectedClass && selectedTerm ? filteredRubricsQuery : allRubricsQuery;
    if (currentRubrics !== undefined) {
      useGradeRubricStore.getState().setRubrics(currentRubrics);
    }
  }, [selectedClass, selectedTerm, filteredRubricsQuery, allRubricsQuery]);

  // Establecer el ciclo activo como valor inicial
  useEffect(() => {
    if (activeSchoolCycle && !selectedSchoolCycle) {
      setSelectedSchoolCycle(activeSchoolCycle._id as string);
    }
  }, [activeSchoolCycle, selectedSchoolCycle, setSelectedSchoolCycle]);

  // Ajustar automáticamente el valor del slider cuando el porcentaje disponible sea menor
  useEffect(() => {
    // Solo ejecutar cuando hay datos de formulario y porcentaje disponible
    if (formData.class && formData.term) {
      const availableWeight = getAvailableWeight();
      if (availableWeight !== null && (formData.weight[0] || 0) > availableWeight) {
        setFormData({ weight: [availableWeight] });
      }
    }
  }, [formData.class, formData.term, formData.weight, setFormData, getAvailableWeight]);

  // Función para manejar el cambio de clase
  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);

    // Buscar la clase seleccionada y obtener el nombre del ciclo escolar
    const selectedClassData = classes?.find((clase) => clase._id === classId);
    if (selectedClassData?.schoolCycle) {
      setSelectedClassSchoolCycleName(selectedClassData.schoolCycle.name);
    } else {
      setSelectedClassSchoolCycleName("");
    }
  };

  const createGradeRubric = useMutation(
    api.functions.gradeRubrics.createGradeRubric
  );
  const updateGradeRubric = useMutation(
    api.functions.gradeRubrics.updateGradeRubric
  );
  const deleteGradeRubric = useMutation(
    api.functions.gradeRubrics.deleteGradeRubric
  );

  const handleOpenModal = (rubric?: RubricWithDetails) => {
    if (rubric) {
      setEditingRubric(rubric);
    } else {
      resetForm();
      // Obtener el nombre del ciclo escolar activo
      const activeCycleName = schoolCycles?.find(cycle => cycle._id === selectedSchoolCycle)?.name || "Ciclo Escolar";
      setFormData({
        schoolCycle: activeCycleName,
        class: selectedClass || "",
        term: selectedTerm || "",
      });
    }
    setModalOpen(true);
  };

  // La baja lógica ahora se maneja con la mutación de actualización
  const handleToggleStatus = async (
    rubricId: Id<"gradeRubric">,
    currentStatus: boolean
  ) => {
    // Si se está intentando activar (currentStatus es false)
    if (!currentStatus) {
      const rubricToActivate = rubrics.find((r) => r._id === rubricId);
      if (!rubricToActivate) return;
    }

    await updateGradeRubric({
      gradeRubricId: rubricId,
      data: {
        status: !currentStatus,
        createdBy: currentUser!._id as Id<"user">,
      },
    });
  };

  const handleSaveRubric = async () => {
    // Aseguramos que los IDs de clase y periodo existan antes de guardar
    if (!formData.class || !formData.term) {
      console.error("Clase y Periodo son obligatorios.");
      return;
    }

    const numericWeight = (formData.weight[0] ?? 0) / 100;

    if (editingRubric) {
      await updateGradeRubric({
        gradeRubricId: editingRubric._id,
        data: {
          name: formData.name,
          // Convertir el porcentaje del slider a decimal para Convex
          weight: numericWeight,
          maxScore: formData.maxScore,
          status: true, // Asumimos que la edición la activa
          createdBy: currentUser?._id as Id<"user">,
          classCatalogId: formData.class as Id<"classCatalog">,
          termId: formData.term as Id<"term">,
        },
      });
    } else {
      await createGradeRubric({
        classCatalogId: formData.class as Id<"classCatalog">,
        termId: formData.term as Id<"term">,
        name: formData.name,
        // Convertir el porcentaje del slider a decimal
        weight: numericWeight,
        maxScore: formData.maxScore,
        status: true,
        createdBy: currentUser!._id,
      });
    }
    setModalOpen(false);
    resetForm();
  };

  const handleDeleteRubric = async (id: Id<"gradeRubric">) => {
    await deleteGradeRubric({ gradeRubricId: id });
  };

  // Usar las funciones del store
  const totalWeight = getTotalWeight();
  const availableWeight = getAvailableWeight();
  const validationMessage = getValidationMessage();
  const nameDuplicate = isNameDuplicate(formData.name, editingRubric?._id);
  const duplicateInfo = getDuplicateInfo(formData.name, editingRubric?._id);

  // Solo mostrar porcentaje en la vista general cuando hay filtros específicos
  const shouldShowPercentage =
    selectedClass && selectedTerm && totalWeight !== null;

  // Siempre mostrar validaciones en el formulario cuando hay datos
  const shouldShowFormValidation = !!(formData.class && formData.term);

  return (
    <div className="space-y-8 p-6">
      {/* Encabezado */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl" >
                  <ClipboardPenLine className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">
                    Rúbricas
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Administra las rúbricas de calificaciones
                  </p>
                </div>
              </div>
            </div>
            {canCreateRubricPermission &&
              <Button
                onClick={() => handleOpenModal()}
                className="gap-2 cursor-pointer"
                disabled={false}
              >
                <Plus className="w-4 h-4" />
                Agregar Rubrica
              </Button>
            }
          </div>
        </div>
      </div>


      {/* Filtros  */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="w-full flex flex-col md:flex-row items-center">
              <div className="flex flex-col flex-1">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros de búsqueda
                </CardTitle>
                <CardDescription>
                  Encuentra rúbricas por ciclo escolar, clase o periodo
                </CardDescription>
              </div>
              <div className="w-full md:w-auto flex items-center justify-center mt-4 h-full">
                <div className="w-full flex flex-col gap-4 md:flex-row md:justify-end">
                  {/* Select para filtrar por School Cycle - solo este tiene valor inicial */}
                  <Select
                    value={selectedSchoolCycle}
                    onValueChange={setSelectedSchoolCycle}
                  >
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Ciclo Escolar" />
                    </SelectTrigger>
                    <SelectContent>
                      {schoolCycles?.map((cycle) => (
                        <SelectItem key={cycle._id} value={cycle._id as string}>
                          {cycle.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Select para filtrar por Clase - sin valor inicial */}
                  <Select value={selectedClass} onValueChange={handleClassChange}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Todas las clases" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes
                        ?.filter(
                          (clase) =>
                            !selectedSchoolCycle ||
                            clase.schoolCycleId === selectedSchoolCycle
                        )
                        .map((clase) => (
                          <SelectItem key={clase._id} value={clase._id as string}>
                            {clase.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {/* Select para filtrar por Periodo - sin valor inicial */}
                  <Select
                    value={selectedTerm}
                    onValueChange={setSelectedTerm}
                    disabled={!selectedSchoolCycle}
                  >
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Todos los periodos" />
                    </SelectTrigger>
                    <SelectContent>
                      {terms?.map((term) => (
                        <SelectItem key={term._id} value={term._id as string}>
                          {term.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Botón para limpiar filtros */}
                  {(selectedClass || selectedTerm) && (
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="gap-2 cursor-pointer w-full md:w-auto"
                    >
                      Limpiar Filtros
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Alertas de porcentaje - solo cuando hay filtros específicos */}
      {shouldShowPercentage && rubricPercentage && (
        <div>
          {rubricPercentage.totalPercentage === 100 ? (
            <Card className="py-3">
              <CardContent className="text-muted-foreground text-sm font-semibold flex flex-row gap-2 justify-center">
                <BadgeCheck className="h-5 text-green-600" />

                <p>
                  Porcentaje completo: <Badge variant="outline" className="font-semibold bg-green-600 text-white">{rubricPercentage.totalPercentage}%</Badge>
                </p>
              </CardContent>
            </Card>
          ) : rubricPercentage.totalPercentage > 100 ? (
            <Card className="py-3">
              <CardContent className="text-muted-foreground text-sm font-semibold flex flex-row gap-2 justify-center">
                <CircleX className="h-5 text-red-400" />
                <p>
                  Porcentaje excedido: <Badge variant="outline" className="font-semibold bg-red-400 text-white">{rubricPercentage.totalPercentage}%</Badge>
                  <span className="ml-2">(máximo <Badge variant="outline" className="font-semibold bg-red-400 text-white">100%</Badge>) </span>
                </p>
              </CardContent>
            </Card>
          ) : rubricPercentage.totalPercentage >= 90 ? (
            <Card className="py-3">
              <CardContent className="text-muted-foreground text-sm font-semibold flex flex-row gap-2 justify-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <p>
                  Cerca del límite: <Badge variant="outline" className="font-semibold bg-yellow-600 text-white">{rubricPercentage.totalPercentage}%</Badge>
                  <span className="ml-2">(quedan <Badge variant="outline" className="font-semibold bg-yellow-600 text-white">{rubricPercentage.availablePercentage}%</Badge>)</span>
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="py-3">
              <CardContent className="text-muted-foreground text-sm font-semibold flex flex-row gap-2 justify-center">
                <AlertCircle className="h-5 text-blue-600" />
                <p>
                  Porcentaje actual: <Badge variant="outline" className="font-semibold bg-blue-600 text-white">{rubricPercentage.totalPercentage}%</Badge>
                  <span className="ml-2">(disponible: <Badge variant="outline" className="font-semibold bg-blue-600 text-white">{rubricPercentage.availablePercentage}%</Badge>)</span>
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!shouldShowPercentage && (
        <div>
          <Card className="py-3">
            <CardContent className="text-blue-600 text-sm font-semibold flex flex-row gap-2 justify-center">
              <AlertCircle className="h-5" />
              <p>
                Vista general: Muestra todas las rúbricas del ciclo.
                Selecciona una clase y período específicos para ver el cálculo
                de porcentaje por materia
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rubrics Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Rubricas</span>
            <Badge variant="outline">{rubrics.length} rubricas</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(
            schoolLoading ||
            rubrics === undefined ||
            classes === undefined ||
            schoolCycles === undefined
          ) ? (
            <div className="space-y-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Cargando rúbricas...</p>
            </div>
          ) :
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Ciclo Escolar</TableHead>
                    <TableHead>Clase</TableHead>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Porcentaje</TableHead>
                    <TableHead>Calificacion Maxima</TableHead>
                    {canCreateRubricPermission && <TableHead>Estado</TableHead>}
                    {/* <TableHead className="text-right">Acciones</TableHead> */}
                    {(rubrics.some((r) => r.schoolCycleStatus === "active") && canCreateRubricPermission) && (
                      <TableHead className="text-right">Acciones</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rubrics.length > 0 ? (
                    rubrics.map((rubric) => (
                      <TableRow key={rubric._id}>
                        <TableCell className="font-medium">
                          {rubric.name}
                        </TableCell>
                        <TableCell>
                          {(rubric as RubricWithDetails).schoolCycleName || "—"}
                        </TableCell>
                        <TableCell>{rubric.classCatalogName || "—"}</TableCell>
                        <TableCell>{rubric.termName || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {Math.round(rubric.weight * 100)}%
                          </Badge>
                        </TableCell>
                        <TableCell>{rubric.maxScore}</TableCell>
                        <TableCell>
                          {canCreateRubricPermission &&
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={rubric.status}
                                onCheckedChange={() =>
                                  handleToggleStatus(rubric._id, rubric.status)
                                }
                                disabled={
                                  (!rubric.status &&
                                    !canActivateRubric(rubric._id)) ||
                                  (rubric as RubricWithDetails)
                                    .schoolCycleStatus !== "active"
                                }
                              />
                              {!rubric.status && !canActivateRubric(rubric._id) && (
                                <div className="relative group">
                                  <AlertTriangle className="h-4 w-4 text-destructive cursor-help" />
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                    No se puede activar: excedería el 100%
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                  </div>
                                </div>
                              )}
                              {(rubric as RubricWithDetails).schoolCycleStatus !==
                                "active" && (
                                  <div className="relative group">
                                    <AlertTriangle className="h-4 w-4 text-muted-foreground cursor-help" />
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                      Ciclo escolar inactivo
                                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                    </div>
                                  </div>
                                )}
                            </div>
                          }

                        </TableCell>
                        {((rubric as RubricWithDetails).schoolCycleStatus ===
                          "active" && canCreateRubricPermission) && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {canUpdateRubric && <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenModal(rubric as RubricWithDetails)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>}
                                {canDeleteRubric && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteRubric(rubric._id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={
                          rubrics.some((r) => r.schoolCycleStatus === "active")
                            ? 8
                            : 7
                        }
                        className="text-center py-12"
                      >
                        <div className="flex flex-col items-center justify-center space-y-4">

                          <ClipboardPenLine className="h-12 w-12 text-muted-foreground mx-auto mb-4" />

                          <div className="space-y-2 text-center">
                            <h3 className="text-lg font-medium text-foreground mb-2">
                              No se encontraron rúbricas
                            </h3>
                            {currentRole !== 'tutor' ? <p className="text-muted-foreground mb-4">
                              No hay rúbricas creadas. Crea tu primera rúbrica para comenzar a calificar.
                            </p> : <>
                              <p className="text-muted-foreground">Aún no se han asignado rúbricas al alumno.</p>
                              <p className="text-muted-foreground">Si al alumno ya cuenta con rubricas asignada y no se ve información comunicate con soporte.</p>
                            </>
                            }
                          </div>
                          {canCreateRubricPermission && (
                            <Button
                              onClick={() => handleOpenModal()}
                              className="gap-2 cursor-pointer"
                              disabled={false}
                            >
                              <Plus className="h-4 w-4" />
                              Agregar Rúbrica
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          }
        </CardContent>
      </Card>

      {/* Modal Form */}
      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRubric ? "Editar Rubrica" : "Nueva Rubrica"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 ">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                maxLength={30}
                onChange={(e) => setFormData({ name: e.target.value })}
                placeholder="Nombre de Rubrica"
              />
              

              {nameDuplicate && (
                <div className="text-sm text-destructive p-1 flex justify-center items-center gap-2">
                  <div className="text-center flex flex-col gap-2 justify-center items-center">
                    <AlertTriangle className="h-5 w-5" />
                    <p>Ya existe una rúbrica con este nombre en la misma clase y período.</p>
                    {duplicateInfo.duplicateRubric && (
                      <p className="text-xs text-muted-foreground mt-1 text-center">
                        Rúbrica existente: {duplicateInfo.duplicateRubric.name}
                        {duplicateInfo.duplicateRubric.classCatalogName && ` (${duplicateInfo.duplicateRubric.classCatalogName})`}
                        {duplicateInfo.duplicateRubric.termName && ` - ${duplicateInfo.duplicateRubric.termName}`}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            {!shouldShowFormValidation && (
                <div className=" text-sm mt-2 text-blue-600 flex flex-row justify-center items-center">
                  <AlertCircle className="h-5 text-blue-600" />
                  <p className="p-2">
                    Selecciona una clase y después el período para 
                    asignar el porcentaje disponible
                  </p>
                </div>
              )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schoolCycle">Ciclo Escolar</Label>
                <Input
                  value={
                    formData.schoolCycle ||
                    (formData.class ? selectedClassSchoolCycleName : "Ciclo Escolar")
                  }
                  readOnly={true}
                  disabled={true}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class">Clase</Label>
                <Select
                  value={formData.class}
                  onValueChange={(value) => {
                    setFormData({ class: value });
                    // También actualizar el nombre del ciclo escolar en el formulario
                    const selectedClassData = classes?.find(
                      (clase) => clase._id === value
                    );
                    if (selectedClassData?.schoolCycle) {
                      setSelectedClassSchoolCycleName(
                        selectedClassData.schoolCycle.name
                      );
                    }
                  }}
                >
                  <SelectTrigger className="w-full truncate">
                    <SelectValue placeholder="Selecciona una Clase" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes
                      ?.filter(
                        (clase) => clase.schoolCycle?.status === "active"
                      )
                      .map((clase) => (
                        <SelectItem
                          key={clase._id}
                          value={clase._id as string}
                          className="truncate"
                        >
                          <span className="truncate block">{clase.name}</span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="term">Periodo</Label>
                <Select
                  value={formData.term}
                  onValueChange={(value) => setFormData({ term: value })}
                >
                  <SelectTrigger className="w-full truncate">
                    <SelectValue placeholder="Selecciona un Periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      // Buscar la clase seleccionada en el formulario
                      const selectedClassData = classes?.find(
                        (clase) => clase._id === formData.class
                      );
                      // Tomar el ciclo escolar de la clase seleccionada en el formulario
                      const formSchoolCycleId =
                        selectedClassData?.schoolCycleId ||
                        formData.schoolCycle;

                      return terms
                        ?.filter((term) =>
                          formSchoolCycleId
                            ? term.schoolCycleId === formSchoolCycleId
                            : true
                        )
                        .map((term) => (
                          <SelectItem
                            key={term._id}
                            value={term._id as string}
                            className="truncate"
                          >
                            <span className="truncate block">{term.name}</span>
                          </SelectItem>
                        ));
                    })()}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxScore">Calificación máxima (100)</Label>
                <Input
                  id="maxScore"
                  type="number"
                  value={formData.maxScore}
                  onChange={(e) =>
                    setFormData({
                      maxScore: Number.parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="Ingresa la calificación máxima"
                  min="1"
                  max="100"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="px-3">
                {(() => {
                  const maxAllowed = (() => {
                    // Si se está editando una rúbrica
                    if (editingRubric) {
                      if (shouldShowFormValidation && availableWeight !== null) {
                        // El availableWeight ya incluye el porcentaje que liberaría la rúbrica actual
                        return Math.min(100, availableWeight);
                      } else {
                        // Si no hay validaciones, permitir hasta 100%
                        return 100;
                      }
                    }
                    // Si se está creando una nueva rúbrica
                    if (shouldShowFormValidation && availableWeight !== null) {
                      return Math.min(100, availableWeight);
                    }
                    return 100;
                  })();

                  return (
                    <>
                      <Label className="mb-2">
                        Porcentaje {" "}
                        {shouldShowFormValidation && availableWeight !== null
                          ? `(Disponible: ${availableWeight}%)`
                          : ""}
                      </Label>
                      {shouldShowFormValidation &&
                        availableWeight !== null && (
                          <div className="flex justify-center text-sm mt-1 text-muted-foreground mb-2">
                            {availableWeight === 0 &&
                              "No hay porcentaje disponible"}
                            {availableWeight < (formData.weight[0] || 0) &&
                              availableWeight > 0 &&
                              `Máximo permitido: ${maxAllowed}%`}
                          </div>
                        )}
                      <Slider
                        value={formData.weight}
                        onValueChange={(value) => {
                          // Limitar el valor al máximo permitido
                          const limitedValue = Math.min(value[0] || 0, maxAllowed);
                          setFormData({ weight: [limitedValue] });
                        }}
                        max={maxAllowed}
                        min={0}
                        step={5}
                        className="w-full"
                        disabled={
                          !!(
                            shouldShowFormValidation &&
                            availableWeight !== null &&
                            availableWeight === 0 &&
                            !editingRubric
                          )
                        }
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>0%</span>
                        <span className="flex justify-center text-black text-xl font-bold">
                          {formData.weight[0] || 0}%
                        </span>
                        <span>{maxAllowed}%</span>
                      </div>
                      {validationMessage && (
                        <div
                          className={`text-center text-sm mt-2 ${validationMessage.includes("No se puede")
                            ? "text-destructive"
                            : validationMessage.includes("⚠️")
                              ? "text-yellow-600"
                              : "text-blue-600"
                            }`}
                        >
                          {validationMessage}
                        </div>
                      )}
                      {(formData.weight[0] || 0) <= 0 && (
                        <div className="text-center text-sm mt-2 text-destructive flex flex-row gap-2 justify-center">
                          <AlertTriangle className="h-5 text-destructive" />
                          <p>El porcentaje debe ser mayor a 0%</p>
                        </div>
                      )}

                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveRubric}
              disabled={
                !formData.name.trim() ||
                formData.maxScore > 100 ||
                formData.maxScore <= 0 ||
                !formData.class ||
                !!nameDuplicate ||
                !formData.term ||
                (formData.weight[0] || 0) <= 0 ||
                !!(
                  shouldShowFormValidation &&
                  availableWeight !== null &&
                  !canCreateRubric() &&
                  !editingRubric
                )
              }
            >
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
