"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@repo/convex/convex/_generated/api";
import { Button } from "@repo/ui/components/shadcn/button"
import { Input } from "@repo/ui/components/shadcn/input"
import { Label } from "@repo/ui/components/shadcn/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/shadcn/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@repo/ui/components/shadcn/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { Search, Plus, Edit, Trash2, MapPin, Users, Filter, GraduationCap, CheckCircle, XCircle, Eye } from "lucide-react"
import { toast } from "sonner";
import { Id } from "@repo/convex/convex/_generated/dataModel"

import { useUser } from "@clerk/nextjs"
import { useUserWithConvex } from "stores/userStore"
import { useCurrentSchool } from "stores/userSchoolsStore";
import { classroomFormSchema, ClassroomFormValues } from "@/types/form/classroomSchema";
import { CrudDialog, useCrudDialog } from "@repo/ui/components/dialog/crud-dialog";

interface Classroom extends Record<string, unknown> {
  _id: Id<"classroom">
  id: string
  name: string
  capacity: number
  location: string
  status: "active" | "inactive"
  createdAt: number
  updatedAt: number
}

interface ClassroomFormProps {
  form: any;
  operation: 'create' | 'edit' | 'view' | 'delete';
}

function ClassroomForm({ form, operation }: ClassroomFormProps) {
  const isView = operation === 'view';
   
  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nombre *</Label>
        <Input
          id="name"
          placeholder="Ingresa el nombre del aula"
          {...form.register("name")}
          readOnly={isView}
          required
          maxLength={50}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="capacity">Capacidad *</Label>
        <Input
          id="capacity"
          type="number"
          min="1"
          max="35"
          placeholder="Ingresa la capacidad"
          {...form.register("capacity", { valueAsNumber: true })}
          readOnly={isView}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="location">Ubicación *</Label>
        <Input
          id="location"
          placeholder="Ingresa la ubicación"
          {...form.register("location")}
          readOnly={isView}
          required
          maxLength={50}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="status">Estado</Label>
        <Select
          value={form.watch("status")}
          onValueChange={(value: "active" | "inactive") =>
            form.setValue("status", value)
          }
          disabled={isView}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona estatus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="inactive">Inactivo</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default function ClassroomManagement() {
  const { user: clerkUser, isLoaded } = useUser();
  const { currentUser, isLoading: userLoading } = useUserWithConvex(clerkUser?.id);
  const {
    currentSchool,
    isLoading: schoolLoading,
  } = useCurrentSchool(currentUser?._id);

  const classrooms = useQuery(
    api.functions.classroom.viewAllClassrooms,
    currentSchool?.school._id ? { schoolId: currentSchool.school._id } : "skip"
  ) as Classroom[] | undefined;

  const createClassroom = useMutation(api.functions.classroom.createClassroom)
  const updateClassroom = useMutation(api.functions.classroom.updateClassroom)
  const deleteClassroom = useMutation(api.functions.classroom.deleteClassroom)

  const {
    isOpen,
    operation,
    data,
    openCreate,
    openEdit,
    openView,
    openDelete,
    close,
  } = useCrudDialog(classroomFormSchema);

  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"name" | "location" | "capacity" | "createdAt">("location")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // Estado de carga específico para la tabla
  const isTableLoading = classrooms === undefined;

  // Esta sección es para filtrar, buscar y ordenar las aulas
  const filteredAndSortedClassrooms = (classrooms || [])
    .filter((c) => {
      const matchesSearch =
        c.name?.toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase()) ||
        c.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.capacity.toString().includes(searchTerm)

      const matchesLocation = locationFilter === "all" || c.location === locationFilter
      const matchesStatus = statusFilter === "all" || c.status === statusFilter

      return matchesSearch && matchesLocation && matchesStatus
    })
    .sort((a, b) => {
      let aValue: string | number = a[sortBy]
      let bValue: string | number = b[sortBy]

      if (sortBy === "createdAt") {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      // comparación para strings (name, location)
      if (typeof aValue === "string" && typeof bValue === "string") {
        if (sortOrder === "asc") {
          return aValue.localeCompare(bValue)
        } else {
          return bValue.localeCompare(aValue)
        }
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const getUniqueLocations = () => {
    const locations = (classrooms || []).map((c) => c.location || "")
    return [...new Set(locations)]
  }

  // crear y actualizar aulas
  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!currentSchool?.school._id) {
      toast.error("No se encontró la escuela actual. Refresca e intenta de nuevo.")
      return;
    }

    const parsedFormData = {
      ...values,
      capacity: Number(values.capacity)
    }

    // validación con zod
    const result = classroomFormSchema.safeParse(parsedFormData)

    if (!result.success) {
      // si hay errores, los mostramos y detenemos la función
      toast.error("Por favor revisa los campos: " + result.error.issues.map(e => e.message).join(", "))
      return
    }

    // los datos deben ser válidos... por lo tanto se continúa con:
    const validData = result.data

    // validación para que no haya duplicados
    const existingClassroom = (name: string, location: string) => {
      return (classrooms || []).some(
        (c) => c.name.trim().toLowerCase() === name.trim().toLowerCase() &&
          c.location.trim().toLowerCase() === location.trim().toLowerCase()
      )
    }

    // en el handleSubmit, antes de crear/editar checamos:
    if (existingClassroom(validData.name, validData.location) &&
        (operation !== 'edit' || (data && (data.name !== validData.name || data.location !== validData.location)))) {
      toast.error("Ya existe un aula con ese nombre y ubicación.");
      return;
    }

    try {
      if (operation === 'edit' && data?.id) {
        await updateClassroom({
          id: data.id as Id<"classroom">,
          schoolId: currentSchool.school._id as Id<"school">,
          name: validData.name,
          capacity: validData.capacity,
          location: validData.location,
          status: validData.status,
          updatedAt: Date.now(),
        })
        toast.success("Aula actualizada correctamente.")
      } else if (operation === 'create') {
        await createClassroom({
          schoolId: currentSchool.school._id as Id<"school">,
          name: validData.name,
          capacity: validData.capacity,
          location: validData.location,
          status: validData.status,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
        toast.success("Aula creada correctamente.")
      }
      close()
    } catch (error) {
      toast.error("Error al guardar el aula: " + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  }

  const handleEdit = (c: Classroom) => {
    openEdit(c);
  }

  const handleView = (c: Classroom) => {
    openView(c);
  }

  const handleDelete = async (id: string) => {
    await deleteClassroom({ id: id as Id<"classroom">, schoolId: currentSchool?.school._id as Id<"school"> })
    toast.success("Aula eliminada correctamente.")
    close();
  }

  const handleSort = (column: "name" | "location" | "capacity" | "createdAt") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }

  // Ya no es necesario el if de carga general

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <GraduationCap className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">Aulas</h1>
                  <p className="text-lg text-muted-foreground">
                    Administra las aulas de {currentSchool?.school?.name} con sus atributos de capacidad, ubicación y estado.
                  </p>
                </div>
              </div>
            </div>
            <Button
              size="lg"
              className="gap-2"
              onClick={openCreate}
            >
              <Plus className="h-4 w-4" />
              Agregar Aula
            </Button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Aulas
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">{classrooms?.length || 0}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aulas Activas
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">
              {classrooms?.filter(c => c.status === "active").length || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Capacidad Total
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">
              {classrooms?.reduce((sum, room) => sum + room.capacity, 0) || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Búsqueda */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros y Búsqueda
              </CardTitle>
              <CardDescription>
                Encuentra aulas por nombre, ubicación, capacidad o estado
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
                  placeholder="Buscar por nombre, ubicación o capacidad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filtrar ubicación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las ubicaciones</SelectItem>
                  {getUniqueLocations().map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filtrar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activas</SelectItem>
                  <SelectItem value="inactive">Inactivas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Aulas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Aulas</span>
            <Badge variant="outline">
              {isTableLoading ? 'Cargando...' : `${filteredAndSortedClassrooms.length} aulas`}
            </Badge>
          </CardTitle>
          <CardDescription>
            {isTableLoading ? 'Cargando información de aulas...' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isTableLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando aulas...</p>
            </div>
          ) : filteredAndSortedClassrooms.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm || locationFilter !== "all" || statusFilter !== "all"
                  ? "No se encontraron aulas"
                  : "No hay aulas registradas"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || locationFilter !== "all" || statusFilter !== "all"
                  ? "Intenta ajustar los filtros de búsqueda."
                  : "Comienza creando tu primera aula."}
              </p>
              <Button
                size="lg"
                className="gap-2"
                onClick={openCreate}
              >
                <Plus className="h-4 w-4" />
                agregar Aula
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("name")}>
                      Nombre {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("location")}>
                      Ubicación {sortBy === "location" && (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("capacity")}>
                      Capacidad {sortBy === "capacity" && (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("createdAt")}>
                      Creado {sortBy === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedClassrooms.map((classroom) => (
                    <TableRow key={classroom.id}>
                      <TableCell className="font-medium">
                        {classroom.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {classroom.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {classroom.capacity} estudiantes
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={classroom.status === "active" ? "default" : "secondary"}
                          className={classroom.status === "active" ? "bg-green-600 text-white" : "bg-gray-600/70 text-white"}
                        >
                          {classroom.status === "active" ? "Activa" : "Inactiva"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(classroom.createdAt).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(classroom)}
                          className="hover:scale-105 transition-transform cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(classroom)}
                          className="hover:scale-105 transition-transform cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(classroom.id)}
                          className="hover:scale-105 transition-transform cursor-pointer text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para CRUD de aulas */}
      <CrudDialog
        operation={operation}
        title={operation === 'create'
          ? 'Crear Nueva Aula'
          : operation === 'edit'
            ? 'Editar Aula'
            : 'Ver Aula'
        }
        description={operation === 'create'
          ? 'Ingresa los detalles para la nueva aula.'
          : operation === 'edit'
            ? 'Actualiza la información del aula a continuación.'
            : 'Información detallada del aula.'
        }
        schema={classroomFormSchema}
        defaultValues={{
          name: "",
          capacity: 0,
          location: "",
          status: "active",
        }}
        data={data}
        isOpen={isOpen}
        onOpenChange={close}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      >
        {(form, operation) => (
          <ClassroomForm
            form={form}
            operation={operation}
          />
        )}
      </CrudDialog>
    </div>
  )
}