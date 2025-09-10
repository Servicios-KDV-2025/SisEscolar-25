"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/convex/convex/_generated/api";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useUserWithConvex } from "../../../../stores/userStore";
import { useCurrentSchool } from "../../../../stores/userSchoolsStore";
import { useClassScheduleStore, useFilteredClasses, useClassStats, ClassItem } from "../../../../stores/classSchudeleStore";
import { CreateClassFormSchema, EditClassFormSchema, Schedule } from "../../../../types/form/classScheduleSchema";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@repo/ui/components/shadcn/card";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Checkbox } from "@repo/ui/components/shadcn/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@repo/ui/components/shadcn/accordion";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/shadcn/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Clock, 
  MapPin, 
  User, 
  GraduationCap,
  Users,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { CrudDialog, useCrudDialog } from "@repo/ui/components/dialog/crud-dialog";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/shadcn/alert";

interface HorariosPorClasePageProps {
  params: {
    subdomain: string;
  };
}

export default function HorariosPorClasePage({ params }: HorariosPorClasePageProps) {

  void params;

  const { user: clerkUser, isLoaded } = useUser();
  const { currentUser, isLoading: userLoading } = useUserWithConvex(clerkUser?.id);
  
  const {
    currentSchool,
    isLoading: schoolLoading,
    error: schoolError,
  } = useCurrentSchool(currentUser?._id);

  const {
    filter,
    searchTerm,
    setFilter,
    setSearchTerm,
    setClasses,
    updateClassCatalogId: updateClassCatalogIdStore,
    removeDuplicates,
  } = useClassScheduleStore();

  const [formAlert, setFormAlert] = useState<{
    type: "success" | "error" | null;
    title: string;
    description: string;
  } | null>(null);

  const filteredClasses = useFilteredClasses();
  const classStats = useClassStats();

  const isLoading = !isLoaded || userLoading || schoolLoading;

  const classCatalogs = useQuery(
    api.functions.classCatalog.getAllClassCatalog, 
    currentSchool?.school._id ? { schoolId: currentSchool.school._id } : 'skip'
  );
  const schedules = useQuery(
    api.functions.schedule.getSchedulesBySchools,
    currentSchool?.school._id ? { schoolId: currentSchool.school._id } : 'skip'
  );
  const classes = useQuery(
    api.functions.classSchedule.getClassSchedules,
    currentSchool?.school._id ? { schoolId: currentSchool.school._id } : 'skip'
  );


  // Mutations
  const createClassSchedule = useMutation(api.functions.classSchedule.createClassSchedule);
  const updateClassAndSchedules = useMutation(api.functions.classSchedule.updateClassAndSchedules);
  const deleteClassSchedule = useMutation(api.functions.classSchedule.deleteClassSchedule);

  const crudDialog = useCrudDialog(CreateClassFormSchema, {
      classCatalogId: "",
    selectedScheduleIds: [],
    status: "active",
  });

  useEffect(() => {
    if (classes) {
      const filteredClasses = classes.filter((c): c is NonNullable<typeof c> => c !== null) as unknown as ClassItem[];
      setClasses(filteredClasses);
      // Limpiar duplicados después de establecer las clases
      setTimeout(() => removeDuplicates(), 0);
    }
  }, [classes, setClasses, removeDuplicates]);

 
  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDayName = (day: string) => {
    const dayMap: Record<string, string> = {
      "lun.": "Lunes",
      "mar.": "Martes", 
      "mié.": "Miércoles",
      "jue.": "Jueves",
      "vie.": "Viernes",
    };
    return dayMap[day] || day;
  };

  // Mutation para validar conflictos
  const validateConflictsMutation = useMutation(api.functions.classSchedule.validateScheduleConflicts);

  const handleCreate = async (data: Record<string, unknown>) => {
    if (!currentSchool?.school._id) {
      throw new Error("No se pudo obtener la información de la escuela");
    }

    const formData = data as {
      classCatalogId: string;
      selectedScheduleIds: string[];
      status: "active" | "inactive";
    };

    if (formData.selectedScheduleIds.length === 0) {
      throw new Error("Debe seleccionar al menos un horario");
    }

    // Validar conflictos solo si el estado es activo
    if (formData.status === "active") {
      const validation = await validateConflictsMutation({
        classCatalogId: formData.classCatalogId as Id<"classCatalog">,
        selectedScheduleIds: formData.selectedScheduleIds as Id<"schedule">[],
        isEdit: false, // Es una creación, no una edición
      });
      if (validation.hasConflicts) {
        throw new Error(`Conflictos detectados: ${validation.conflicts.map((c: { message: string }) => c.message).join(', ')}`);
      }
    }

    await createClassSchedule({
      classCatalogId: formData.classCatalogId as Id<"classCatalog">,
      selectedScheduleIds: formData.selectedScheduleIds as Id<"schedule">[],
      status: formData.status,
    });

    // Mostrar alert de éxito
    setFormAlert({
      type: "success",
      title: "¡Clase creada exitosamente!",
      description: "La clase ha sido creada y configurada correctamente."
    });

    // Limpiar alert después de 5 segundos
    setTimeout(() => setFormAlert(null), 5000);
  };

  const handleEdit = async (data: Record<string, unknown>) => {
    const formData = data as {
      classCatalogId: string;
      selectedScheduleIds: string[];
      status: "active" | "inactive";
    };

    if (formData.selectedScheduleIds.length === 0) {
      throw new Error("Debe seleccionar al menos un horario");
    }

    // Obtener la clase original para comparar
    const originalClass = crudDialog.data as ClassItem | null;
    if (!originalClass) {
      throw new Error("No se pudo obtener la información de la clase original");
    }

    // Determinar los horarios finales para validación
    let finalScheduleIds = formData.selectedScheduleIds as Id<"schedule">[];
    
    // Si cambió la clase, unificar horarios existentes con los seleccionados
    if (originalClass.classCatalogId !== formData.classCatalogId) {
      // Obtener horarios existentes de la clase original
      const originalScheduleIds = originalClass.selectedScheduleIds as Id<"schedule">[];
      
      // Unificar horarios: existentes + seleccionados (sin duplicados)
      const allScheduleIds = [...originalScheduleIds, ...formData.selectedScheduleIds];
      finalScheduleIds = [...new Set(allScheduleIds)] as Id<"schedule">[];
    }

    // Validar conflictos solo si el estado es activo
    if (formData.status === "active") {
      const validation = await validateConflictsMutation({
        classCatalogId: formData.classCatalogId as Id<"classCatalog">,
        selectedScheduleIds: finalScheduleIds,
        isEdit: true, // Es una edición
        originalClassCatalogId: originalClass.classCatalogId as Id<"classCatalog">, // ID de la clase original
      });
      if (validation.hasConflicts) {
        throw new Error(`Conflictos detectados: ${validation.conflicts.map((c: { message: string }) => c.message).join(', ')}`);
      }
    }

    // Usar la nueva función que maneja tanto clase como horarios
    await updateClassAndSchedules({
      oldClassCatalogId: originalClass.classCatalogId as Id<"classCatalog">,
      newClassCatalogId: formData.classCatalogId as Id<"classCatalog">,
      selectedScheduleIds: finalScheduleIds,
      status: formData.status,
    });

    // Actualizar el estado en el store
    const newClassCatalog = classCatalogs?.find(cc => cc._id === formData.classCatalogId);
    if (newClassCatalog) {
      const updatedClassItem: ClassItem = {
        ...originalClass,
        _id: formData.classCatalogId,
        classCatalogId: formData.classCatalogId,
        name: newClassCatalog.name,
        status: formData.status,
        subject: newClassCatalog.subject,
        classroom: newClassCatalog.classroom,
        teacher: newClassCatalog.teacher,
        group: newClassCatalog.group,
        selectedScheduleIds: formData.selectedScheduleIds,
      };
      updateClassCatalogIdStore(originalClass._id, formData.classCatalogId, updatedClassItem);
      // Limpiar duplicados después de la actualización
      setTimeout(() => removeDuplicates(), 0);
    }

    // Mostrar alert de éxito
    setFormAlert({
      type: "success",
      title: "¡Clase actualizada exitosamente!",
      description: "Los cambios han sido guardados correctamente."
    });

    // Limpiar alert después de 5 segundos
    setTimeout(() => setFormAlert(null), 5000);
  };

  const handleDelete = async (id: string) => {
    await deleteClassSchedule({
      classCatalogId: id as Id<"classCatalog">,
    });

    // Mostrar alert de éxito
    setFormAlert({
      type: "success",
      title: "¡Clase eliminada exitosamente!",
      description: "La clase ha sido eliminada del sistema."
    });

    // Limpiar alert después de 5 segundos
    setTimeout(() => setFormAlert(null), 5000);
  };


  const FilterButton = ({
    value,
    label,
    isActive,
    className,
  }: {
    value: "all" | "active" | "inactive";
    label: string;
    isActive: boolean;
    className?: string;
  }) => (
    <Button
      variant={isActive ? "default" : "outline"}
      size="sm"
      onClick={() => setFilter(value)}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-medium transition-all cursor-pointer h-10",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-background text-[#737373] hover:bg-muted hover:text-foreground",
        className
      )}
    >
      {label}
    </Button>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando información de la escuela...</p>
          </div>
        </div>
      </div>
    );
  }

  if (schoolError || !currentSchool) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Error al cargar la información de la escuela. Por favor, verifique que tiene acceso a esta escuela.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground text-balance">
                Horarios por Clase
              </h1>
              <p className="text-muted-foreground text-pretty">
                Gestiona tus horarios de clase de manera eficiente
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="grid grid-cols-2 items-center w-full gap-4">
            {/* Columna izquierda */}
            <div className="relative flex items-center">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar clases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-card border-border w-full"
              />
            </div>

            {/* Columna derecha */}
            <div className="flex justify-end">
              <Button 
                onClick={crudDialog.openCreate}
                className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Horario por Clase
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 justify-end">
            <FilterButton
              value="all"
              label={`Todas las clases (${classStats.total})`}
              isActive={filter === "all"}
            />
            <FilterButton
              value="active"
              label={`Activas (${classStats.active})`}
              isActive={filter === "active"}
              className={`bg-green-100 hover:bg-green-300 ${filter === "active" ? "text-green-800" : ""}`}
            />
            <FilterButton
              value="inactive"
              label={`Inactivas (${classStats.inactive})`}
              isActive={filter === "inactive"}
              className={`bg-red-100 hover:bg-red-300 ${filter === "inactive" ? "text-red-800" : ""}`}
            />
          </div>
        </div>


        {/* Classes Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map((classItem, index) => (
            <Card key={`${classItem._id}-${classItem.classCatalogId}-${index}`} className="w-full max-w-md hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
              <CardHeader className="">
                <CardTitle className="text-lg font-semibold leading-tight line-clamp-2 break-words flex-1 min-w-0">
                  {classItem.name}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Estado */}
                <div className="flex items-center gap-2">
                  <span className="w-5 flex justify-center ml-4">
                    <Badge
                      variant={classItem.status === "active" ? "default" : "secondary"}
                      className={
                        classItem.status === "active"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : ""
                      }
                    >
                      {classItem.status === "active" ? "Activo" : "Inactivo"}
                    </Badge>
                  </span>
                </div>

                {/* Materia */}
                {classItem.subject && (
                  <div className="flex items-center gap-2">
                    <span className="w-5 flex justify-center">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{classItem.subject.name}</p>
                      {classItem.subject.credits && (
                        <p className="text-xs text-muted-foreground">
                          {classItem.subject.credits} {classItem.subject.credits === 1 ? "Crédito" : "Créditos"}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Aula */}
                {classItem.classroom && (
                  <div className="flex items-center gap-2">
                    <span className="w-5 flex justify-center">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{classItem.classroom.name}</p>
                      {classItem.classroom.location && (
                        <p className="text-xs text-muted-foreground truncate">
                          {classItem.classroom.location}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Capacidad: {classItem.classroom.capacity} estudiantes
                      </p>
                    </div>
                  </div>
                )}

                {/* Profesor */}
                {classItem.teacher && (
                  <div className="flex items-center gap-2">
                    <span className="w-5 flex justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {classItem.teacher.name} {classItem.teacher.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {classItem.teacher.email}
                      </p>
                    </div>
                  </div>
                )}

                {/* Grupo */}
                {classItem.group && (
                  <div className="flex items-center gap-2">
                    <span className="w-5 flex justify-center">
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ classItem.group.grade} {classItem.group.name}</p>                 
                    </div>
                  </div>
                )}

                {/* Horarios */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-5 flex justify-center">
                      <Clock className="h-4 w-4" />
                    </span>
                    <span>
                      {classItem.schedules.length} horario
                      {classItem.schedules.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between items-end gap-2 pt-2 border-t justify-end">               
                <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                      crudDialog.openView(classItem);
                  }}
                  className="cursor-pointer"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                      crudDialog.openEdit(classItem);
                  }}
                  className="cursor-pointer"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                      crudDialog.openDelete(classItem);
                  }}
                  className="cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredClasses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No se encontraron clases que coincidan con los filtros
              seleccionados.
            </p>
          </div>
        )}
      </div>

      {/* CRUD Dialog */}
      <CrudDialog
        operation={crudDialog.operation}
        title={
          crudDialog.operation === 'create' ? 'Crear Nueva Clase' :
          crudDialog.operation === 'edit' ? 'Editar Clase' :
          crudDialog.operation === 'view' ? 'Ver Clase' : 'Clase'
        }
      
        schema={crudDialog.operation === 'edit' ? EditClassFormSchema : CreateClassFormSchema}
        defaultValues={
          crudDialog.operation === 'edit' && crudDialog.data
            ? {
                _id: (crudDialog.data as ClassItem)._id,
                classCatalogId: (crudDialog.data as ClassItem).classCatalogId,
                selectedScheduleIds: (crudDialog.data as ClassItem).selectedScheduleIds,
                status: (crudDialog.data as ClassItem).status,
              }
            : crudDialog.defaultValues
        }
        data={crudDialog.data}
        isOpen={crudDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFormAlert(null); // Limpiar alert al cerrar el diálogo
          }
          crudDialog.close();
        }}
        onSubmit={crudDialog.operation === 'create' ? handleCreate : handleEdit}
        onDelete={crudDialog.operation === 'delete' ? handleDelete : undefined}
        onError={(error: unknown) => {
          if (error instanceof Error && error.message?.includes("Conflictos detectados")) {
            setFormAlert({
              type: "error",
              title: "Conflictos de horarios detectados",
              description: error.message.replace("Conflictos detectados: ", "")
            });
          } else {
            setFormAlert({
              type: "error",
              title: "Error",
              description: error instanceof Error ? error.message : "Ocurrió un error inesperado"
            });
          }
        }}
        submitButtonText={
          crudDialog.operation === 'create' ? 'Crear Clase' :
          crudDialog.operation === 'edit' ? 'Guardar Cambios' : undefined
        }
      >
        {(form, operation) => (
          <div className="space-y-6">
            {/* Alert para mostrar mensajes del formulario */}
            {formAlert && (
              <Alert variant={formAlert.type === "error" ? "destructive" : "default"} className="relative">
                {formAlert.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>{formAlert.title}</AlertTitle>
                <AlertDescription>
                  {formAlert.description}
                </AlertDescription>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0"
                  onClick={() => setFormAlert(null)}
                >
                  ×
                </Button>
              </Alert>
            )}

            {/* Campo ID oculto para edición */}
            {operation === 'edit' && (
              <FormField
                control={form.control}
                name="_id"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <input 
                        type="hidden" 
                        {...field} 
                        value={field.value as string}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                  name="classCatalogId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clase</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value as string}
                      disabled={operation === 'view'}
                    >
                        <FormControl>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccione una clase" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {classCatalogs?.map((cc) => (
                            <SelectItem key={cc._id} value={cc._id}>
                              {cc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                control={form.control}
                name="status"
                  render={({ field }) => (
                    <FormItem>
                    <FormLabel>Estado</FormLabel>
                      <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value as "active" | "inactive"}
                        disabled={operation === "view"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Activo</SelectItem>
                          <SelectItem value="inactive">Inactivo</SelectItem>
                        </SelectContent>
                      </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

            {form.watch("classCatalogId") as string && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Información de la Clase</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                  {(() => {
                    const selectedClassCatalog = classCatalogs?.find(
                      (cc) => cc._id === form.watch("classCatalogId")
                    );
                    
                    if (!selectedClassCatalog) return null;

                    return (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Materia:</span>
                          <p className="text-sm">{selectedClassCatalog.subject?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Aula:</span>
                          <p className="text-sm">{selectedClassCatalog.classroom?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Profesor:</span>
                        <p className="text-sm">
                            {selectedClassCatalog.teacher?.name || 'N/A'} {selectedClassCatalog.teacher?.lastName || ''}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Grupo:</span>
                          <p className="text-sm">{selectedClassCatalog.group?.name || 'N/A'}</p>
                      </div>
                    </div>
                    );
                  })() as React.ReactNode}
                  </CardContent>
                </Card>
              )}

            {/* Selección de horarios */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  {operation === 'view' ? 'Horarios Asignados' : 'Horarios Disponibles'}
                </h3>
                {operation !== 'view' && (
                  <span className="text-sm text-muted-foreground">
                    {Array.isArray(form.watch("selectedScheduleIds")) ? (form.watch("selectedScheduleIds") as string[]).length : 0} seleccionados
                  </span>
                )}
                </div>

              {operation === 'view' ? (
                // Vista con accordion para mostrar horarios por día
                <div className="space-y-2">
                  {(() => {
                    const selectedSchedules = schedules?.filter(schedule => 
                      (form.watch("selectedScheduleIds") as string[])?.includes(schedule._id)
                    ) || [];
                    
                    // Agrupar por día
                    const schedulesByDay = selectedSchedules.reduce((acc, schedule) => {
                      const day = schedule.day;
                      if (!acc[day]) {
                        acc[day] = [];
                      }
                      acc[day].push(schedule);
                      return acc;
                    }, {} as Record<string, Schedule[]>);

                    const dayOrder = ["lun.", "mar.", "mié.", "jue.", "vie."];
                    const sortedDays = dayOrder.filter(day => schedulesByDay[day]);

                    if (sortedDays.length === 0) {
                      return (
                        <div className="text-center py-8 text-muted-foreground">
                          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No hay horarios asignados</p>
                        </div>
                      );
                    }

                    return (
                      <Accordion type="multiple" className="w-full">
                        {sortedDays.map((day) => (
                          <AccordionItem key={day} value={day}>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{getDayName(day)}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {schedulesByDay[day]?.length || 0} horario{(schedulesByDay[day]?.length || 0) !== 1 ? 's' : ''}
                                </Badge>
                        </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 pt-2">
                                {schedulesByDay[day]?.map((schedule) => (
                                  <div key={schedule._id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                                    <div className="flex items-center gap-3">
                                      <Clock className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium">
                                        {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                      </span>
                      </div>
                                    <div className="text-sm text-muted-foreground">
                                      {schedule.name}
                  </div>
              </div>
                                ))}
              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    );
                  })()}
                </div>
              ) : (
                // Formulario de selección
                  <FormField
                  control={form.control}
                  name="selectedScheduleIds"
                    render={({ field }) => (
                      <FormItem>
                      <FormLabel>Seleccionar Horarios</FormLabel>
                        <FormControl>
                        <div className="grid gap-2 max-h-60 overflow-y-auto border rounded-md p-4">
                          {schedules?.map((schedule: Schedule) => (
                            <div key={schedule._id} className="flex items-center space-x-2">
                              <Checkbox
                                id={schedule._id}
                                checked={Array.isArray(field.value) ? (field.value as string[]).includes(schedule._id) : false}
                                onCheckedChange={(checked) => {
                                  const currentIds = Array.isArray(field.value) ? (field.value as string[]) : [];
                                  if (checked) {
                                    field.onChange([...currentIds, schedule._id]);
                                  } else {
                                    field.onChange(currentIds.filter((id: string) => id !== schedule._id));
                                  }
                                }}
                                disabled={operation !== 'create' && operation !== 'edit'}
                              />
                              <label
                                htmlFor={schedule._id}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{getDayName(schedule.day)}</span>
                                  <span className="text-muted-foreground">
                                    {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {schedule.name}
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              )}

              {(!schedules || schedules.length === 0) && operation !== 'view' && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay horarios disponibles</p>
                  <p className="text-sm">Cree horarios primero en la sección de horarios</p>
                    </div>
                  )}
                </div>
                </div>
          )}
      </CrudDialog>
    </div>
  );
}