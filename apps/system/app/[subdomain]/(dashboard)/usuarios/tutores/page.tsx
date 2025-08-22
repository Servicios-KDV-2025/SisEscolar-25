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
  Shield, Users, Search, Plus, Eye, Edit, Trash2, Filter, 
  Mail, Phone, MapPin, Calendar, UserCheck, UserX, Heart
} from "@repo/ui/icons";
import { tutorSchema, type TutorWithSchoolInfo } from "@/types/form/userSchemas";

type Tutor = TutorWithSchoolInfo;

// Datos de ejemplo (mock data)
const mockTutors: Tutor[] = [
  {
    _id: "1",
    name: "Isabel",
    lastName: "García Morales",
    email: "isabel.garcia@escuela.edu.mx",
    phone: "+52 555 1234567",
    address: "Av. Educación 123, CDMX",
    status: "active",
    _creationTime: Date.now() - 86400000 * 30,
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 5,
    clerkId: "clerk_isabel123",
    admissionDate: Date.now() - 86400000 * 365,
    userSchool: {
      _id: "us1",
      userId: "1",
      schoolId: "school1",
      role: ["tutor"],
      status: "active",
      department: "direction",
      _creationTime: Date.now() - 86400000 * 30,
      createdAt: Date.now() - 86400000 * 30,
      updatedAt: Date.now() - 86400000 * 5,
    }
  },
  {
    _id: "2", 
    name: "Carlos",
    lastName: "Ruiz Silva",
    email: "carlos.ruiz@escuela.edu.mx",
    phone: "+52 555 2345678",
    address: "Calle Principal 456, CDMX",
    status: "active",
    _creationTime: Date.now() - 86400000 * 60,
    createdAt: Date.now() - 86400000 * 60,
    updatedAt: Date.now() - 86400000 * 2,
    clerkId: "clerk_carlos456",
    admissionDate: Date.now() - 86400000 * 500,
    userSchool: {
      _id: "us2",
      userId: "2",
      schoolId: "school1",
      role: ["tutor"],
      status: "active",
      department: "schoolControl",
      _creationTime: Date.now() - 86400000 * 60,
      createdAt: Date.now() - 86400000 * 60,
      updatedAt: Date.now() - 86400000 * 2,
    }
  },
  {
    _id: "3",
    name: "María",
    lastName: "López Vega",
    email: "maria.lopez@escuela.edu.mx", 
    phone: "+52 555 3456789",
    status: "inactive",
    _creationTime: Date.now() - 86400000 * 90,
    createdAt: Date.now() - 86400000 * 90,
    updatedAt: Date.now() - 86400000 * 10,
    clerkId: "clerk_maria789",
    admissionDate: Date.now() - 86400000 * 200,
    userSchool: {
      _id: "us3",
      userId: "3",
      schoolId: "school1",
      role: ["tutor"],
      status: "inactive",
      department: "secretary",
      _creationTime: Date.now() - 86400000 * 90,
      createdAt: Date.now() - 86400000 * 90,
      updatedAt: Date.now() - 86400000 * 10,
    }
  },
  {
    _id: "4",
    name: "Antonio",
    lastName: "Mendoza Castro",
    email: "antonio.mendoza@escuela.edu.mx",
    phone: "+52 555 4567890",
    address: "Zona Escolar 789, CDMX",
    status: "active",
    _creationTime: Date.now() - 86400000 * 15,
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now() - 86400000 * 1,
    clerkId: "clerk_antonio012",
    admissionDate: Date.now() - 86400000 * 180,
    userSchool: {
      _id: "us4",
      userId: "4",
      schoolId: "school1",
      role: ["tutor"],
      status: "active",
      department: "technology",
      _creationTime: Date.now() - 86400000 * 15,
      createdAt: Date.now() - 86400000 * 15,
      updatedAt: Date.now() - 86400000 * 1,
    }
  },
];

