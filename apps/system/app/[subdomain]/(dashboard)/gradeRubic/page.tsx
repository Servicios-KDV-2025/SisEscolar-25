"use client";

import { useState, useEffect } from "react";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Card, CardContent, CardHeader } from "@repo/ui/components/shadcn/card";
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
} from "@repo/ui/icons";
// Importaciones de Convex
import { api } from "@repo/convex/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { Id } from "@repo/convex/convex/_generated/dataModel";

import { useCurrentSchool } from "../../../../stores/userSchoolsStore";
import { useUser } from "@clerk/nextjs";
import { useUserWithConvex } from "../../../../stores/userStore";

interface Rubric {
  _id: Id<"gradeRubric">;
  _creationTime: number;
  classCatalogId: Id<"classCatalog">;
  termId: Id<"term">;
  name: string;
  weight: number; // Almacenado como decimal en Convex (ej: 0.4)
  maxScore: number;
  createdBy: Id<"user">;
  status: boolean; // Campo añadido para la baja lógica
}

export default function RubricDashboard() {
  // Estado para los filtros seleccionados por el usuario
  const [selectedSchoolCycle, setSelectedSchoolCycle] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRubric, setEditingRubric] = useState<Rubric | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    weight: [50],
    maxScore: 100,
    schoolCycle: "",
    class: "",
    term: "",
  });

  const { user: clerkUser } = useUser();
  const { currentUser } = useUserWithConvex(clerkUser?.id);

  // Get current school information using the subdomain
  const { currentSchool, isLoading: schoolLoading } = useCurrentSchool(
    currentUser?._id
  );

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

  // Utilizar useEffect para manejar los cambios en los datos de las consultas.
  // Esto previene que se inicialicen como "undefined" al renderizar.
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

  const createGradeRubric = useMutation(
    api.functions.gradeRubrics.createGradeRubric
  );
  const updateGradeRubric = useMutation(
    api.functions.gradeRubrics.updateGradeRubric
  );
  const deleteGradeRubric = useMutation(
    api.functions.gradeRubrics.deleteGradeRubric
  );

  console.log("rubricas: ", rubrics, "clases ", classes, "periodo: ", terms, "ciclos: ", schoolCycles);

  if (
    schoolLoading ||
    rubrics === undefined ||
    classes === undefined ||
    terms === undefined ||
    schoolCycles === undefined
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Cargando rúbricas...
      </div>
    );
  }

  const totalWeight = rubrics
    .filter((rubric) => rubric.status)
    .reduce((sum, rubric) => sum + (Math.round(rubric.weight * 100)), 0);

  // Función helper para calcular peso disponible
  const calculateAvailableWeight = () => {
    const usedWeight = rubrics
      .filter((rubric) => rubric.status && rubric._id !== editingRubric?._id)
      .reduce((sum, rubric) => sum + Math.round(rubric.weight * 100), 0);

    const availableWeight = 100 - usedWeight;
    return Math.max(0, availableWeight);
  };

  // Función helper para verificar si una rúbrica se puede activar
  const canActivateRubric = (rubricId: Id<"gradeRubric">) => {
    const rubricToCheck = rubrics.find(r => r._id === rubricId);
    if (!rubricToCheck || rubricToCheck.status) return true;

    const activeWeight = rubrics
      .filter((rubric) => rubric.status && rubric._id !== rubricId)
      .reduce((sum, rubric) => sum + Math.round(rubric.weight * 100), 0);

    const newWeight = Math.round(rubricToCheck.weight * 100);
    return activeWeight + newWeight <= 100;
  };

  const handleOpenModal = (rubric?: Rubric) => {
    if (rubric) {
      setEditingRubric(rubric);
      setFormData({
        name: rubric.name,
        // Convertir el decimal de Convex a porcentaje para el slider
        weight: [Math.round(rubric.weight * 100)],
        maxScore: rubric.maxScore,
        schoolCycle: "", // Este campo no se usa en el modo edición, ya que no se puede cambiar
        class: rubric.classCatalogId as string,
        term: rubric.termId as string,
      });
    } else {
      setEditingRubric(null);
      setFormData({
        name: "",
        weight: [50],
        maxScore: 100,
        schoolCycle: selectedSchoolCycle || "",
        class: selectedClass || "",
        term: selectedTerm || "",
      });
    }
    setIsModalOpen(true);
  };

  // La baja lógica ahora se maneja con la mutación de actualización
  const handleToggleStatus = async (
    rubricId: Id<"gradeRubric">,
    currentStatus: boolean
  ) => {
    // Si se está intentando activar (currentStatus es false)
    if (!currentStatus) {
      const rubricToActivate = rubrics.find(r => r._id === rubricId);
      if (!rubricToActivate) return;

      // Calcular el peso total de las rúbricas activas (excluyendo la que se va a activar)
      const activeWeight = rubrics
        .filter((rubric) => rubric.status && rubric._id !== rubricId)
        .reduce((sum, rubric) => sum + Math.round(rubric.weight * 100), 0);

      const newWeight = Math.round(rubricToActivate.weight * 100);

      // Verificar si activar esta rúbrica excedería el 100%
      if (activeWeight + newWeight > 100) {
        alert(`No se puede activar esta rúbrica. Excedería el 100% (Actual: ${activeWeight}% + Esta rúbrica: ${newWeight}% = ${activeWeight + newWeight}%)`);
        return;
      }
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
    setIsModalOpen(false);
    setEditingRubric(null);
  };

  const handleDeleteRubric = async (id: Id<"gradeRubric">) => {
    await deleteGradeRubric({ gradeRubricId: id });
  };

  const isNameDuplicate = rubrics.some(
    (r) =>
      r.name.toLowerCase() === formData.name.trim().toLowerCase() &&
      r._id !== editingRubric?._id
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <h1 className="text-3xl font-bold text-foreground">Rubricas</h1>

        {/* Search and Filters */}
        <Card>
          <CardContent className="">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 gap-4">
                {/* Nuevo Select para filtrar por School Cycle */}
                <Select
                  value={selectedSchoolCycle}
                  onValueChange={setSelectedSchoolCycle}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="School Cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolCycles.map((cycle) => (
                      <SelectItem key={cycle._id} value={cycle._id as string}>
                        {cycle.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Select para filtrar por Clase (ahora dinámico) */}
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes!.map((clase) => (
                      <SelectItem key={clase._id} value={clase._id as string}>
                        {clase.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Select para filtrar por Periodo (ahora dinámico) */}
                <Select
                  value={selectedTerm}
                  onValueChange={setSelectedTerm}
                  disabled={!selectedSchoolCycle}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Term" />
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
                  <span className="text-sm text-muted-foreground">
                    Total Weight:
                  </span>
                  <Badge
                    variant={totalWeight === 100 ? "default" : "destructive"}
                    className="font-semibold "
                  >
                    {totalWeight}%
                  </Badge>
                  {totalWeight !== 100 && (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                </div>
              </div>
              <Button
                onClick={() => handleOpenModal()}
                className="gap-2"
                disabled={!selectedClass || !selectedTerm}
              >
                <Plus className="h-4 w-4" />
                New Rubric
              </Button>
            </div>
          </CardContent>
        </Card>

        {totalWeight != 100 && (
          <div>
            <Card className="py-3">
              <CardContent className="text-red-400 text-sm font-semibold flex flex-row gap-2 justify-center ">
                <AlertCircle className="h-5" />
                <p>El total no es 100%. Adjusta las rubricas</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Rubrics Table */}
        <Card>
          <CardHeader></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Porcentaje</TableHead>
                  <TableHead>Calificacion Maxima</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
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
                        <Badge variant="outline">{Math.round(rubric.weight * 100)}%</Badge>
                      </TableCell>
                      <TableCell>{rubric.maxScore}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rubric.status}
                            onCheckedChange={() =>
                              handleToggleStatus(rubric._id, rubric.status)
                            }
                            disabled={!rubric.status && !canActivateRubric(rubric._id)}
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
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenModal(rubric)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRubric(rubric._id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground"
                    >
                      No se encontraron rúbricas para esta clase y periodo.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>


        {/* Modal Form */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingRubric ? "Editar Rubrica" : "Nueva Rubrica"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4 ">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  maxLength={30}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Nombre de Rubrica"
                />

                {isNameDuplicate && (
                  <div className="text-sm text-destructive p-1 flex justify-center items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    <p>Rubrica Duplicada.</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Nuevo Select para School Cycle en el modal */}
                <div className="space-y-2">
                  <Label htmlFor="schoolCycle">Ciclo Escolar</Label>
                  <Select
                    value={formData.schoolCycle}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, schoolCycle: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select school cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      {schoolCycles.map((cycle) => (
                        <SelectItem key={cycle._id} value={cycle._id as string}>
                          {cycle.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class">Clase</Label>
                  <Select
                    value={formData.class}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, class: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes!.map((clase) => (
                        <SelectItem key={clase._id} value={clase._id as string}>
                          {clase.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="term">Periodo</Label>
                  <Select
                    value={formData.term}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, term: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select term" />
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
                <div className="space-y-2">
                  <Label htmlFor="maxScore">Puntuación máxima (100)</Label>
                  <Input
                    id="maxScore"
                    type="number"
                    value={formData.maxScore}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        maxScore: Number.parseInt(e.target.value) || 0,
                      }))
                    }
                    placeholder="Enter max score"
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="px-3">
                  {(() => {
                    const availableWeight = calculateAvailableWeight();
                    const maxAllowed = Math.min(100, availableWeight);

                    return (
                      <>
                        <Label>
                          Porcentaje (Disponible: {availableWeight}%)
                        </Label>
                        <div className="flex justify-center text-sm mt-1 text-muted-foreground">
                          {availableWeight === 0 && "No hay porcentaje disponible"}
                          {availableWeight < formData.weight[0]! && availableWeight > 0 &&
                            `Máximo permitido: ${maxAllowed}%`
                          }
                        </div>
                        <Slider
                          value={formData.weight}
                          onValueChange={(value) => {
                            // Limitar el valor al máximo disponible
                            const limitedValue = Math.min(value[0]!, maxAllowed);
                            setFormData((prev) => ({ ...prev, weight: [limitedValue] }));
                          }}
                          max={maxAllowed}
                          min={0}
                          step={5}
                          className="w-full"
                          disabled={availableWeight === 0}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>0%</span>
                          <span className="flex justify-center text-black text-xl font-bold">
                            {formData.weight[0]}%
                          </span>
                          <span>{maxAllowed}%</span>
                        </div>
                        {availableWeight === 0 && (
                          <div className="text-center text-sm text-destructive mt-2">
                            Ya has alcanzado el 100%. Desactiva alguna rúbrica para liberar porcentaje.
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveRubric}
                disabled={
                  !formData.name.trim() ||
                  formData.maxScore > 100 ||
                  formData.maxScore <= 0 ||
                  !formData.class ||
                  isNameDuplicate ||
                  !formData.term ||
                  formData.weight[0]! > calculateAvailableWeight()
                }
              >
                Guardar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}