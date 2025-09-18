"use client"

//import type React from "react"

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
import { Search, Plus, Edit, Trash2, MapPin, Users, Filter, GraduationCap } from "lucide-react"
import { toast } from "sonner";
import { Id } from "@repo/convex/convex/_generated/dataModel"


import { useUser } from "@clerk/nextjs"
import { useUserWithConvex } from "stores/userStore"
import { useCurrentSchool } from "stores/userSchoolsStore";
import { classroomFormSchema, ClassroomFormValues } from "@/types/form/classroomSchema";


interface Classroom {
  id: string
  name: string
  capacity: number
  location: string
  status: "active" | "inactive"
  createdAt: number
  updatedAt: number
}

export default function ClassroomManagement() {

  //1. Traerse usuario de clerk 
  const { user: clerkUser, isLoaded } = useUser();

  //2. Traerse al usuario de convex 
  const { currentUser, isLoading: userLoading } = useUserWithConvex(clerkUser?.id);

  //3. Conseguir la escuela actual 
  const {
    currentSchool,
    isLoading: schoolLoading,
  } = useCurrentSchool(currentUser?._id);

  //4. Hacer un query a Convex(para traerse todas las aulas de la escuela actual)
  const classrooms = useQuery(
    api.functions.classroom.viewAllClassrooms,
    currentSchool?.school._id ? { schoolId: currentSchool.school._id } : "skip"
  ) as Classroom[] | undefined;


  //5. mutations para crear/ actualizar y eliminar aulas de convex
  const createClassroom = useMutation(api.functions.classroom.createClassroom)
  const updateClassroom = useMutation(api.functions.classroom.updateClassroom)
  const deleteClassroom = useMutation(api.functions.classroom.deleteClassroom)


  //6. estados UI
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"name" | "location" | "capacity" | "createdAt">("location")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null)
  const [formData, setFormData] = useState<ClassroomFormValues>({
    name: "",
    capacity: 0,
    location: "",
    status: "active",
  })

  const isLoading = !isLoaded || userLoading || schoolLoading
  if (isLoading) {
    return <p>Cargando aulas...</p>
  }



  //esta seccion es para filtrar, buscar y ordenar las aulas 
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

      //comparación para strings (name, location)
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.capacity) {
      toast.error("La capacidad es obligatoria.");
      return;
    }

    // Convertimos capacity a número antes de validar
    const parsedFormData = {
      ...formData,
      capacity: Number(formData.capacity)
    }
    // validación con 0
    const result = classroomFormSchema.safeParse(parsedFormData)

    if (!result.success) {
      //si hay errores, los mostramos y detenemos la función
      toast.error("Por favor revisa los campos: " + result.error.issues.map(e => e.message).join(", "))
      return
    }

    //los datos deben ser validos... por lo tanto se continua con: 
    const validData = result.data

    //validación para que no haya duplicados
    const existingClassroom = (name: string, location: string) => {
      return (classrooms || []).some(
        (c) => c.name.trim().toLowerCase() === name.trim().toLocaleLowerCase() &&
          c.location.trim().toLowerCase() === location.trim().toLocaleLowerCase()
      )
    }

    // en el handleSubmit, antes de crear/editar checamos:
    if (existingClassroom(formData.name, formData.location) && (!editingClassroom ||
      (editingClassroom.name !== formData.name || editingClassroom.location !== formData.location))) {
      toast.error("Ya existe un aula con ese nombre y ubicación.");
      return;
    }

    if (!currentSchool?.school._id) {
      toast.error("No se encontró la escuela actual. Refresca e intenta de nuevo.")
    }

    if (editingClassroom) {
      await updateClassroom({
        id: editingClassroom.id as Id<"classroom">,
        schoolId: currentSchool?.school._id as Id<"school">,
        name: validData.name,
        capacity: validData.capacity,
        location: validData.location,
        status: validData.status,
        updatedAt: Date.now(),
      })
      toast.success("Aula actualizada correctamente.")
    } else {
      await createClassroom({
        schoolId: currentSchool?.school._id as Id<"school">,
        name: validData.name,
        capacity: validData.capacity,
        location: validData.location,
        status: validData.status,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      toast.success("Aula creada correctamente.")
    }
    resetForm()
  }

  const handleEdit = (c: Classroom) => {
    setEditingClassroom(c)
    setFormData({
      name: c.name,
      capacity: c.capacity,
      location: c.location || "",
      status: c.status,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    await deleteClassroom({ id: id as Id<"classroom">, schoolId: currentSchool?.school._id as Id<"school"> }) //Listo
    toast.success("Aula eliminada correctamente.")
  }

  const resetForm = () => {
    setFormData({ name: "", capacity: 0, location: "", status: "active" });
    setEditingClassroom(null)
    setIsDialogOpen(false)
  }

  const handleSort = (column: "name" | "location" | "capacity" | "createdAt") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-500/10 via-gray-500/5 to-background border">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gray-500/10 rounded-xl">
                  <GraduationCap className="h-8 w-8 text-black-600" />
                </div>
                <div>
                  <div className="relative flex-1  mb-4">
                    <h1 className="text-4xl font-bold text-gray-900">Sistema de creación de Aulas</h1>
                    <p className="text-lg text-gray-600 mt-2">Gestionar la creación de aulas con atributos de capacidad, ubicación y estado. </p>
                  </div>
                </div>
              </div>

            </div>
            <Button onClick={isDialogOpen ? () => setIsDialogOpen(false) : () => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Aula el regreso del aula
            </Button>
          </div>
        </div>
      </div>

      {/* dialog para crear alulas */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingClassroom ? "Editar Aula" : "Crear Nueva Aula"}</DialogTitle>
            <DialogDescription>
              {editingClassroom
                ? "Actualiza la información del aula a continuación."
                : "Ingresa los detalles para la nueva aula."}

            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  placeholder="Ingresa el nombre del aula"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
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
                  defaultValue={formData.capacity}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setFormData((prev) => ({
                      ...prev,
                      capacity: isNaN(value) ? 0 : value,
                    }));
                  }}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Ubicación *</Label>
                <Input
                  id="location"
                  placeholder="Ingresa la ubicación"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  required
                  maxLength={50}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Estados</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive") =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit">{editingClassroom ? "Editar" : "Crear"} Aula</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>



      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Salones</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classrooms?.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacidad Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classrooms?.reduce((sum, room) => sum + room.capacity, 0)}</div>
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
                Encuentra aulas por nombre, ubicación o estado
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
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Ubicación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Total Ubicaciones</SelectItem>
                {getUniqueLocations().map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Classrooms Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Aulas</CardTitle>
          <CardDescription>Administra todas las aulas con su nombre, capacidad, ubicación y estado.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("name")}>
                    Nombre
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
                {filteredAndSortedClassrooms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm || locationFilter !== "all" || statusFilter !== "all"
                        ? "No se encontraron aulas que coincidan con tus filtros."
                        : "No se encontraron aulas registradas."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedClassrooms.map((classroom) => (
                    <TableRow key={classroom.id}>
                      <TableCell className="font-medium">
                        {classroom.name}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {classroom.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {classroom.capacity} students
                        </div>
                      </TableCell>
                      <TableCell>

                        <Badge className={`text-center text-white font-medium py-1 ${classroom.status === "active" ? "bg-green-600 px-3" : "bg-red-600"}`}>
                          {classroom.status === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(classroom.createdAt).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(classroom)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(classroom.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
