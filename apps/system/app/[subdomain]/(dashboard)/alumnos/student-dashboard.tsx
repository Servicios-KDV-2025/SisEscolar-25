// components/student-dashboard.tsx
"use client"

import { useState, useMemo } from "react"
import { Search, Plus, MoreHorizontal, Edit, UserX } from "@repo/ui/icons"
import { Button } from "@repo/ui/components/shadcn/button"
import { Input } from "@repo/ui/components/shadcn/input"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/shadcn/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@repo/ui/components/shadcn/dropdown-menu"
import type { Doc, Id } from "@repo/convex/convex/_generated/dataModel"
import { useQuery } from "convex/react" 
import { api } from "@repo/convex/convex/_generated/api"
import { useCurrentSchool } from "../../../../stores/userSchoolsStore";
import { useUser } from "@clerk/nextjs";
import { useUserWithConvex } from "../../../../stores/userStore";

type Student = Doc<"student">;

// --- Datos de prueba temporales ---
const mockTutors = [
  { _id: "66e77b6326e06b97b0a7b454" as Id<"user">, name: "Ms. Smith" },
  { _id: "66e77b6326e06b97b0a7b455" as Id<"user">, name: "Mr. Davis" },
  { _id: "66e77b6326e06b97b0a7b456" as Id<"user">, name: "Ms. Wilson" },
];
// --- Fin de los datos de prueba ---

interface StudentDashboardProps {
  students: Student[]
  onAddStudent: () => void
  onEditStudent: (student: Student) => void
  onDeactivateStudent: (student: Student) => void
}

export function StudentDashboard({
  students,
  onAddStudent,
  onEditStudent,
  onDeactivateStudent,
}: StudentDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [groupFilter, setGroupFilter] = useState<Id<"group"> | "all">("all")
  const [tutorFilter, setTutorFilter] = useState<Id<"user"> | "all">("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  
  const { user: clerkUser } = useUser();
    const { currentUser } = useUserWithConvex(clerkUser?.id);
    
    // Get current school information using the subdomain
    const {
      currentSchool,
      isLoading: schoolLoading,
    } = useCurrentSchool(currentUser?._id);

  const groups = useQuery(
    api.functions.group.getAllGroupsBySchool,
    currentSchool ? { schoolId: currentSchool.school._id } : "skip"
  );

  // const tutors = useQuery(api.functions.user.listTutors);
  
  const tutors = mockTutors; // Usamos los datos de prueba


  // Filtrar estudiantes basados en la búsqueda y los filtros
  const filteredStudents = useMemo(() => {
    // Si los datos de grupos o tutores no han cargado, muestra un array vacío
    if (!students || !groups || !tutors) return [];

    return students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        student.enrollment.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesGroup = groupFilter === "all" || student.groupId === groupFilter
      const matchesTutor = tutorFilter === "all" || student.tutorId === tutorFilter
      const matchesStatus = statusFilter === "all" || student.status === statusFilter

      return matchesSearch && matchesGroup && matchesTutor && matchesStatus
    })
  }, [students, groups, tutors, searchTerm, groupFilter, tutorFilter, statusFilter])

  const activeStudents = students.filter((s) => s.status === "active").length
  const inactiveStudents = students.filter((s) => s.status === "inactive").length

  // Ya no necesitamos un estado de carga aquí porque los datos son estáticos
  if (!students || !groups || !tutors ||schoolLoading) {
      return <div>Cargando datos...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Estudiantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{students.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{activeStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{inactiveStudents}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Estudiantes</CardTitle>
            <Button onClick={onAddStudent} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Estudiante
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Busqueda por nombre o matricula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={groupFilter} onValueChange={(value) => setGroupFilter(value as Id<"group"> | "all")}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Grupos</SelectItem>
                {groups.map((group) => {
                  return (
                    <SelectItem key={group._id} value={group._id}>
                     {group.grade} {group.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Select value={tutorFilter} onValueChange={(value) => setTutorFilter(value as Id<"user"> | "all")}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by tutor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutores</SelectItem>
                {tutors.map((tutor) => {
                  return (
                    <SelectItem key={tutor._id} value={tutor._id}>
                      {tutor.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Estado</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Students Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Enrollment</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Tutor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No students found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell className="font-medium">
                        {student.name} {student.lastName}
                      </TableCell>
                      <TableCell>{student.enrollment}</TableCell>
                      <TableCell>
                        {groups.find((g) => g._id === student.groupId)?.name ?? "N/A"}
                      </TableCell>
                      <TableCell>
                        {tutors.find((t) => t._id === student.tutorId)?.name ?? "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={student.status === "active" ? "default" : "secondary"}
                          className={student.status === "active" ? "bg-accent hover:bg-accent/80" : ""}
                        >
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEditStudent(student)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {student.status === "active" && (
                              <DropdownMenuItem
                                onClick={() => onDeactivateStudent(student)}
                                className="text-destructive focus:text-destructive"
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                Deactivate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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