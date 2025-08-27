"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/shadcn/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/shadcn/avatar";
import { CrudDialog, useCrudDialog } from "@repo/ui/components/dialog/crud-dialog";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@repo/ui/components/shadcn/form";
import { Alert, AlertDescription } from "@repo/ui/components/shadcn/alert";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/shadcn/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@repo/ui/components/shadcn/command";
import { 
   Users, Search, Plus, Eye, Edit, Trash2, Filter, Calendar, UserCheck, UserX, GraduationCap, AlertCircle, Loader2, Check, ChevronsUpDown
} from "@repo/ui/icons";
import { studentSchema, type StudentWithMetadata } from "@/types/form/userSchemas";
import { useStudentWithConvex, type CreateStudentData, type UpdateStudentData } from "../../../../../stores/studentStore";
import { useUserWithConvex } from "../../../../../stores/userStore";
import { useCurrentSchool } from "../../../../../stores/userSchoolsStore";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "@repo/convex/convex/_generated/api";

type Student = StudentWithMetadata;

export default function AlumnosPage() {
  // Hooks de autenticación y contexto
  const { user: clerkUser, isLoaded } = useUser();
  const { currentUser, isLoading: userLoading } = useUserWithConvex(clerkUser?.id);
  const { currentSchool, isLoading: schoolLoading } = useCurrentSchool(currentUser?._id);

  // Estados locales para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");

  // Hook del student store
  const {
    students,
    filteredStudents,
    isLoading: studentsLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error: studentsError,
    createStudent,
    updateStudent,
    updateStudentStatus,
    deleteStudent,
    filterStudents,
    searchStudents,
    clearError,
  } = useStudentWithConvex(currentSchool?.school._id as Id<"school">);

  // Queries para obtener grupos y tutores
  const groups = useQuery(
    api.functions.group.getAllGroupsBySchool,
    currentSchool?.school._id ? { schoolId: currentSchool.school._id as Id<"school"> } : 'skip'
  );

  // Obtener usuarios con rol de tutor de la escuela actual
  const tutors = useQuery(
    api.functions.schools.getUsersBySchoolAndRole,
    currentSchool?.school._id ? { 
      schoolId: currentSchool.school._id as Id<"school">,
      role: "tutor",
      status: "active"
    } : 'skip'
  );

  // Estado combinado de loading
  const isLoading = !isLoaded || userLoading || schoolLoading || studentsLoading;

  // Default values para el formulario
  const defaultValues = useMemo(() => ({
    schoolId: currentSchool?.school._id || "",
    groupId: groups?.[0]?._id || "",
    tutorId: tutors?.[0]?._id || "",
    enrollment: "",
    name: "",
    lastName: "",
    status: "active" as const,
    admissionDate: Date.now(),
    birthDate: undefined,
    imgUrl: "",
  }), [currentSchool?.school._id, groups, tutors]);

  // Hook del CRUD Dialog
  const {
    isOpen,
    operation,
    data,
    openCreate,
    openEdit,
    openView,
    openDelete,
    close,
  } = useCrudDialog(studentSchema, defaultValues);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    if (students.length > 0) {
      filterStudents({
        schoolId: currentSchool?.school._id as Id<"school">,
        groupId: groupFilter !== "all" ? groupFilter as Id<"group"> : undefined,
        status: statusFilter !== "all" ? statusFilter as "active" | "inactive" : undefined,
        searchTerm: searchTerm || undefined,
      });
    }
  }, [searchTerm, statusFilter, groupFilter, students, filterStudents, currentSchool]);

  // Limpiar errores al cambiar
  useEffect(() => {
    if (studentsError) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [studentsError, clearError]);

  // Funciones CRUD reales
  const handleCreate = async (formData: Record<string, unknown>) => {
    if (!currentSchool?.school._id) {
      console.error("No hay escuela seleccionada");
      return;
    }

    try {
      const studentData: CreateStudentData = {
        schoolId: currentSchool.school._id as Id<"school">,
        groupId: formData.groupId as Id<"group">,
        tutorId: formData.tutorId as Id<"user">,
        enrollment: formData.enrollment as string,
        name: formData.name as string,
        lastName: formData.lastName as string || undefined,
        birthDate: formData.birthDate as number || undefined,
        admissionDate: formData.admissionDate as number || Date.now(),
        imgUrl: formData.imgUrl as string || undefined,
      };

      const result = await createStudent(studentData);
      
      if (result) {
        close();
      }
    } catch (error) {
      console.error("Error al crear estudiante:", error);
    }
  };

  const handleUpdate = async (formData: Record<string, unknown>) => {
    if (!data?._id) {
      console.error("No hay estudiante seleccionado para actualizar");
      return;
    }

    try {
      const updateData: UpdateStudentData = {
        name: formData.name as string,
        lastName: formData.lastName as string || undefined,
        enrollment: formData.enrollment as string,
        groupId: formData.groupId as Id<"group">,
        tutorId: formData.tutorId as Id<"user">,
        birthDate: formData.birthDate as number || undefined,
        admissionDate: formData.admissionDate as number || undefined,
        imgUrl: formData.imgUrl as string || undefined,
      };

      const result = await updateStudent(data._id as Id<"student">, updateData);
      if (result) {
        close();
      }
    } catch (error) {
      console.error("Error al actualizar estudiante:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteStudent(id as Id<"student">);
      if (success) {
        close();
      }
    } catch (error) {
      console.error("Error al eliminar estudiante:", error);
    }
  };

  const handleStatusChange = async (studentId: string, newStatus: "active" | "inactive") => {
    try {
      await updateStudentStatus(studentId as Id<"student">, newStatus);
    } catch (error) {
      console.error("Error al cambiar estado del estudiante:", error);
    }
  };

  // Funciones de utilidad
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "No disponible";
    return new Date(timestamp).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  const getInitials = (name: string, lastName?: string) => {
    const first = name.charAt(0).toUpperCase();
    const last = lastName ? lastName.charAt(0).toUpperCase() : "";
    return first + last;
  };

  const getGroupInfo = (groupId: string) => {
    if (!groups) return "Cargando...";
    const group = groups.find((g: any) => g._id === groupId);
    return group ? `${group.grade} - ${group.name}` : "No asignado";
  };

  const getTutorInfo = (tutorId: string) => {
    if (!tutors) return "Cargando...";
    const tutor = tutors.find((t: any) => t._id === tutorId);
    return tutor ? `${tutor.name} ${tutor.lastName || ''}`.trim() : "No asignado";
  };

  const calculateAge = (birthDate?: number) => {
    if (!birthDate) return "No disponible";
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} años`;
  };

  const stats = [
    {
      title: "Total Alumnos",
      value: students.length.toString(),
      icon: Users,
      trend: "Estudiantes registrados"
    },
    {
      title: "Activos",
      value: students.filter((student: any) => student.status === "active").length.toString(),
      icon: UserCheck,
      trend: "Estado activo"
    },
    {
      title: "Inactivos", 
      value: students.filter((student: any) => student.status === "inactive").length.toString(),
      icon: UserX,
      trend: "Estado inactivo"
    },
  ];

  // Mostrar loading screen para carga inicial
  if (isLoading) {
    return (
      <div className="space-y-8 p-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-background border">
          <div className="relative p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-500/10 rounded-xl">
                    <GraduationCap className="h-8 w-8 text-indigo-600" />
                  </div>
                  <div>
                    <Skeleton className="h-10 w-48 mb-2" />
                    <Skeleton className="h-6 w-80" />
                  </div>
                </div>
              </div>
              <Skeleton className="h-12 w-40" />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-48" />
              </div>
              <div className="border rounded-md">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center p-4 border-b last:border-b-0">
                    <Skeleton className="h-10 w-10 rounded-full mr-3" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-48 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-8 w-20 mr-4" />
                    <Skeleton className="h-8 w-16 mr-4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Mostrar errores */}
      {studentsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {studentsError}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-background border">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/10 rounded-xl">
                  <GraduationCap className="h-8 w-8 text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">Alumnos</h1>
                  <p className="text-lg text-muted-foreground">
                    Gestión de estudiantes del sistema escolar
                  </p>
                </div>
              </div>
            </div>
            <Button 
              size="lg" 
              className="gap-2" 
              onClick={openCreate}
              disabled={isCreating || !currentSchool}
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {isCreating ? "Creando..." : "Agregar Alumno"}
            </Button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className="p-2 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                <stat.icon className="h-4 w-4 text-indigo-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros y Búsqueda
              </CardTitle>
              <CardDescription>
                Encuentra alumnos por nombre, matrícula, estado o grupo
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
                  placeholder="Buscar por nombre, apellido o matrícula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Grupo" />
              </SelectTrigger>
                              <SelectContent>
                <SelectItem value="all">Todos los grupos</SelectItem>
                {groups?.map((group: any) => (
                  <SelectItem key={group._id} value={group._id}>
                    {group.grade} - {group.name}
                  </SelectItem>
                )) || (
                  <SelectItem value="loading" disabled>
                    Cargando grupos...
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Alumnos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Alumnos</span>
            <Badge variant="outline">{filteredStudents.length} estudiantes</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Tutor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha de Ingreso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(filteredStudents.length > 0 ? filteredStudents : students).map((student: any) => (
                  <TableRow key={student._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={student.imgUrl} alt={student.name} />
                          <AvatarFallback className="bg-indigo-500/10">
                            {getInitials(student.name, student.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {student.name} {student.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {calculateAge(student.birthDate)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {student.enrollment}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getGroupInfo(student.groupId)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {getTutorInfo(student.tutorId)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={student.status === "active" ? "default" : "secondary"}
                        className={student.status === "active" ? "bg-green-500 hover:bg-green-600" : ""}
                      >
                        {student.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {formatDate(student.admissionDate)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openView(student)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(student)}
                          className="h-8 w-8 p-0"
                          disabled={isUpdating || isDeleting}
                        >
                          {isUpdating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Edit className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDelete(student)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          disabled={isUpdating || isDeleting}
                        >
                          {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {(filteredStudents.length === 0 && students.length === 0) && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No se encontraron alumnos</h3>
              <p className="text-muted-foreground mb-4">
                Intenta ajustar los filtros o agregar un nuevo alumno.
              </p>
              <Button onClick={openCreate} className="gap-2">
                <Plus className="w-4 h-4" />
                Agregar Alumno
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog CRUD */}
      <CrudDialog
        operation={operation}
        title={
          operation === "create" 
            ? "Agregar Alumno"
            : operation === "edit"
            ? "Editar Alumno"
            : operation === "view"
            ? "Ver Alumno"
            : "Eliminar Alumno"
        }
        description={
          operation === "create"
            ? "Completa la información para agregar un nuevo alumno"
            : operation === "edit"
            ? "Modifica la información del alumno"
            : operation === "view"
            ? "Información detallada del alumno"
            : undefined
        }
        schema={studentSchema}
        defaultValues={defaultValues}
        data={data}
        isOpen={isOpen}
        onOpenChange={close}
        onSubmit={operation === "create" ? handleCreate : handleUpdate}
        onDelete={handleDelete}
        deleteConfirmationTitle="¿Eliminar alumno?"
        deleteConfirmationDescription="Esta acción eliminará permanentemente al alumno del sistema. Esta acción no se puede deshacer."
      >
        {(form, currentOperation) => (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Campo oculto para schoolId */}
            <FormField
              control={form.control}
              name="schoolId"
              render={({ field }) => (
                <input 
                  {...field} 
                  type="hidden" 
                  value={currentSchool?.school._id || ""} 
                />
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      value={field.value as string || ""}
                      placeholder="Nombre del alumno"
                      disabled={currentOperation === "view"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellidos</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      value={field.value as string || ""}
                      placeholder="Apellidos"
                      disabled={currentOperation === "view"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="enrollment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Matrícula *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      value={field.value as string || ""}
                      placeholder="2024-001"
                      disabled={currentOperation === "view"}
                    />
                  </FormControl>
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
                      value={field.value as string} 
                      onValueChange={field.onChange}
                      disabled={currentOperation === "view"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
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

            <FormField
              control={form.control}
              name="groupId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grupo *</FormLabel>
                  <FormControl>
                    <Select 
                      value={field.value as string} 
                      onValueChange={field.onChange}
                      disabled={currentOperation === "view"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar grupo" />
                      </SelectTrigger>
                      <SelectContent>
                        {groups?.map((group: any) => (
                          <SelectItem key={group._id} value={group._id}>
                            {group.grade} - {group.name}
                          </SelectItem>
                        )) || (
                          <SelectItem value="loading" disabled>
                            Cargando grupos...
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tutorId"
              render={({ field }) => {
                const selectedTutor = tutors?.find((tutor: any) => tutor._id === field.value);
                const [open, setOpen] = useState(false);
                
                return (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tutor *</FormLabel>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={`w-full justify-between ${!field.value && "text-muted-foreground"}`}
                            disabled={currentOperation === "view"}
                          >
                            {selectedTutor 
                              ? `${selectedTutor.name} ${selectedTutor.lastName || ''}`
                              : "Seleccionar tutor"
                            }
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar tutor..." className="h-9" />
                        <CommandList>
                          <CommandEmpty>No se encontró ningún tutor.</CommandEmpty>
                          <CommandGroup>
                            {tutors?.map((tutor: any) => (
                              <CommandItem
                                value={`${tutor.name} ${tutor.lastName || ''}`}
                                key={tutor._id}
                                onSelect={() => {
                                  field.onChange(tutor._id);
                                  setOpen(false);
                                }}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {tutor.name} {tutor.lastName || ''}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {tutor.email}
                                  </span>
                                </div>
                                <Check
                                  className={`ml-auto h-4 w-4 ${
                                    tutor._id === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                              </CommandItem>
                            )) || (
                              <CommandItem disabled>
                                Cargando tutores...
                              </CommandItem>
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
                );
              }}
            />

            {currentOperation === "view" && data && (
              <div className="md:col-span-2 space-y-4 pt-4 border-t">
                <h3 className="font-medium text-sm text-muted-foreground">Información adicional</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">ID de Estudiante:</span>
                    <p className="font-mono">{data._id as string}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fecha de Creación:</span>
                    <p>{formatDate(data.createdAt as number)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Última Actualización:</span>
                    <p>{formatDate(data.updatedAt as number)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ID de Escuela:</span>
                    <p className="font-mono">{data.schoolId as string}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CrudDialog>
    </div>
  );
}
