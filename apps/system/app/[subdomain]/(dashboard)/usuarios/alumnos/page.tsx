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
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/shadcn/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@repo/ui/components/shadcn/command";
import {
  Users, Search, Plus, Eye, Edit, Trash2, Filter, Calendar, UserCheck, UserX, GraduationCap, AlertCircle, Loader2, Check, ChevronsUpDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
  Info
} from "@repo/ui/icons";
import { studentSchema } from "@/types/form/userSchemas";
import { useStudentsWithPermissions, type CreateStudentData, type UpdateStudentData } from "../../../../../stores/studentStore";
import { useUserWithConvex } from "../../../../../stores/userStore";
import { useCurrentSchool } from "../../../../../stores/userSchoolsStore";
import { usePermissions } from "../../../../../hooks/usePermissions";
import NotAuth from "../../../../../components/NotAuth";
import { useCrudToastMessages } from "../../../../../hooks/useCrudToastMessages";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "@repo/convex/convex/_generated/api";

// Tipos para los datos de grupos y tutores
interface Group {
  _id: string;
  name: string;
  grade: string;
}

interface Tutor {
  _id: string;
  name: string;
  lastName?: string;
  email: string;
}


export default function AlumnosPage() {
  // Hooks de autenticación y contexto
  const { user: clerkUser, isLoaded } = useUser();
  const { currentUser, isLoading: userLoading } = useUserWithConvex(clerkUser?.id);
  const { currentSchool, isLoading: schoolLoading } = useCurrentSchool(currentUser?._id);

  // Hook de permisos
  const {
    getStudentFilters,
    canCreateUsersAlumnos,
    canReadUsersAlumnos,
    canUpdateUsersAlumnos,
    canDeleteUsersAlumnos,
    isSuperAdmin,
    isAdmin,
    isTeacher,
    isTutor,
    isLoading: permissionsLoading,
    error: permissionsError,
  } = usePermissions(currentSchool?.school._id);

  // Estados locales para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [tutorPopoverOpen, setTutorPopoverOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [cyclePopoverOpen, setCyclePopoverOpen] = useState(false);

  // Hook del student store con filtros por rol
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
    deleteStudent,
    filterStudents,
    clearError,
  } = useStudentsWithPermissions(
    currentSchool?.school._id as Id<"school">,
    getStudentFilters
  );

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

  // Obtener ciclos escolares de la escuela actual
  const schoolCycles = useQuery(
    api.functions.schoolCycles.ObtenerCiclosEscolares,
    currentSchool?.school._id ? { escuelaID: currentSchool.school._id as Id<"school"> } : 'skip'
  );

  // Hook para obtener la siguiente matrícula disponible
  const nextEnrollment = useQuery(
    api.functions.student.generateNextEnrollment,
    currentSchool?.school._id ? { schoolId: currentSchool.school._id as Id<"school"> } : 'skip'
  );

  // Estado combinado de loading
  const isLoading = !isLoaded || userLoading || schoolLoading || studentsLoading || permissionsLoading;

  // Flag para mostrar pantalla de no autorización
  const showNotAuth = (permissionsError || !canReadUsersAlumnos) && !permissionsLoading && !isLoading;

  // Oct30: Obtener el ciclo escolar activo
  const activeCycle = useMemo(() => {
    return schoolCycles?.find((cycle) => cycle.status === "active");
  }, [schoolCycles]);

  // Default values para el formulario
  const defaultValues = useMemo(() => ({
    schoolId: currentSchool?.school._id || "",
    groupId: "", // Dejar vacío para forzar selección
    tutorId: "", // Dejar vacío para forzar selección
    schoolCycleId: activeCycle?._id || "", // Oct30: Usar el ciclo activo por defecto
    enrollment: nextEnrollment || "", // Usar la matrícula generada automáticamente
    name: "",
    lastName: "",
    status: "active" as const,
    admissionDate: Date.now(),
    birthDate: undefined,
    imgUrl: "",
    scholarshipType: "inactive" as const,
    scholarshipPercentage: undefined,
  }), [currentSchool?.school._id, nextEnrollment, activeCycle?._id]);

  // const paginatedStudents = useMemo(() => {
  //   const dataToUse = filteredStudents.length > 0 ? filteredStudents : students;
  //   const startIndex = (currentPage - 1) * itemsPerPage;
  //   const endIndex = startIndex + itemsPerPage;
  //   return dataToUse.slice(startIndex, endIndex);
  // }, [filteredStudents, students, currentPage, itemsPerPage]);

  const paginatedStudents = useMemo(() => {
    // 1. Decide qué lista usar (filtrada o completa)
    const dataToUse = filteredStudents.length > 0 ? filteredStudents : students;

    // 2. Ordena la lista alfabéticamente
    // Usamos [...dataToUse] para crear una copia y no mutar el estado original
    const sortedData = [...dataToUse].sort((a, b) => {
      // Combinamos nombre y apellido para un ordenado completo
      const nameA = `${a.name} ${a.lastName || ''}`.toLowerCase().trim();
      const nameB = `${b.name} ${b.lastName || ''}`.toLowerCase().trim();
      
      // localeCompare es la forma correcta de ordenar alfabéticamente (maneja acentos)
      return nameA.localeCompare(nameB);
    });

    // 3. Pagina la lista ya ordenada
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return sortedData.slice(startIndex, endIndex);

  }, [filteredStudents, students, currentPage, itemsPerPage]); // Las dependencias siguen igual
  
  const totalPages = Math.ceil(
    (filteredStudents.length > 0 ? filteredStudents.length : students.length) / itemsPerPage
  );

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

  //   Mensajes de toast personalizados
  const toastMessages = useCrudToastMessages("Alumno");

  // Aplicar filtros cuando cambien
  useEffect(() => {
    // Siempre aplicar filtros, incluso si no hay estudiantes
    filterStudents({
      schoolId: currentSchool?.school._id as Id<"school">,
      groupId: groupFilter !== "all" ? groupFilter as Id<"group"> : undefined,
      status: statusFilter !== "all" ? statusFilter as "active" | "inactive" : undefined,
      searchTerm: searchTerm || undefined,
    });
  }, [searchTerm, statusFilter, groupFilter, students, filterStudents, currentSchool]);

  // Resetear página cuando cambien los filtros
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, groupFilter]);

  // Limpiar errores al cambiar
  useEffect(() => {
    if (studentsError) {
      const timer = setTimeout(() => {
        clearError();
      }, 8000); // Aumentado a 8 segundos para errores de formulario
      return () => clearTimeout(timer);
    }
  }, [studentsError, clearError]);

  // Funciones CRUD reales
  const handleCreate = async (formData: Record<string, unknown>) => {
    if (!currentSchool?.school._id) {
      throw new Error("No hay escuela seleccionada");
    }

    const studentData: CreateStudentData = {
      schoolId: currentSchool.school._id as Id<"school">,
      groupId: formData.groupId as Id<"group">,
      tutorId: formData.tutorId as Id<"user">,
      schoolCycleId: formData.schoolCycleId as Id<"schoolCycle">,
      enrollment: formData.enrollment as string,
      name: formData.name as string,
      lastName: formData.lastName as string || undefined,
      birthDate: formData.birthDate as number || undefined,
      admissionDate: formData.admissionDate as number || Date.now(),
      imgUrl: formData.imgUrl as string || undefined,
      status: formData.status as 'active' | 'inactive' || 'active',
      scholarshipType: formData.scholarshipType as 'active' | 'inactive' || 'inactive',
      scholarshipPercentage: formData.scholarshipPercentage as number || undefined,
    };

    const result = await createStudent(studentData);

    // Si no hay resultado, significa que hubo un error
    if (!result) {
      // El error ya está establecido en el store, pero necesitamos lanzar una excepción
      // para que el CrudDialog no cierre el modal
      throw new Error(studentsError || "Error al crear el estudiante");
    }

    // Si llegamos aquí, la creación fue exitosa y el CrudDialog se cerrará automáticamente
  };

  const handleUpdate = async (formData: Record<string, unknown>) => {
    if (!data?._id) {
      throw new Error("No hay estudiante seleccionado para actualizar");
    }

    const updateData: UpdateStudentData = {
      name: formData.name as string,
      lastName: formData.lastName as string || undefined,
      enrollment: formData.enrollment as string,
      groupId: formData.groupId as Id<"group">,
      tutorId: formData.tutorId as Id<"user">,
      schoolCycleId: formData.schoolCycleId as Id<"schoolCycle">,
      birthDate: formData.birthDate as number || undefined,
      admissionDate: formData.admissionDate as number || undefined,
      imgUrl: formData.imgUrl as string || undefined,
      status: formData.status as 'active' | 'inactive',
      scholarshipType: formData.scholarshipType as 'active' | 'inactive',
      scholarshipPercentage: formData.scholarshipPercentage as number || undefined,
    };

    const result = await updateStudent(data._id as Id<"student">, updateData);

    // Si no hay resultado, significa que hubo un error
    if (!result) {
      // El error ya está establecido en el store, pero necesitamos lanzar una excepción
      // para que el CrudDialog no cierre el modal
      throw new Error(studentsError || "Error al actualizar el estudiante");
    }

    // Si llegamos aquí, la actualización fue exitosa y el CrudDialog se cerrará automáticamente
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
    const group = groups.find((g: Group) => g._id === groupId);
    return group ? `${group.grade} - ${group.name}` : "No asignado";
  };

  const getTutorInfo = (tutorId: string) => {
    if (!tutors) return "Cargando...";
    const tutor = tutors.find((t: Tutor) => t._id === tutorId);
    return tutor ? `${tutor.name} ${tutor.lastName || ''}`.trim() : "No asignado";
  };
  const getSchoolCycleInfo = (schoolCycleId?: string) => {
    if (!schoolCycleId) return "No asignado";
    if (!schoolCycles) return "Cargando...";
    const schoolCycle = schoolCycles.find((s) => s._id === schoolCycleId);
    return schoolCycle ? `${schoolCycle.name}` : "No asignado";
  };

  const getScholarshipInfo = (scholarshipType: string, scholarshipPercentage?: number) => {
    if (scholarshipType === "inactive") {
      return "Sin Beca";
    } else if (scholarshipType === "active" && scholarshipPercentage) {
      return `Beca con ${scholarshipPercentage}%`;
    } else {
      return "Beca sin porcentaje";
    }
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

  // Componente de Paginación (agregar antes del return principal):
  const PaginationControls = () => {
    const totalItems = filteredStudents.length > 0 ? filteredStudents.length : students.length;
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 border-t">
        {/* Info de registros */}
        <div className="text-sm text-muted-foreground">
          Mostrando <span className="font-medium">{startItem}</span> a{" "}
          <span className="font-medium">{endItem}</span> de{" "}
          <span className="font-medium">{totalItems}</span> registros
        </div>

        {/* Controles de paginación */}
        <div className="flex items-center gap-2">
          {/* Selector de items por página */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Mostrar:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            {/* Primera página */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            {/* Página anterior */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Números de página */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;

                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNumber)}
                    className="h-8 w-8 p-0"
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>

            {/* Página siguiente */}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Última página */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
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
      value: students.filter((student) => student.status === "active").length.toString(),
      icon: UserCheck,
      trend: "Estado activo"
    },
    {
      title: "Inactivos",
      value: students.filter((student) => student.status === "inactive").length.toString(),
      icon: UserX,
      trend: "Estado inactivo"
    },
  ];

  // Mostrar loading screen para carga inicial
  // if (isLoading) {
  //   return (
  //     <div className="space-y-8 p-6">
  //       <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-background border">
  //         <div className="relative p-8">
  //           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
  //             <div className="space-y-3">
  //               <div className="flex items-center gap-3">
  //                 <div className="p-3 bg-indigo-500/10 rounded-xl">
  //                   <GraduationCap className="h-8 w-8 text-indigo-600" />
  //                 </div>
  //                 <div>
  //                   <Skeleton className="h-10 w-48 mb-2" />
  //                   <Skeleton className="h-6 w-80" />
  //                 </div>
  //               </div>
  //             </div>
  //             <Skeleton className="h-12 w-40" />
  //           </div>
  //         </div>
  //       </div>

  //       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  //         {[1, 2, 3].map((i) => (
  //           <Card key={i}>
  //             <CardHeader>
  //               <div className="flex items-center justify-between">
  //                 <Skeleton className="h-4 w-24" />
  //                 <Skeleton className="h-8 w-8 rounded-lg" />
  //               </div>
  //             </CardHeader>
  //             <CardContent>
  //               <Skeleton className="h-8 w-16 mb-2" />
  //               <Skeleton className="h-3 w-32" />
  //             </CardContent>
  //           </Card>
  //         ))}
  //       </div>

  //       <Card>
  //         <CardHeader>
  //           <Skeleton className="h-6 w-48" />
  //         </CardHeader>
  //         <CardContent>
  //           <div className="space-y-4">
  //             <div className="flex gap-4">
  //               <Skeleton className="h-10 flex-1" />
  //               <Skeleton className="h-10 w-48" />
  //               <Skeleton className="h-10 w-48" />
  //             </div>
  //             <div className="border rounded-md">
  //               {[1, 2, 3, 4, 5].map((i) => (
  //                 <div key={i} className="flex items-center p-4 border-b last:border-b-0">
  //                   <Skeleton className="h-10 w-10 rounded-full mr-3" />
  //                   <div className="flex-1">
  //                     <Skeleton className="h-4 w-48 mb-2" />
  //                     <Skeleton className="h-3 w-24" />
  //                   </div>
  //                   <Skeleton className="h-8 w-20 mr-4" />
  //                   <Skeleton className="h-8 w-16 mr-4" />
  //                   <div className="flex gap-2">
  //                     <Skeleton className="h-8 w-8" />
  //                     <Skeleton className="h-8 w-8" />
  //                     <Skeleton className="h-8 w-8" />
  //                   </div>
  //                 </div>
  //               ))}
  //             </div>
  //           </div>
  //         </CardContent>
  //       </Card>
  //     </div>
  //   );
  // }



  return showNotAuth ? (
    <NotAuth
      pageName="Alumnos"
      pageDetails="Gestión de estudiantes del sistema escolar"
      icon={GraduationCap}
    />
  ) : (
    <div className="space-y-8 p-6">


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
                {groups?.map((group: Group) => (
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
                    {/* Mostrar alerta cuando no hay datos necesarios para crear estudiantes */}
        {canCreateUsersAlumnos && (!groups?.length || !tutors?.length || !activeCycle) && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {/*Oct30: Se muestra mensaje de alerta para distintos escenarios (se agrega el del ciclo escolar activo) */}
              {!groups?.length && !tutors?.length && !activeCycle
                ? "No se pueden crear estudiantes porque no hay grupos, tutores disponibles ni un ciclo escolar activo. Debes crear grupos, asignar tutores y activar un ciclo escolar primero."
                : !groups?.length && !tutors?.length
                  ? "No se pueden crear estudiantes porque no hay grupos ni tutores disponibles. Debes crear grupos y asignar tutores primero."
                  : !groups?.length && !activeCycle
                    ? "No se pueden crear estudiantes porque no hay grupos disponibles ni un ciclo escolar activo. Debes crear grupos y activar un ciclo escolar primero."
                    : !tutors?.length && !activeCycle
                      ? "No se pueden crear estudiantes porque no hay tutores disponibles ni un ciclo escolar activo. Debes asignar tutores y activar un ciclo escolar primero."
                      : !groups?.length
                        ? "No se pueden crear estudiantes porque no hay grupos disponibles. Debes crear grupos primero."
                        : !tutors?.length
                          ? "No se pueden crear estudiantes porque no hay tutores disponibles. Debes asignar tutores a esta escuela primero."
                          : "No se pueden crear estudiantes porque no hay un ciclo escolar activo. Debes activar un ciclo escolar primero."
              }
            </AlertDescription>
          </Alert>
        )}

      {/* Información de permisos */}
      {(isTutor || isTeacher) && !isSuperAdmin && !isAdmin && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {isTutor && "Como tutor, solo puedes ver los estudiantes que tienes asignados."}
            {isTeacher && "Como maestro, solo puedes ver los estudiantes de las materias que impartes."}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabla de Alumnos */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <CardTitle>
              <div className="flex flex-col gap-2">
                <span>Lista de Alumnos</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 w-fit">
                  {filteredStudents.length > 0 ? filteredStudents.length : students.length} estudiantes
                </Badge>
              </div>
            </CardTitle>
            
            {canCreateUsersAlumnos && (
              <div className="w-full md:w-auto">
                <Button
                  size="lg"
                  className="gap-2 bg-blue-600 hover:bg-blue-700 w-full md:w-auto"
                  onClick={openCreate}
                  disabled={isCreating || !currentSchool || !groups?.length || !tutors?.length || !activeCycle}
                  title={
                    !groups?.length ? "No hay grupos disponibles" :
                      !tutors?.length ? "No hay tutores disponibles" :
                        !activeCycle ? "No hay un ciclo escolar activo" :
                          !currentSchool ? "No hay escuela seleccionada" : ""
                  }
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {isCreating ? "Creando..." : "Agregar Alumno"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando alumnos...</p>
              </div>
            </div>
          ) : (filteredStudents.length === 0 && students.length === 0) ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No se encontraron alumnos</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" || groupFilter !== "all"
                  ? "Intenta ajustar los filtros para ver más resultados."
                  : "Aún no hay alumnos registrados en esta escuela."}
              </p>
              {canCreateUsersAlumnos && (
                <Button
                  onClick={openCreate}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                  disabled={!groups?.length || !tutors?.length || !activeCycle}
                >
                  <Plus className="h-4 w-4" />
                  Agregar Alumno
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Vista de tabla para pantallas medianas y grandes */}
              <div className="hidden md:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Estudiante</TableHead>
                      <TableHead className="text-center">Matrícula</TableHead>
                      <TableHead className="text-center">Grupo</TableHead>
                      <TableHead className="text-center">Ciclo Escolar</TableHead>
                      <TableHead className="text-center hidden lg:table-cell">Tutor</TableHead>
                      <TableHead className="text-center">Beca</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead className="text-center hidden xl:table-cell">Fecha de Ingreso</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedStudents.map((student) => (
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

                        <TableCell className="text-center">
                          <Badge variant="outline" className="font-mono">
                            {student.enrollment}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge variant="secondary">
                            {getGroupInfo(student.groupId)}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge variant="secondary">
                            {getSchoolCycleInfo(student.schoolCycleId)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center hidden lg:table-cell">
                          <div className="text-sm">
                            {getTutorInfo(student.tutorId)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="font-medium">
                            {getScholarshipInfo(student.scholarshipType, student.scholarshipPercentage)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={student.status === "active" ? "default" : "secondary"}
                            className={student.status === "active"
                              ? "bg-green-600 text-white"
                              : "bg-gray-600/70 text-white"}
                          >
                            {student.status === "active" ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-center hidden xl:table-cell">
                          <div className="flex items-center gap-1 text-sm justify-center">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {formatDate(student.admissionDate)}
                          </div>
                        </TableCell>

                        <TableCell className="flex justify-center text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openView(student as unknown as Record<string, unknown>)}
                              className="h-8 w-8 p-0"
                              disabled={isUpdating || isDeleting}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canUpdateUsersAlumnos && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(student as unknown as Record<string, unknown>)}
                                className="h-8 w-8 p-0"
                                disabled={isUpdating || isDeleting}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDeleteUsersAlumnos && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDelete(student as unknown as Record<string, unknown>)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                disabled={isUpdating || isDeleting}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Vista de tarjetas para pantallas pequeñas */}
              <div className="md:hidden space-y-4">
                {paginatedStudents.map((student) => (
                  <Card key={student._id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={student.imgUrl} alt={student.name} />
                            <AvatarFallback className="bg-indigo-500/10">
                              {getInitials(student.name, student.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {student.name} {student.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {calculateAge(student.birthDate)}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={student.status === "active" ? "default" : "secondary"}
                          className={student.status === "active"
                            ? "bg-green-600 text-white"
                            : "bg-gray-600/70 text-white"}
                        >
                          {student.status === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground font-medium">Matrícula:</span>
                          <Badge variant="outline" className="font-mono">
                            {student.enrollment}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground font-medium">Grupo:</span>
                          <Badge variant="secondary">
                            {getGroupInfo(student.groupId)}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground font-medium">Tutor:</span>
                          <span>{getTutorInfo(student.tutorId)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground font-medium">Beca:</span>
                          <Badge variant="outline" className="font-medium text-xs">
                            {getScholarshipInfo(student.scholarshipType, student.scholarshipPercentage)}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{formatDate(student.admissionDate)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openView(student as unknown as Record<string, unknown>)}
                          disabled={isUpdating || isDeleting}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        {canUpdateUsersAlumnos && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(student as unknown as Record<string, unknown>)}
                            disabled={isUpdating || isDeleting}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        )}
                        {canDeleteUsersAlumnos && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDelete(student as unknown as Record<string, unknown>)}
                            className="text-destructive hover:text-destructive"
                            disabled={isUpdating || isDeleting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
        {(filteredStudents.length > 0 || students.length > 0) && <PaginationControls />}
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
        toastMessages={toastMessages}
        disableDefaultToasts={false}
        onError={() => {
          // El error se muestra dentro del dialog y también se maneja con toasts
        }}
      >
        {(form, currentOperation) => (
          <div className="space-y-4">
            {/* Mostrar error del store dentro del formulario */}
            {studentsError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {studentsError}
                </AlertDescription>
              </Alert>
            )}

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
                        placeholder="Se genera automáticamente"
                        disabled={currentOperation === "view" || currentOperation === "create"}
                        onChange={(e) => {
                          field.onChange(e);
                          // Limpiar error cuando el usuario empiece a escribir
                          if (studentsError) {
                            clearError();
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                    {currentOperation === "create" && (
                      <p className="text-xs text-muted-foreground">
                        Generada automáticamente con formato: AÑO + número consecutivo
                      </p>
                    )}
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
                          {groups && groups.length > 0 ? (
                            groups.map((group: Group) => (
                              <SelectItem key={group._id} value={group._id}>
                                {group.grade} - {group.name}
                              </SelectItem>
                            ))
                          ) : groups === undefined ? (
                            <SelectItem value="loading" disabled>
                              Cargando grupos...
                            </SelectItem>
                          ) : (
                            <SelectItem value="no-groups" disabled>
                              No hay grupos disponibles
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
                name="schoolCycleId"
                render={({ field }) => {
                  const selectedCycle = schoolCycles?.find((cycle) => cycle._id === field.value);

                  return (
                    <FormItem className="flex flex-col">
                      <FormLabel>Ciclo Escolar *</FormLabel>
                      <Popover open={cyclePopoverOpen} onOpenChange={setCyclePopoverOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={`w-full justify-between ${!field.value && "text-muted-foreground"}`}
                              disabled={currentOperation === "view"}
                            >
                              {selectedCycle
                                ? selectedCycle.name
                                : "Seleccionar ciclo escolar"
                              }
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Buscar ciclo escolar..." />
                            <CommandEmpty>No se encontró ningún ciclo escolar.</CommandEmpty>
                            <CommandList>
                              <CommandGroup>
                                {schoolCycles && schoolCycles.length > 0 ? (
                                  schoolCycles.map((cycle) => (
                                    <CommandItem
                                      key={cycle._id}
                                      value={cycle.name}
                                      onSelect={() => {
                                        field.onChange(cycle._id);
                                        setCyclePopoverOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${field.value === cycle._id ? "opacity-100" : "opacity-0"
                                          }`}
                                      />
                                      <div className="flex flex-col">
                                        <span className="font-medium">{cycle.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </CommandItem>
                                  ))
                                ) : schoolCycles === undefined ? (
                                  <CommandItem disabled>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Cargando ciclos escolares...
                                  </CommandItem>
                                ) : (
                                  <CommandItem disabled>
                                    No hay ciclos escolares disponibles
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

              <FormField
                control={form.control}
                name="tutorId"
                render={({ field }) => {
                  const selectedTutor = tutors?.find((tutor: Tutor) => tutor._id === field.value);

                  return (
                    <FormItem className="flex flex-col">
                      <FormLabel>Tutor *</FormLabel>
                      <Popover open={tutorPopoverOpen} onOpenChange={setTutorPopoverOpen}>
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
                              <CommandEmpty>
                                {tutors && tutors.length === 0
                                  ? "No hay tutores disponibles en esta escuela."
                                  : "No se encontró ningún tutor."
                                }
                              </CommandEmpty>
                              <CommandGroup>
                                {tutors && tutors.length > 0 ? (
                                  tutors.map((tutor: Tutor) => (
                                    <CommandItem
                                      value={`${tutor.name} ${tutor.lastName || ''}`}
                                      key={tutor._id}
                                      onSelect={() => {
                                        field.onChange(tutor._id);
                                        setTutorPopoverOpen(false);
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
                                        className={`ml-auto h-4 w-4 ${tutor._id === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                          }`}
                                      />
                                    </CommandItem>
                                  ))
                                ) : tutors === undefined ? (
                                  <CommandItem disabled>
                                    Cargando tutores...
                                  </CommandItem>
                                ) : (
                                  <CommandItem disabled>
                                    No hay tutores disponibles
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

              <FormField
                control={form.control}
                name="scholarshipType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Beca</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value as string}
                        onValueChange={field.onChange}
                        disabled={currentOperation === "view"}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo de beca" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inactive">Sin Beca</SelectItem>
                          <SelectItem value="active">Beca con Porcentaje</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                    {form.watch("scholarshipType") === "active" && (
                      <div className="flex flex-row text-xs text-muted-foreground gap-2">
                        <Info className="h-4.5 w-4.5 items-center" />
                        <p className="">
                          La beca solo aplica para las inscripciones y colegiaturas
                        </p>
                      </div>

                    )}
                  </FormItem>
                )}
              />
              {form.watch("scholarshipType") === "active" && (
                <FormField
                  control={form.control}
                  name="scholarshipPercentage"
                  render={({ field }) => {
                    const inputValue = field.value === null || field.value === undefined
                      ? ""
                      : String(field.value);
                    return (<FormItem>
                      <FormLabel>Porcentaje de Beca</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          value={inputValue}
                          onChange={(e) => {
                            const value = e.target.value;
                            const numValue = value === ""
                              ? undefined
                              : Number(value);
                            field.onChange(numValue);
                          }}
                          placeholder="Ej: 50"
                          disabled={currentOperation === "view" || form.watch("scholarshipType") !== "active"}

                        />
                      </FormControl>
                      <FormMessage />
                      {form.watch("scholarshipType") === "active" && (
                        <p className="text-xs text-muted-foreground">
                          Ingresa el porcentaje de descuento (1-100%)
                        </p>
                      )}
                    </FormItem>
                    )
                  }}
                />)}
            </div>
          </div>
        )}
      </CrudDialog>
    </div>


  );
}