export default function TutoresPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

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
  } = useCrudDialog(tutorSchema, {
    status: "active",
    admissionDate: Date.now(),
  });

  // Filtrado de datos
  const filteredTutors = useMemo(() => {
    return mockTutors.filter((tutor) => {
      const searchMatch = 
        tutor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tutor.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tutor.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const statusMatch = statusFilter === "all" || tutor.status === statusFilter;
      const departmentMatch = departmentFilter === "all" || tutor.userSchool?.department === departmentFilter;
      
      return searchMatch && statusMatch && departmentMatch;
    });
  }, [searchTerm, statusFilter, departmentFilter]);

  // Funciones CRUD (mock)
  const handleCreate = async (data: Record<string, unknown>) => {
    console.log("Crear tutor:", data);
    // Aquí iría la integración con Convex
  };

  const handleUpdate = async (data: Record<string, unknown>) => {
    console.log("Actualizar tutor:", data);
    // Aquí iría la integración con Convex
  };

  const handleDelete = async (id: string) => {
    console.log("Eliminar tutor:", id);
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

  const getDepartmentLabel = (department?: string) => {
    const labels = {
      secretary: "Secretaría",
      direction: "Dirección",
      schoolControl: "Control Escolar",
      technology: "Tecnología"
    };
    return department ? labels[department as keyof typeof labels] : "No asignado";
  };

  const getDepartmentColor = (department?: string) => {
    const colors = {
      secretary: "bg-blue-100 text-blue-800",
      direction: "bg-purple-100 text-purple-800",
      schoolControl: "bg-green-100 text-green-800",
      technology: "bg-orange-100 text-orange-800"
    };
    return department ? colors[department as keyof typeof colors] : "bg-gray-100 text-gray-800";
  };

  const stats = [
    {
      title: "Total Tutores",
      value: mockTutors.length.toString(),
      icon: Users,
      trend: "Usuarios registrados"
    },
    {
      title: "Activos",
      value: mockTutors.filter(tutor => tutor.status === "active").length.toString(),
      icon: UserCheck,
      trend: "Estado activo"
    },
    {
      title: "Inactivos", 
      value: mockTutors.filter(tutor => tutor.status === "inactive").length.toString(),
      icon: UserX,
      trend: "Estado inactivo"
    },
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500/10 via-pink-500/5 to-background border">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-pink-500/10 rounded-xl">
                  <Heart className="h-8 w-8 text-pink-600" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">Tutores</h1>
                  <p className="text-lg text-muted-foreground">
                    Gestión de usuarios con permisos de tutoría y seguimiento estudiantil
                  </p>
                </div>
              </div>
            </div>
            <Button size="lg" className="gap-2" onClick={openCreate}>
              <Plus className="w-4 h-4" />
              Agregar Tutor
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
              <div className="p-2 bg-pink-500/10 rounded-lg group-hover:bg-pink-500/20 transition-colors">
                <stat.icon className="h-4 w-4 text-pink-600" />
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
                Encuentra tutores por nombre, email, estado o departamento
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
                  placeholder="Buscar por nombre, apellido o email..."
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
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los departamentos</SelectItem>
                <SelectItem value="secretary">Secretaría</SelectItem>
                <SelectItem value="direction">Dirección</SelectItem>
                <SelectItem value="schoolControl">Control Escolar</SelectItem>
                <SelectItem value="technology">Tecnología</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Tutores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Tutores</span>
            <Badge variant="outline">{filteredTutors.length} usuarios</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha de Ingreso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTutors.map((tutor) => (
                  <TableRow key={tutor._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={tutor.imgUrl} alt={tutor.name} />
                          <AvatarFallback className="bg-pink-500/10">
                            {getInitials(tutor.name, tutor.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {tutor.name} {tutor.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {tutor.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={getDepartmentColor(tutor.userSchool?.department)}
                      >
                        {getDepartmentLabel(tutor.userSchool?.department)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {tutor.phone && (
                          <div className="text-sm flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {tutor.phone}
                          </div>
                        )}
                        {tutor.address && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {tutor.address}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={tutor.status === "active" ? "default" : "secondary"}
                        className={tutor.status === "active" ? "bg-green-500 hover:bg-green-600" : ""}
                      >
                        {tutor.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {formatDate(tutor.admissionDate)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openView(tutor)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(tutor)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDelete(tutor)}
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
          
          {filteredTutors.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No se encontraron tutores</h3>
              <p className="text-muted-foreground mb-4">
                Intenta ajustar los filtros o agregar un nuevo tutor.
              </p>
              <Button onClick={openCreate} className="gap-2">
                <Plus className="w-4 h-4" />
                Agregar Tutor
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
            ? "Agregar Tutor"
            : operation === "edit"
            ? "Editar Tutor"
            : operation === "view"
            ? "Ver Tutor"
            : "Eliminar Tutor"
        }
        description={
          operation === "create"
            ? "Completa la información para agregar un nuevo tutor"
            : operation === "edit"
            ? "Modifica la información del tutor"
            : operation === "view"
            ? "Información detallada del tutor"
            : undefined
        }
        schema={tutorSchema}
        data={data}
        isOpen={isOpen}
        onOpenChange={close}
        onSubmit={operation === "create" ? handleCreate : handleUpdate}
        onDelete={handleDelete}
        deleteConfirmationTitle="¿Eliminar tutor?"
        deleteConfirmationDescription="Esta acción eliminará permanentemente al tutor del sistema. Esta acción no se puede deshacer."
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
                      placeholder="Nombre del tutor"
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      value={field.value as string || ""}
                      type="email"
                      placeholder="email@escuela.edu.mx"
                      disabled={currentOperation === "view"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      value={field.value as string || ""}
                      placeholder="+52 555 1234567"
                      disabled={currentOperation === "view"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      value={field.value as string || ""}
                      placeholder="Dirección completa"
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

            {currentOperation === "view" && data && (
              <div className="md:col-span-2 space-y-4 pt-4 border-t">
                <h3 className="font-medium text-sm text-muted-foreground">Información adicional</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">ID de Usuario:</span>
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
                    <span className="text-muted-foreground">Clerk ID:</span>
                    <p className="font-mono">{data.clerkId as string}</p>
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
