"use client";

import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/convex/convex/_generated/api";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useUserWithConvex } from "../../../../../stores/userStore";
import { useCurrentSchool } from "../../../../../stores/userSchoolsStore";
import { useClassScheduleStore, useFilteredClasses, ClassItem } from "../../../../../stores/classSchudeleStore";
import { CreateClassFormSchema, EditClassFormSchema, Schedule } from "../../../../../types/form/classScheduleSchema";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@repo/ui/components/shadcn/card";
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
  Filter
} from "lucide-react";
import { CrudDialog, useCrudDialog } from "@repo/ui/components/dialog/crud-dialog";
import { toast } from "sonner";
import { Book, ClockPlus } from "@repo/ui/icons";


export default function HorariosPorClasePage() {
  const { user: clerkUser, isLoaded } = useUser();
  const { currentUser, isLoading: userLoading } = useUserWithConvex(clerkUser?.id);

  const {
    currentSchool,
    isLoading: schoolLoading,
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

  const filteredClasses = useFilteredClasses();

  // Obtener el ciclo escolar activo
  const activeCycle = useQuery(
    api.functions.schoolCycles.ObtenerCicloActivo,
    currentSchool?.school._id ? { escuelaID: currentSchool.school._id } : 'skip'
  );

  // Obtener todas las clases con detalles y luego filtrar por ciclo activo
  const allClassCatalogs = useQuery(
    api.functions.classCatalog.getAllClassCatalog,
    currentSchool?.school._id ? { schoolId: currentSchool.school._id } : 'skip'
  );

  // Filtrar las clases por el ciclo escolar activo
  const classCatalogs = allClassCatalogs?.filter(
    (classCatalog) => classCatalog.schoolCycleId === activeCycle?._id
  );
  const schedules = useQuery(
    api.functions.schedule.getSchedulesBySchools,
    currentSchool?.school._id ? { schoolId: currentSchool.school._id } : 'skip'
  );
  const classes = useQuery(
    api.functions.classSchedule.getClassSchedules,
    currentSchool?.school._id ? { schoolId: currentSchool.school._id } : 'skip'
  );

  const isLoading = !isLoaded || userLoading || schoolLoading || !activeCycle || !allClassCatalogs || !schedules || !classes;

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

  const validateConflictsMutation = useMutation(api.functions.classSchedule.validateScheduleConflicts);

  const handleCreate = async (data: Record<string, unknown>) => {
    try {
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
      toast.success('Asignación creada exitosamente');
    } catch (error) {
      console.error('Error al crear horario:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un problema al crear el horario';
      toast.error(errorMessage);
      throw error; // Re-lanzar para que el formulario se mantenga abierto
    }
  };

  const handleEdit = async (data: Record<string, unknown>) => {
    try {
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
      }
      toast.success('Asignación actualizada exitosamente');
    } catch (error) {
      console.error('Error al editar horario:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un problema al actualizar el horario';
      toast.error(errorMessage);
      throw error; // Re-lanzar para que el formulario se mantenga abierto
    }
  };

  const stats = [
    {
      title: "Total de asignaciones activas",
      value: classes?.length.toString() || "0",
      icon: ClockPlus,
      trend: "Asignaciones registradas"
    },
    {
      title: "Total de asignaciones inactivas",
      value: (classes?.filter((classes) => classes?.status === "active") ?? []).length.toString(),
      icon: ClockPlus,
      trend: "Asignaciones registradas"
    },
    {
      title: "Total de clases activas",
      value: (classCatalogs?.filter((classCatalogs) => classCatalogs?.status === "active") ?? []).length.toString(),
      icon: Book,
      trend: "Clases registradas"
    },
    {
      title: "Total de horarios activos",
      value: (schedules?.filter((schedules) => schedules?.status === "active") ?? []).length.toString(),
      icon: Clock,
      trend: "Horarios registrados"
    },
  ];

  const handleDelete = async (id: string) => {
    await deleteClassSchedule({
      classCatalogId: id as Id<"classCatalog">,
    });
    toast.success('Asignación eliminada exitosamente');
  };

  return (
    <div className="space-y-8 p-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <ClockPlus className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">Asignación de Horarios</h1>
                  <p className="text-lg text-muted-foreground">
                    Administra las asignaciones de horarios.
                  </p>
                </div>
              </div>
            </div>
            <Button
              size="lg"
              className="gap-2"
              onClick={crudDialog.openCreate}>
              <Plus className="h-4 w-4" />
              Agregar Asignación
            </Button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="relative overflow-hidden group hover:shadow-lg transition-all duration-300"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Filter className='h-5 w-5' />
                  Filtros y Búsqueda
                </CardTitle>
                <CardDescription>
                  Encuentra los horarios de la clase y filtra por estado
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
                    placeholder="Buscar por clase..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select
                  onValueChange={(v) => setFilter(v === "all" ? "active" : "inactive")}
                  value={filter || ""}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filtrar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="inactive">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Lista de Asignación de Horarios</span>
              <Badge variant="outline">{filteredClasses.length} asignaciones</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Cargando asignaciones de horarios...</p>
                </div>
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="text-center py-12">
                <ClockPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No se encontraron asignaciones
                </h3>
                <p className="text-muted-foreground mb-4">
                  Intenta ajustar los filtros o agrega una nueva asignación.
                </p>
                <Button
                  size="lg"
                  className="gap-2"
                  onClick={crudDialog.openCreate}
                >
                  <Plus className="h-4 w-4" />
                  Agregar Horario por Clase
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-9">
                {filteredClasses.map((classItem, index) => (
                  <Card key={`${classItem._id}-${classItem.classCatalogId}-${index}`} className="w-full max-w-md hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
                    <CardHeader className="flex items-center gap-2 justify-between">
                      <CardTitle className="text-lg font-semibold leading-tight line-clamp-2 break-words flex-1 min-w-0">
                        {classItem.name}
                      </CardTitle>
                      <Badge
                        variant={classItem?.status === "active" ? "default" : "secondary"}
                        className={classItem?.status === "active" ? "bg-green-600 text-white flex-shrink-0 ml-2" : "flex-shrink-0 ml-2 bg-gray-600/70 text-white"}>
                        {classItem?.status === 'active' ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </CardHeader>

                    <CardContent className="space-y-3">
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
                            <p className="text-sm font-medium truncate">{classItem.group.grade} {classItem.group.name}</p>
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
                    <CardFooter className="flex justify-end gap-2 pt-2 border-t mt-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          crudDialog.openView(classItem)
                        }}
                        className="hover:scale-105 transition-transform cursor-pointer"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          crudDialog.openEdit(classItem);
                        }}
                        className="hover:scale-105 transition-transform cursor-pointer"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          crudDialog.openDelete(classItem)
                        }}
                        className="hover:scale-105 transition-transform cursor-pointer text-destructive hover:text-destructive bg-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      

      <CrudDialog
        operation={crudDialog.operation}
        title={
          crudDialog.operation === 'create' ? 'Crear Nueva Asignación de Horario' :
            crudDialog.operation === 'edit' ? 'Editar Asignación de Horario' :
              crudDialog.operation === 'view' ? 'Ver Asignación de Horario' : 'Asignación de Horario'
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
        onOpenChange={crudDialog.close}
        onSubmit={crudDialog.operation === 'create' ? handleCreate : handleEdit}
        onDelete={crudDialog.operation === 'delete' ? handleDelete : undefined}
        submitButtonText={
          crudDialog.operation === 'create' ? 'Crear Horario por Clase' :
            crudDialog.operation === 'edit' ? 'Guardar Cambios' : undefined
        }
      >
        {(form, operation) => (
          <div className="space-y-6">
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