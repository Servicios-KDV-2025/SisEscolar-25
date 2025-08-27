"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/shadcn/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/shadcn/avatar";
import { CrudDialog, useCrudDialog } from "@repo/ui/components/dialog/crud-dialog";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@repo/ui/components/shadcn/form";
import { 
   Users, Search, Plus, Eye, Edit, Trash2, Filter,  Calendar, UserCheck, UserX, GraduationCap,
} from "@repo/ui/icons";
import { studentSchema, type StudentWithMetadata } from "@/types/form/userSchemas";

type Student = StudentWithMetadata;

// Datos de ejemplo (mock data)
const mockStudents: Student[] = [
  {
    _id: "1",
    schoolId: "school1",
    groupId: "group1",
    tutorId: "tutor1",
    enrollment: "2024-001",
    name: "Ana Sofía",
    lastName: "Martínez López",
    birthDate: Date.now() - 86400000 * 365 * 15, // 15 años
    admissionDate: Date.now() - 86400000 * 90,
    imgUrl: "",
    status: "active",
    _creationTime: Date.now() - 86400000 * 90,
    createdAt: Date.now() - 86400000 * 90,
    updatedAt: Date.now() - 86400000 * 5,
  },
  {
    _id: "2",
    schoolId: "school1",
    groupId: "group1",
    tutorId: "tutor1",
    enrollment: "2024-002",
    name: "Carlos Eduardo",
    lastName: "García Silva",
    birthDate: Date.now() - 86400000 * 365 * 16, // 16 años
    admissionDate: Date.now() - 86400000 * 120,
    imgUrl: "",
    status: "active",
    _creationTime: Date.now() - 86400000 * 120,
    createdAt: Date.now() - 86400000 * 120,
    updatedAt: Date.now() - 86400000 * 10,
  },
  {
    _id: "3",
    schoolId: "school1",
    groupId: "group2",
    tutorId: "tutor2",
    enrollment: "2024-003",
    name: "María Fernanda",
    lastName: "Rodríguez Vega",
    birthDate: Date.now() - 86400000 * 365 * 14, // 14 años
    admissionDate: Date.now() - 86400000 * 60,
    imgUrl: "",
    status: "inactive",
    _creationTime: Date.now() - 86400000 * 60,
    createdAt: Date.now() - 86400000 * 60,
    updatedAt: Date.now() - 86400000 * 15,
  },
  {
    _id: "4",
    schoolId: "school1",
    groupId: "group2",
    tutorId: "tutor2",
    enrollment: "2024-004",
    name: "Diego Alejandro",
    lastName: "Hernández Morales",
    birthDate: Date.now() - 86400000 * 365 * 15, // 15 años
    admissionDate: Date.now() - 86400000 * 30,
    imgUrl: "",
    status: "active",
    _creationTime: Date.now() - 86400000 * 30,
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 2,
  },
];

// Mock data para grupos y tutores
const mockGroups = [
  { id: "group1", name: "1°A", grade: "1°" },
  { id: "group2", name: "1°B", grade: "1°" },
  { id: "group3", name: "2°A", grade: "2°" },
  { id: "group4", name: "2°B", grade: "2°" },
];

const mockTutors = [
  { id: "tutor1", name: "Isabel García Morales" },
  { id: "tutor2", name: "Carlos Ruiz Silva" },
];

export default function AlumnosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");

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
  } = useCrudDialog(studentSchema, {
    status: "active",
    admissionDate: Date.now(),
  });

  // Filtrado de datos
  const filteredStudents = useMemo(() => {
    return mockStudents.filter((student) => {
      const searchMatch = 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.enrollment.toLowerCase().includes(searchTerm.toLowerCase());
      
      const statusMatch = statusFilter === "all" || student.status === statusFilter;
      const groupMatch = groupFilter === "all" || student.groupId === groupFilter;
      
      return searchMatch && statusMatch && groupMatch;
    });
  }, [searchTerm, statusFilter, groupFilter]);

  // Funciones CRUD (mock)
  const handleCreate = async (data: Record<string, unknown>) => {
    console.log("Crear alumno:", data);
    // Aquí iría la integración con Convex
  };

  const handleUpdate = async (data: Record<string, unknown>) => {
    console.log("Actualizar alumno:", data);
    // Aquí iría la integración con Convex
  };

  const handleDelete = async (id: string) => {
    console.log("Eliminar alumno:", id);
    // Aquí iría la integración con Convex
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
    const group = mockGroups.find(g => g.id === groupId);
    return group ? `${group.grade} - ${group.name}` : "No asignado";
  };

  const getTutorInfo = (tutorId: string) => {
    const tutor = mockTutors.find(t => t.id === tutorId);
    return tutor ? tutor.name : "No asignado";
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
      value: mockStudents.length.toString(),
      icon: Users,
      trend: "Estudiantes registrados"
    },
    {
      title: "Activos",
      value: mockStudents.filter(student => student.status === "active").length.toString(),
      icon: UserCheck,
      trend: "Estado activo"
    },
    {
      title: "Inactivos", 
      value: mockStudents.filter(student => student.status === "inactive").length.toString(),
      icon: UserX,
      trend: "Estado inactivo"
    },
  ];

  return (
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
            <Button size="lg" className="gap-2" onClick={openCreate}>
              <Plus className="w-4 h-4" />
              Agregar Alumno
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
                {mockGroups.map(group => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.grade} - {group.name}
                  </SelectItem>
                ))}
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
                {filteredStudents.map((student) => (
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
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDelete(student)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredStudents.length === 0 && (
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
                        {mockGroups.map(group => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.grade} - {group.name}
                          </SelectItem>
                        ))}
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tutor *</FormLabel>
                  <FormControl>
                    <Select 
                      value={field.value as string} 
                      onValueChange={field.onChange}
                      disabled={currentOperation === "view"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tutor" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockTutors.map(tutor => (
                          <SelectItem key={tutor.id} value={tutor.id}>
                            {tutor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
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
