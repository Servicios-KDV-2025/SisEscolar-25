"use client";

import { useEffect, useMemo } from "react";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/shadcn/card";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@repo/ui/components/shadcn/select";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@repo/ui/components/shadcn/table";
import { Switch } from "@repo/ui/components/shadcn/switch"
import { Label } from "@repo/ui/components/shadcn/label";
import { Slider } from "@repo/ui/components/shadcn/slider";
import { Badge } from "@repo/ui/components/shadcn/badge";
import {AlertCircle, AlertTriangle, Pencil, Plus, Trash2, BadgeCheck, CircleX, Filter, ClipboardPenLine,} from "@repo/ui/icons";
// Importaciones de Convex
import { api } from "@repo/convex/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { Id } from "@repo/convex/convex/_generated/dataModel";

import { useCurrentSchool } from "../../../../../stores/userSchoolsStore";
import { useUser } from "@clerk/nextjs";
import { useUserWithConvex } from "../../../../../stores/userStore";
import {  useGradeRubricStore } from "../../../../../stores/gradeRubricStore";
import { usePermissions } from 'hooks/usePermissions';
import { CrudDialog, useCrudDialog, WithId } from "@repo/ui/components/dialog/crud-dialog";
import { RubricFormValues, rubricSchema } from "schema/rubric"
import { toast } from "sonner"
import { FormField, FormLabel } from "@repo/ui/components/shadcn/form";
import { SelectPopover } from "components/selectPopover";
import { ClassCatalog, useClassCatalogWithPermissions } from "stores/classCatalogStore";
import { Term } from "stores/termStore";
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
    rubrics,
    rubricPercentage,
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

  const {
    isOpen,
    operation,
    data,
    openCreate,
    openEdit,
    openDelete,
    close
  } = useCrudDialog(rubricSchema, {
    name: "",
    weight: [0],
    maxScore: 100,
    class: "",
    term: "",
    }
  );

  const { classCatalogs } = useClassCatalogWithPermissions(
    currentSchool?.school._id,
    getStudentFilters
  )

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
   if (isOpen && operation === 'edit' && data?._id) {
    // Buscar la rúbrica a editar
    const rubricToEdit = rubrics.find(r => r._id === data._id);
    if (rubricToEdit) {
      setEditingRubric(rubricToEdit);
    }
  } else if (isOpen && operation === 'create') {
    // Para creación, resetear
    setEditingRubric(null);
  }
}, [isOpen, operation, data, rubrics, setEditingRubric])

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

  useEffect(() => {
    if (activeSchoolCycle && !formData.schoolCycle) {
      const activeCycleName = schoolCycles?.find(cycle => cycle._id === activeSchoolCycle._id)?.name || "Ciclo Escolar";
      setFormData({
        schoolCycle: activeCycleName,
      });
    }
  }, [activeSchoolCycle, schoolCycles, formData.schoolCycle, setFormData])
  // Ajustar automáticamente el valor del slider cuando el porcentaje disponible sea menor
  useEffect(() => {
    // Solo ejecutar cuando hay datos de formulario y porcentaje disponible
    if (formData.class && formData.term) {
      const availableWeight = getAvailableWeight();
      if (availableWeight !== null && (formData.weight[0] || 0) > availableWeight) {
        setFormData({ weight: [availableWeight] });
      }
    }
  }, [formData.class, formData.term, formData.weight, setFormData, getAvailableWeight])
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

  const handleSaveRubric = async (data: Record<string, unknown> ) => {
    const formData = data as RubricFormValues

    const name = formData.name
    const weightArray = formData.weight
    const weight = weightArray[0] ?? 0
    const maxScore = formData.maxScore
    const classCatalogId = formData.class as Id<"classCatalog">
    const termId = formData.term as Id<"term">
    // Aseguramos que los IDs de clase y periodo existan antes de guardar
    if (!classCatalogId || !termId) {
      toast.error("Clase y Periodo son obligatorios.");
      return;
    }

    const numericWeight = weight / 100;

    try {
      if (operation === 'edit') {
        await updateGradeRubric({
          gradeRubricId: editingRubric?._id as Id<'gradeRubric'>,
          data: {
            name,
            weight: numericWeight,// Convertir el porcentaje del slider a decimal para Convex
            maxScore,
            status: true, // Asumimos que la edición la activa
            createdBy: currentUser?._id as Id<"user">,
            classCatalogId,
            termId,
          },
        });
        toast.success('Rúbrica actualizada correctamente')
      } else if (operation === 'create') {
        await createGradeRubric({
          classCatalogId,
          termId,
          name,
          weight: numericWeight,// Convertir el porcentaje del slider a decimal
          maxScore,
          status: true,
          createdBy: currentUser!._id,
        })
        toast.success('Rúbrica creada correctamente')
      } else {
        throw new Error('Operación no valida')
      }
      close()
      resetForm()
    } catch (error) {
      console.log('Error al guardar la rúbrica:', error)
      toast.error('Ocurrió un error al guardar la rúbrica. Por favor, intenta de nuevo.')
    }
    // setModalOpen(false);
    // resetForm();
  }

  const handleDeleteRubric = async (id: string) => {
    try {
      await deleteGradeRubric({ gradeRubricId: id as Id<'gradeRubric'>})
      toast.success('Rúbrica eliminada correctamente')
      close()
    } catch (error) {
      console.error('Error al eliminar la rúbrica:', error)
      toast.error('Error al eliminar rúbrica')
    }
  }
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
                onClick={() => {
                  // Resetear el formulario con el ciclo activo antes de abrir
                  const activeCycleName = schoolCycles?.find(cycle => cycle._id === activeSchoolCycle?._id)?.name || "Ciclo Escolar";
                  resetForm();
                  setFormData({
                    schoolCycle: activeCycleName,
                    class: "",
                    term: "",
                    name: '',
                    weight: [0],
                    maxScore: 100
                  });
                  openCreate()
                }}//{() => handleOpenModal()}
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
                                  onClick={
                                    () => openEdit({
                                      ...rubric,
                                      _id: rubric._id,
                                      weight: [Math.round(rubric.weight*100)],
                                      class: rubric.classCatalogId as string,
                                      term: rubric.termId as string,
                                      schoolCycle: (rubric as RubricWithDetails).schoolCycleName || ""
                                    } as Record<string, unknown> & Partial<WithId> )
                                  }
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>}
                                {canDeleteRubric && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openDelete({
                                      _id: rubric._id,
                                      name: rubric.name
                                      } as Record<string, unknown> & Partial<WithId>)
                                    }
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

      <CrudDialog
        isOpen={isOpen}
        operation={operation}
        title={
          operation === 'create' ? 'Nueva Rubrica' :
          operation === 'edit' ? 'Editar Rúbrica' : 'Ver Rúbrica'
        }
        description={
          operation === 'create' ? 'Completa los campos para crear una nueva rúbrica.' :
          operation === 'edit' ? 'Modifica los campos para actualizar la rúbrica.' : 'Detalles de la rúbrica.'
        }
        schema={rubricSchema}
        data={data}
        onOpenChange={close}
        onSubmit={handleSaveRubric}
        onDelete={handleDeleteRubric}
        submitButtonText={operation === 'create' ? 'Crear Rúbrica' : 'Actualizar Rúbrica'}
        deleteConfirmationTitle="¿Estas seguro de eliminar esta rúbrica?"
        deleteConfirmationDescription="Esta acción no se puede deshacer. Se eliminarán todos los datos asociados a esta rúbrica."
      >
        {(form, operation) => {
          return(
          <div className="space-y-4 py-4">
            {/* Nombre */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <div className="space-y-2">
                    <FormLabel htmlFor="name">Nombre</FormLabel>
                    <Input
                      id="name"
                      value={field.value as string || ''}
                      maxLength={30}
                      onChange={
                        // field.onChange
                        (e) => {
                          field.onChange(e.target.value)
                          setFormData({ name: e.target.value})
                        }
                      }
                      placeholder="Nombre de Rúbrica"
                      disabled={operation === 'view'}
                    />
            
                    {nameDuplicate && (
                      <div className="text-sm text-destructive p-1 flex justify-center items-center gap-2">
                        <div className="text-center flex flex-col gap-2 justify-center items-center">
                          <AlertTriangle className="h-5 w-5"/>
                          <p>Ya existe una rúbrica con este nombre en esta clase y período</p>
                          {duplicateInfo.duplicateRubric && (
                            <p className="text-sx text-muted-foreground mt-1 text-center">
                              Rúbrica existente: {duplicateInfo.duplicateRubric.name}
                              {duplicateInfo.duplicateRubric.classCatalogName && `(${duplicateInfo.duplicateRubric.classCatalogName})`}
                              {duplicateInfo.duplicateRubric.termName && ` - ${duplicateInfo.duplicateRubric.termName}`}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              />
              {/* Información cuando no hay validaciones */}
              {!shouldShowFormValidation && (
                <div className="text-sm mt-2 text-blue-600 flex flex-row justify-center items-center">
                  <AlertCircle className="h-5 text-blue-600"/>
                  <p className="p-2">
                    Selecciona una clase y después el período para asignar el porsentaje disponible
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Ciclo escolar - solo lectura */}
                <FormField
                  control={form.control}
                  name='schoolCycle'
                  render={({field}) => (
                    <div className="space-y-2">
                      <FormLabel htmlFor="schoolCycle">Ciclo Escolar</FormLabel>
                      <Input
                        value={
                          field.value as string || 
                          formData.schoolCycle ||
                          (activeSchoolCycle ? 
                            schoolCycles?.find(cycle => cycle._id === activeSchoolCycle._id)?.name 
                            : "Ciclo Escolar") ||
                          "Ciclo Escolar"
                        }
                        readOnly={true}
                        disabled={true}
                      />
                    </div>
                  )}
                />

                <FormField
                  control={form.control}
                  name='class'
                  render={({field}) => (
                    <div className="space-y-2">
                      <FormLabel htmlFor="class">Clase</FormLabel>
                      <SelectPopover<ClassCatalog>
                        items={classCatalogs ?? []}
                        value={field.value as string}
                        onChange={field.onChange}
                        placeholder="Seleccionar una clase"
                        getKey={(c: ClassCatalog) => c._id}
                        getLabel={(c: ClassCatalog) => c.name}
                        renderItem={(c: ClassCatalog) => (
                          <div className="flex items-center">
                            <span>{c.name}</span>
                          </div>
                        )}
                        disabled={operation === 'view'}
                      />
                    </div>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="term"
                  render={({field}) => (
                    <div className="space-y-2">
                      <FormLabel htmlFor="class">Periodo</FormLabel>
                      <SelectPopover<Term>
                        items={terms ?? []}
                        value={field.value as string}
                        onChange={field.onChange}
                        placeholder="Selecciona una clase"
                        getKey={(t: Term) => t._id}
                        getLabel={(t: Term) => t.name}
                        renderItem={(t: Term) => (
                          <div className="flex items-center">
                            <span>{t.name}</span>
                          </div>
                        )}
                        disabled={operation === 'view'}
                      />
                    </div>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxScore"
                  render={({field}) => (
                    <div className="space-y-2">
                      <FormLabel htmlFor="maxScore">Calificación Máxima (100)</FormLabel>
                      <Input
                        id="maxScore"
                        type="number"
                        value={field.value as number || ' '}
                        onChange={
                          (e) => {
                            const value = e.target.value === '' ? 0 : Number.parseInt(e.target.value) || 0
                            field.onChange(value)
                            setFormData({ maxScore: value }) 
                          }
                        }
                        placeholder="Ingresar la calificación máxima"
                        min='1'
                        max='100'
                        disabled={operation === 'view'}
                      />
                    </div>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="weight"
                render={({field}) => (
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
                              value={field.value as number[] || [0]}
                              onValueChange=//{field.onChange}
                              {(value) => {
                                // Limitar el valor al máximo permitido
                                const limitedValue = Math.min(value[0] || 0, maxAllowed)
                                field.onChange([limitedValue])
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
                )}
              />
            </div>
          </div>
          )
        }}
      </CrudDialog>
    </div>
  );
}