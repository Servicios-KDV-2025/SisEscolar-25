"use client"

//import type React from "react"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"  //
import { api } from "@repo/convex/convex/_generated/api"; //
import { Button } from "@repo/ui/components/shadcn/button"
import { Input } from "@repo/ui/components/shadcn/input"
import { Label } from "@repo/ui/components/shadcn/label"
import {Id} from "@repo/convex/convex/_generated/dataModel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/shadcn/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "@repo/ui/components/shadcn/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { Search, Plus, Edit, Trash2, MapPin, Users, Filter } from "lucide-react"
import { toast } from "sonner";

import {useUser} from "@clerk/nextjs"
import { useUserWithConvex } from "stores/userStore"
import { useCurrentSchool } from "stores/userSchoolsStore";


interface Classroom {
  id: string;
  name: string;
  capacity: number;
  location: string;
  status: "active" | "inactive";
  createdAt: number;
  updatedAt: number;
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
    currentSchool?.school._id? { schoolId: currentSchool.school._id } : "skip"
  ) as Classroom[] | undefined;


  //const schoolId = "school" // este es el ID que estamos manejando?????

  //con esto nos traemos las aulas desde convex
  //const classroom = useQuery(api.classroom.viewAllClassrooms, { schoolId }) || []

  //5. mutations para crear/ actualizar y eliminar aulas de convex
  const createClassroom = useMutation(api.functions.classroom.createClassroom)
  const updateClassroom = useMutation(api.functions.classroom.updateClassroom)
  const deleteClassroom = useMutation(api.functions.classroom.deleteClassroom)



  //6. estados UI
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"location" | "capacity" | "createdAt">("location")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    capacity: "",
    location: "",
    status: "active" as "active" | "inactive",
  })

  const isLoading = !isLoaded || userLoading || schoolLoading || classrooms === undefined;
  if (isLoading) {
    return <p>Cargando aulas...</p>
  }



//esta seccion es para filtrar, buscar y ordenar las aulas 
  const filteredAndSortedClassrooms = (classrooms || [])
    .filter((c) => {
      const matchesSearch =
        c.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.capacity.toString().includes(searchTerm)

      const matchesLocation = locationFilter === "all" || c.location === locationFilter
      const matchesStatus = statusFilter === "all" || c.status === statusFilter

      return matchesSearch && matchesLocation && matchesStatus
    })
    .sort((a, b) => {
      let aValue: string | number | null = a[sortBy]
      let bValue: string | number | null = b[sortBy]
      //cambio de any por el tipo de varible que es

      if (sortBy === "createdAt") {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const getUniqueLocations = () => {
  const locations = (classrooms || [])
    .map((c) => c.location)
    .filter((location): location is string => Boolean(location?.trim())) 
  return [...new Set(locations)]
}

  // crear y actualizar aulas
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.capacity || !formData.location) {

      toast.error("Por favor llena todos los campos obligatorios.")
      return
    }

    if (editingClassroom) {
      await updateClassroom({
        id: editingClassroom.id as Id<"classroom">,
        schoolId: currentSchool!.school._id,
        name: formData.location,
        capacity: Number.parseInt(formData.capacity),
        location: formData.location,
        status: formData.status,
        updatedAt: Date.now(),
      });
      toast.success("Aula actualizada correctamente.")
    } else {
      await createClassroom({
        schoolId: currentSchool?.school._id as Id<"school">,
        name: formData.location,
        capacity: Number.parseInt(formData.capacity),
        location: formData.location,
        status: formData.status,  
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
      capacity:c.capacity.toString(),
      location: c.location || "",
      status: c.status,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    await deleteClassroom({id: id as Id<"classroom">, schoolId: currentSchool?.school._id as Id<"school">} )
    toast.success("Aula eliminada correctamente.")
  }

  const resetForm = () => {
    setFormData({ name: "", capacity: "", location: "", status: "active"})
    setEditingClassroom(null)
    setIsDialogOpen(false)
  }
  
  const handleSort = (column: "location" | "capacity" | "createdAt") => {
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
      <div className="flex flex-col gap-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sistema de creación de Aulas</h1>
          <p className="text-gray-600 mt-2">Gestionar la creación de aulas con atributos de capacidad, ubicación y estado. </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Búsqueda por ubicación o capacidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Aula
              </Button>
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
                    <Label htmlFor="capacity">Capacidad *</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      placeholder="Ingresa la capacidad"
                      value={formData.capacity}
                      onChange={(e) => setFormData((prev) => ({ ...prev, capacity: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location">Ubicación *</Label>
                    <Input
                      id="location"
                      placeholder="Ingresa la ubicación/nombre"
                      value={formData.location}
                      onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Estatus</Label>
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
                  <Button type="submit">{editingClassroom ? "Actualizar" : "Crear"} Aula</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filtros:</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="location-filter" className="text-xs text-muted-foreground">
                Locación
              </Label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todas las locaciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las locaciones</SelectItem>
                  {getUniqueLocations().map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="status-filter" className="text-xs text-muted-foreground">
                Status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas los status</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Salones</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classrooms?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacidad Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classrooms?.reduce((sum: number, room: Classroom) => sum + room.capacity, 0) || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Classrooms Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Aulas</CardTitle>
          <CardDescription>Administra todas las aulas con su capacidad, ubicación y estado.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
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
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchTerm || locationFilter !== "all" || statusFilter !== "all"
                        ? "No classrooms found matching your filters."
                        : "No classrooms registered yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedClassrooms.map((classroom) => (
                    <TableRow key={classroom.id}>
                      <TableCell className="font-medium">
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
                        <Badge variant={classroom.status === "active" ? "default" : "secondary"}>
                          {classroom.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(classroom.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(classroom)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(classroom.id)}>
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
