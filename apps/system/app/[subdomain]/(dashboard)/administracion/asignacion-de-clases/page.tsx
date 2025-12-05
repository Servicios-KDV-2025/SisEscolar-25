"use client"

import { useMemo, useState } from "react"
import { Plus, Search, Eye, Trash2, School, Filter, Pencil, BookUser, User, BookOpen, GraduationCap, Calendar, Users } from "@repo/ui/icons"
import { useEffect } from "react"
import { Button } from "@repo/ui/components/shadcn/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card"
import { Input } from "@repo/ui/components/shadcn/input"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/shadcn/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/shadcn/tabs"
import { useMutation, useQuery } from "convex/react"
import { api } from "@repo/convex/convex/_generated/api"
import { Id } from "@repo/convex/convex/_generated/dataModel"
import { toast } from "@repo/ui/sonner"
import { CrudDialog, useCrudDialog } from "@repo/ui/components/dialog/crud-dialog"
import { FormControl, FormField, FormItem, FormLabel } from "@repo/ui/components/shadcn/form"
import { Switch } from "@repo/ui/components/shadcn/switch"
import { useUser } from "@clerk/nextjs"
import { useUserWithConvex } from "stores/userStore"
import { useCurrentSchool } from "stores/userSchoolsStore"
import { StudentClassDto, studentClassSchema } from "schema/studentClassSchema"
import { StudentClasses } from "@/types/studentClass"
import { SelectPopover } from "../../../../../components/selectPopover"
import { Student } from "@/types/student"
import { usePermissions } from 'hooks/usePermissions'
import { type ClassCatalogWithDetails, useClassCatalogWithPermissions } from 'stores/classCatalogStore'
import { useCicloEscolarWithConvex } from 'stores/useSchoolCiclesStore'
import { ChartNoAxesCombined } from 'lucide-react'
import MassAssignmentStudets from "components/classAssignment/MassAssignmentStudents"
import { useCrudToastMessages } from "../../../../../hooks/useCrudToastMessages";
import { GeneralDashboardSkeleton } from "components/skeletons/GeneralDashboardSkeleton";
import CrudFields from '@repo/ui/components/dialog/crud-fields';

export default function StudentClassesDashboard() {
  const { user: clerkUser } = useUser();
  const { currentUser, isLoading: userLoading } = useUserWithConvex(clerkUser?.id)
  const {
    currentSchool, isLoading: schoolLoading
  } = useCurrentSchool(currentUser?._id);

  // Hook de permisos
  const {
    currentRole,
    canCreateStudentsClasses,
    canReadStudentsClasses,
    canUpdateStudentsClasses,
    canDeleteStudentsClasses,
    isAuditor,
    getStudentFilters,
    isLoading: permissionsLoading
  } = usePermissions(currentSchool?.school._id);

  const students = useQuery(api.functions.student.listStudentsBySchool, currentSchool ? { schoolId: currentSchool.school._id as Id<'school'> } : 'skip')

  const {
    classCatalogsWithDetails: ClassCatalog,
    getClassByTeacher,
    isLoading: classCatalogLoading
  } = useClassCatalogWithPermissions(
    currentSchool?.school._id,
    getStudentFilters
  );

  const { ciclosEscolares: schoolYears, isLoading: schoolYearsLoading } = useCicloEscolarWithConvex(currentSchool?.school._id);

  const studentFilters = useMemo(() => {
    return getStudentFilters?.() || { canViewAll: false };
  }, [getStudentFilters]);

  const enrollments = useQuery(
    api.functions.studentsClasses.getStudentClassesBySchoolWithRoleFilter,
    currentSchool && studentFilters ? {
      schoolId: currentSchool?.school._id as Id<'school'>,
      canViewAll: studentFilters.canViewAll,
      tutorId: studentFilters.tutorId,
      teacherId: studentFilters.teacherId,
    } : 'skip'
  )

  const statistics = useQuery(
    api.functions.studentsClasses.getEnrollmentStatistics,
    currentSchool ? { schoolId: currentSchool.school._id as Id<'school'> } : 'skip'
  )
  const createEnrollment = useMutation(api.functions.studentsClasses.createStudentClass)
  const updateEnrollment = useMutation(api.functions.studentsClasses.updateStudentClass)
  const deleteEnrollment = useMutation(api.functions.studentsClasses.deleteStudentClass)

  const [searchTerm, setSearchTerm] = useState("")
  const [schoolYearFilter, setSchoolYearFilter] = useState<string>("all")
  const [classesByTeacher, setClassesByTeacher] = useState<string>("all")
  const [gradeFilter, setGradeFilter] = useState<string>("all")
  const [groupFilter, setGroupFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("enrollments")
  const [isMassAssignmentOpen, setIsMassAssignmentOpen] = useState(false)
  const isLoading =
    userLoading ||
    schoolLoading ||
    permissionsLoading ||
    classCatalogLoading ||
    schoolYearsLoading ||
    students === undefined ||
    enrollments === undefined ||
    statistics === undefined;
  const {
    isOpen,
    operation,
    data,
    openCreate,
    openEdit,
    openView,
    openDelete,
    close
  } = useCrudDialog(studentClassSchema, {
    _id: '',
    schoolId: '',
    classCatalogId: '',
    studentId: '',
    enrollmentDate: new Date().toISOString().split("T")[0],
    status: 'active',
    averageScore: 0,
  });

  //   Mensajes de toast personalizados
  const toastMessages = useCrudToastMessages("Asignación de Clase");

  useEffect(() => {
    const activeSchoolYear = schoolYears?.find(year => year.status === "active");
    setSchoolYearFilter(activeSchoolYear?.name || "all");
  }, [schoolYears])

  const filteredEnrollments = useMemo(() => {


    const filtered = (enrollments?.filter(Boolean) || []).filter((enrollment) => {
      const matchesSearch =
        enrollment?.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment?.student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment?.student.enrollment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (enrollment?.classCatalog.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          enrollment?.classCatalog.name?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesSchoolYear = schoolYearFilter === "all" || enrollment?.schoolCycle?.name?.startsWith(schoolYearFilter);
      const matchesTeacherClass = classesByTeacher === "all" ||
        enrollment?.classCatalog?.name === classesByTeacher;
      const matchesGrade = gradeFilter === "all" || enrollment?.classCatalog?.grade?.startsWith(gradeFilter);
      const matchesGroup = groupFilter === "all" || enrollment?.classCatalog?.group?.startsWith(groupFilter);
      const matchesStatus = statusFilter === "all" ||
        (statusFilter === "active" && enrollment?.status === "active") ||
        (statusFilter === "inactive" && enrollment?.status === "inactive");

      return matchesSearch && matchesGrade && matchesTeacherClass && matchesStatus && matchesGroup && matchesSchoolYear;
    });
    return [...filtered].sort((a, b) => {
      const nameA = `${a?.student.name} ${a?.student.lastName || ''}`.toLowerCase().trim();
      const nameB = `${b?.student.name} ${b?.student.lastName || ''}`.toLowerCase().trim();
      return nameA.localeCompare(nameB);
    });

  }, [enrollments, searchTerm, schoolYearFilter, classesByTeacher, gradeFilter, groupFilter, statusFilter]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!currentSchool?.school?._id) {
      toast.error('Error', { description: 'No se ha encontrado la escuela.' })
      return
    }

    const validatedValues = values as StudentClassDto

    if (operation === 'create') {
      await createEnrollment({
        schoolId: currentSchool?.school._id as Id<"school">,
        classCatalogId: validatedValues.classCatalogId as Id<"classCatalog">,
        studentId: validatedValues.studentId as Id<"student">,
        enrollmentDate: new Date(validatedValues.enrollmentDate).getTime(),
        status: "active",
        averageScore: validatedValues.averageScore
      })
      //   Los toasts ahora los maneja el CrudDialog automáticamente
    } else if (operation === 'edit') {
      await updateEnrollment({
        _id: validatedValues._id as Id<"studentClass">,
        schoolId: currentSchool?.school._id as Id<"school">,
        classCatalogId: validatedValues.classCatalogId as Id<"classCatalog">,
        studentId: validatedValues.studentId as Id<"student">,
        enrollmentDate: new Date(validatedValues.enrollmentDate as string).getTime(),
        status: validatedValues.status,
        averageScore: validatedValues.averageScore || 0
      })
      //   Los toasts ahora los maneja el CrudDialog automáticamente
    } else {
      throw new Error('Operación no válida')
    }
    close()
  }

  const handleDelete = async (id: string) => {
    await deleteEnrollment({ id: id as Id<"studentClass">, schoolId: currentSchool?.school?._id as Id<"school"> })
    //   Los toasts ahora los maneja el CrudDialog automáticamente
  }

  function mapEnrollmentToFormValues(enrollment: StudentClasses) {
    return {
      _id: enrollment._id,
      studentId: enrollment.student?._id || "",
      schoolCycle: enrollment.schoolCycle?._id || "",
      classCatalogId: enrollment.classCatalog?._id || "",
      enrollmentDate: enrollment.enrollmentDate
        ? new Date(enrollment.enrollmentDate).toISOString().split("T")[0]
        : "",
      status: enrollment.status ?? "active",
      averageScore: enrollment.averageScore ?? 0
    }
  }

  if (isLoading) {
    return <GeneralDashboardSkeleton nc={0} />;
  }

  return (
    <>
      {canReadStudentsClasses && (
        <div className="w-full max-w-full space-y-7 p-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
            <div className="relative p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <BookUser className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold tracking-tight">
                        Asignación de Clases
                      </h1>
                      <p className="text-lg text-muted-foreground">
                        Administra las asignaciones de clases.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-start items-stretch  gap-2">

                </div>

              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              {(currentRole === 'superadmin' || currentRole === 'admin') && (
                <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
                  <TabsTrigger value="enrollments" className="text-xs sm:text-sm">
                    Asignaciones
                  </TabsTrigger>
                  <TabsTrigger value="reports" className="text-xs sm:text-sm">
                    Reportes
                  </TabsTrigger>
                </TabsList>
              )}

              <TabsContent value="enrollments" className="space-y-6">
                {currentRole !== 'tutor' &&
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filtros y Búsqueda
                          </CardTitle>
                          <CardDescription>
                            Encuentra las asignaciones por alumno, matrícula, o materia
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col xl:flex-row space-y-4 gap-2">
                        <div className="flex-2 relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Buscar por alumno, matrícula o materia..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <div className="flex flex-1 flex-col xl:flex-row gap-3">
                          <div className="flex flex-1 flex-col sm:flex-row gap-3 justify-center">
                            {currentRole !== 'teacher' && (
                              <>
                                <Select value={schoolYearFilter} onValueChange={setSchoolYearFilter}>
                                  <SelectTrigger className="w-full sm:w-40">
                                    <School className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Filtrar por ciclo escolar" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">Todos los ciclos Escolares</SelectItem>
                                    {schoolYears?.map((year) => (
                                      <SelectItem key={year.name} value={year.name}>
                                        {year.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                                  <SelectTrigger className="w-full sm:w-40">
                                    <SelectValue placeholder="Filtrar por grado" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">Todos los grados</SelectItem>
                                    <SelectItem value="1">1° Grado</SelectItem>
                                    <SelectItem value="2">2° Grado</SelectItem>
                                    <SelectItem value="3">3° Grado</SelectItem>
                                    <SelectItem value="4">4° Grado</SelectItem>
                                    <SelectItem value="5">5° Grado</SelectItem>
                                    <SelectItem value="6">6° Grado</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Select value={groupFilter} onValueChange={setGroupFilter}>
                                  <SelectTrigger className="w-full sm:w-40">
                                    <SelectValue placeholder="Filtrar por grupo" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">Todos los grupos</SelectItem>
                                    <SelectItem value="A">A</SelectItem>
                                    <SelectItem value="B">B</SelectItem>
                                    <SelectItem value="C">C</SelectItem>
                                    <SelectItem value="D">D</SelectItem>
                                    <SelectItem value="E">E</SelectItem>
                                    <SelectItem value="F">F</SelectItem>
                                  </SelectContent>
                                </Select>
                              </>
                            )}

                            {currentRole === 'teacher' && (
                              <Select value={classesByTeacher} onValueChange={setClassesByTeacher}>
                                <SelectTrigger className="w-full sm:w-40">
                                  <SelectValue placeholder="Filtrar por tus clases" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">Todas mis clases</SelectItem>
                                  {getClassByTeacher?.map((c) => (
                                    <SelectItem key={c.name} value={c.name}>
                                      {c.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}

                            {(canCreateStudentsClasses || isAuditor) && (
                              <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-40">
                                  <SelectValue placeholder="Filtro por Estatus" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">Todos los estados</SelectItem>
                                  <SelectItem value="active">Activo</SelectItem>
                                  <SelectItem value="inactive">Inactivo</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                }
                <Card>
                  <CardHeader>
                    {(currentRole === 'superadmin' || currentRole === 'admin') ? (
                      <div className="flex flex-col gap-4">
                        <CardTitle>
                          <span>Lista de Asignaciones</span>
                        </CardTitle>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <Button
                            variant="outline"
                            size="lg"
                            className="text-xs sm:text-sm w-full md:w-auto"
                          >
                            Exportar
                          </Button>
                          {canCreateStudentsClasses && (
                            <div className="flex gap-2 md:flex-row flex-col items-center w-full md:w-auto">
                              <Button
                                size="lg"
                                className="gap-2 w-full md:w-auto"
                                onClick={openCreate}
                                disabled={isLoading || !currentSchool}
                              >
                                <Plus className="w-4 h-4" />
                                Agregar Asignación
                              </Button>
                              <Button
                                size="lg"
                                className="gap-2 w-full md:w-auto"
                                onClick={() => setIsMassAssignmentOpen(true)}
                                disabled={isLoading || !currentSchool}
                              >
                                <Plus className="w-4 h-4" />
                                Asignar Clases Masivamente
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <CardTitle>
                          <div className="flex flex-col gap-2">
                            <span>Lista de Asignaciones</span>
                            {currentRole === 'teacher' && (
                              <Badge variant="outline" className="w-fit">
                                {filteredEnrollments.length} {filteredEnrollments.length > 1 ? 'asignados' : 'asignado'}
                              </Badge>
                            )}
                          </div>
                        </CardTitle>
                        <div className="flex flex-col gap-2 md:flex-row items-center w-full md:w-auto">
                          {(currentRole === 'tutor' || currentRole === 'auditor') ? (
                            <Badge variant="outline" className="w-fit">
                              {filteredEnrollments.length} {filteredEnrollments.length > 1 ? 'asignados' : 'asignado'}
                            </Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="lg"
                              className="text-xs sm:text-sm w-full md:w-auto"
                            >
                              Exportar
                            </Button>
                          )}
                          {canCreateStudentsClasses && (
                            <>
                              <Button
                                size="lg"
                                className="gap-2 w-full md:w-auto"
                                onClick={openCreate}
                                disabled={isLoading || !currentSchool}
                              >
                                <Plus className="w-4 h-4" />
                                Agregar Asignación
                              </Button>
                              <Button
                                size="lg"
                                className="gap-2 w-full md:w-auto"
                                onClick={() => setIsMassAssignmentOpen(true)}
                                disabled={isLoading || !currentSchool}
                              >
                                <Plus className="w-4 h-4" />
                                Asignar Clases Masivamente
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                          <p className="text-muted-foreground">Cargando Asignaciones...</p>
                        </div>
                      </div>
                    ) : filteredEnrollments.length === 0 ? (
                      <div className="text-center py-12">
                        <BookUser className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        {currentRole === 'tutor' ? (
                          <>
                            <h3 className="text-lg font-medium mb-2">
                              No se encontraron asignaciones
                            </h3>
                            <p>En caso de alguna inconsistencia con la información comunicate con soporte.</p>
                          </>
                        ) : (
                          <h3 className="text-lg font-medium mb-2">
                            No se encontraron asignaciones
                          </h3>
                        )}
                        {
                          canCreateStudentsClasses && (
                            <Button
                              onClick={openCreate}
                              className="gap-2"
                              disabled={!currentSchool}
                            >
                              <Plus className="h-4 w-4" />
                              Agregar Asignación
                            </Button>
                          )
                        }
                      </div>
                    ) : currentRole !== 'tutor' ?
                      (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[110px] px-4">Alumno</TableHead>
                                <TableHead className="w-[120px] text-center">Ciclo Escolar</TableHead>
                                <TableHead className="w-[120px] text-center">Grado y Grupo</TableHead>
                                <TableHead className="w-[150px] text-center">Materia</TableHead>
                                <TableHead className="w-[110px] text-center">Maestro</TableHead>
                                <TableHead className="w-[110px] text-center">Promedio</TableHead>
                                <TableHead className="w-[140px] text-center">Fecha de Asignación</TableHead>
                                <TableHead className="w-[100px] text-center">Estado</TableHead>
                                <TableHead className="w-[140px] text-center sticky right-0 bg-white shadow-[-2px_0_5px_rgba(0,0,0,0.1)] z-10">Acciones</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredEnrollments.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={7} className="text-center py-8">
                                    No hay asignaciones registradas
                                  </TableCell>
                                </TableRow>
                              ) : (
                                filteredEnrollments.map((enrollment) => (
                                  <TableRow key={enrollment?._id}>
                                    <TableCell className="font-medium px-4">
                                      <div className="max-w-[180px]">
                                        <div className="truncate font-medium">
                                          {enrollment?.student.name} {enrollment?.student.lastName}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">
                                          {enrollment?.student.enrollment}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="flex justify-center items-center truncate">
                                        {enrollment?.schoolCycle?.name}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="flex justify-center items-center truncate">
                                        {enrollment?.classCatalog.grade} {enrollment?.classCatalog.group}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="flex justify-center items-center truncate">
                                        {enrollment?.classCatalog.subject}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="flex justify-center items-center truncate">
                                        {enrollment?.classCatalog.teacher}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="flex justify-center items-center truncate">
                                        {enrollment?.averageScore !== undefined ? enrollment.averageScore.toFixed(0) : '-'}
                                      </div>
                                    </TableCell>
                                    <TableCell className="px-4 text-center">
                                      <div className="flex justify-center items-center truncate">
                                        {enrollment?.enrollmentDate
                                          ? new Date(enrollment.enrollmentDate).toISOString().split("T")[0]
                                          : "No disponible"}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <Badge
                                        variant={enrollment?.status === "active" ? "default" : "secondary"}
                                        className={enrollment?.status === "active" ? "bg-green-600 text-white flex-shrink-0 ml-2" : "flex-shrink-0 ml-2 bg-gray-600/70 text-white"}>
                                        {enrollment?.status === 'active' ? 'Activa' : 'Inactiva'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="flex gap-1 justify-center">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            openView(mapEnrollmentToFormValues(enrollment as unknown as StudentClasses));
                                          }}
                                          className="hover:scale-105 transition-transform cursor-pointer">
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                        {canUpdateStudentsClasses && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              openEdit(mapEnrollmentToFormValues(enrollment as unknown as StudentClasses));
                                            }}
                                            className="hover:scale-105 transition-transform cursor-pointer">
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                        )}
                                        {canDeleteStudentsClasses && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              openDelete(enrollment as Record<string, unknown>)
                                            }}
                                            className="hover:scale-105 transition-transform cursor-pointer text-destructive hover:text-destructive"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      ) :
                      (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-9">
                          {filteredEnrollments.length === 0 ? (
                            <Card className="w-full hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
                              <CardHeader>
                                <CardTitle className="text-lg font-semibold leading-tight line-clamp-2 break-words flex justify-between">Valores</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-muted-foreground">
                                  No hay asignaciones registradas.
                                </p>
                              </CardContent>
                            </Card>
                          ) : (
                            filteredEnrollments.map((enrollment) => (
                              <Card className="w-full hover:shadow-lg transition-shadow duration-200 flex flex-col h-full" key={enrollment?._id}>
                                <CardHeader>
                                  <CardTitle className="text-lg font-semibold leading-tight line-clamp-2 break-words flex justify-between">
                                    <span className='flex'>
                                      <GraduationCap className="h-4 w-4 text-muted-foreground mr-2" />
                                      {enrollment?.student.name} {enrollment?.student.lastName}
                                    </span>
                                    <Badge
                                      variant={enrollment?.status === "active" ? "default" : "secondary"}
                                      className={enrollment?.status === "active" ? "bg-green-600 text-white flex-shrink-0 ml-2" : "flex-shrink-0 ml-2 bg-gray-600/70 text-white"}
                                    >
                                      {enrollment?.status === "active" ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">

                                  <div className="flex items-start gap-2">
                                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 break-words flex gap-2">
                                      <School className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                      <span className='font-bold text-black'>
                                        Ciclo escolar:
                                      </span>
                                      {enrollment?.schoolCycle?.name}
                                    </p>
                                  </div>

                                  <div className="flex items-start gap-2">
                                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 break-words flex gap-2">
                                      <Users className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                      <span className='font-bold text-black'>
                                        Grado y Grupo:
                                      </span> {enrollment?.classCatalog.grade} {enrollment?.classCatalog.group}
                                    </p>
                                  </div>

                                  <div className="flex items-start gap-2">
                                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 break-words flex gap-2">
                                      <BookOpen className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                      <span className='font-bold text-black'>
                                        Materia:
                                      </span>
                                      {enrollment?.classCatalog.subject}
                                    </p>
                                  </div>

                                  <div className="flex items-start gap-2">
                                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 break-words flex gap-2">
                                      <User className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                      <span className='font-bold text-black'>
                                        Maestro:
                                      </span>
                                      {enrollment?.classCatalog.teacher}
                                    </p>
                                  </div>

                                  <div className="flex items-start gap-2">
                                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 break-words flex gap-2">
                                      <ChartNoAxesCombined className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                      <span className='font-bold text-black'>
                                        Promedio:
                                      </span>
                                      {enrollment?.averageScore !== undefined ? enrollment.averageScore.toFixed(0) : '-'}
                                    </p>
                                  </div>

                                  <div className="flex items-start gap-2">
                                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 break-words flex gap-2">
                                      <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                      <span className='font-bold text-black'>Fecha de asignación:</span> {enrollment?.enrollmentDate
                                        ? new Date(enrollment.enrollmentDate).toISOString().split("T")[0]
                                        : "No disponible"}
                                    </p>
                                  </div>
                                </CardContent>

                                <CardFooter className="flex justify-end gap-2 pt-2 border-t mt-auto">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openView(mapEnrollmentToFormValues(enrollment as unknown as StudentClasses));
                                    }}
                                    className="hover:scale-105 transition-transform cursor-pointer">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </CardFooter>
                              </Card>
                            ))
                          )}

                        </div>
                      )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reports" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg sm:text-xl">Estadísticas Generales</CardTitle>
                      <CardDescription className="text-sm">Resumen de asignaciones en la escuela</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {statistics && (
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          <div className="text-center p-3 sm:p-4 border rounded-lg">
                            <div className="text-3xl font-bold">
                              {statistics.totalEnrollments}
                            </div>
                            <div className="flex flex-row items-center justify-center gap-4 space-y-0 pt-2">
                              <div className="text-sm font-medium text-muted-foreground">
                                Total Asignaciones
                              </div>
                            </div>
                          </div>
                          <div className="text-center p-3 sm:p-4 border rounded-lg">
                            <div className="text-3xl font-bold">
                              {statistics.activeEnrollments}
                            </div>
                            <div className="flex flex-row items-center justify-center gap-4 space-y-0 pt-2">
                              <div className="text-sm font-medium text-muted-foreground">
                                Asignaciones Activas
                              </div>
                            </div>
                          </div>
                          <div className="text-center p-3 sm:p-4 border rounded-lg">
                            <div className="text-3xl font-bold">
                              {statistics.totalStudents}
                            </div>
                            <div className="flex flex-row items-center justify-center gap-4 space-y-0 pt-2">
                              <div className="text-sm font-medium text-muted-foreground">
                                Total Alumnos
                              </div>
                            </div>
                          </div>
                          <div className="text-center p-3 sm:p-4 border rounded-lg">
                            <div className="text-3xl font-bold">
                              {statistics.averageClassesPerStudent}
                            </div>
                            <div className="flex flex-row items-center justify-center gap-4 space-y-0 pt-2">
                              <div className="text-sm font-medium text-muted-foreground">
                                Promedio Clases/Alumno
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg sm:text-xl">Exportar Datos</CardTitle>
                      <CardDescription className="text-sm">Descargue datos en diferentes formatos</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-start bg-transparent text-sm">
                          Exportar a Excel (.xlsx)
                        </Button>
                        <Button variant="outline" className="w-full justify-start bg-transparent text-sm">
                          Exportar a CSV (.csv)
                        </Button>
                        <Button variant="outline" className="w-full justify-start bg-transparent text-sm">
                          Exportar a PDF (.pdf)
                        </Button>
                        <Button variant="outline" className="w-full justify-start bg-transparent text-sm">
                          Generar Reporte Personalizado
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
            {/* Modal de asignación masiva */}
            {currentSchool && (
              <MassAssignmentStudets
                isOpen={isMassAssignmentOpen}
                onClose={() => setIsMassAssignmentOpen(false)}
                schoolId={currentSchool.school._id as Id<'school'>}
                students={students || []}
                classCatalogs={ClassCatalog || []}
              />
            )}

            <CrudDialog
              isOpen={isOpen}
              operation={operation}
              title={
                operation === 'create' ? 'Crear Nueva Asignación de Alumno a Clase' :
                  operation === 'edit' ? 'Actualizar Asignación de Alumno a Clase' : 'Detalles de la Asignación de Alumno a Clase'
              }
              description={
                operation === 'create' ? 'Completa los campos necesarios para registrar una nueva asignación y asegurar el control académico del alumno.' :
                  operation === 'edit' ? 'Modifica la información de esta asignación para mantener los datos actualizados y precisos.' : 'Consulta toda la información relacionada con esta asignación.'
              }
              deleteConfirmationTitle="¿Eliminar Asignación?"
              deleteConfirmationDescription="Esta acción eliminará permanentemente la asignación del sistema. No podrá deshacerse."
              schema={studentClassSchema}
              defaultValues={{
                _id: '',
                schoolId: '',
                classCatalogId: '',
                studentId: '',
                enrollmentDate: new Date().toISOString().split("T")[0],
                status: 'active',
                averageScore: 0,
              }}
              data={data}
              onOpenChange={close}
              onSubmit={handleSubmit}
              onDelete={handleDelete}
              toastMessages={toastMessages}
              disableDefaultToasts={false}
            >
              {(form, operation) => (
                <div className="space-y-6">
                  <div className="space-y-6">
                    {/* Campo Alumno */}
                    <FormField
                      control={form.control}
                      name="studentId"
                      render={({ field }) => (
                        <div className="space-y-2">
                          <FormLabel className="text-sm">Alumno</FormLabel>
                          <SelectPopover<Student>
                            items={students ?? []}
                            value={field.value as string}
                            onChange={field.onChange}
                            placeholder="Selecciona un alumno"
                            getKey={(s: Student) => s._id}
                            getLabel={(s: Student) => `${s.name} ${s.lastName ?? ""} (${s.enrollment})`}
                            renderItem={(s: Student) => (
                              <div className="flex flex-col">
                                <span>{s.name} {s.lastName}</span>
                                <span className="text-xs text-muted-foreground">{s.enrollment}</span>
                              </div>
                            )}
                            disabled={operation === "view"}
                          />
                        </div>
                      )}
                    />

                    {/* Campo Clase */}
                    <FormField
                      control={form.control}
                      name="classCatalogId"
                      render={({ field }) => (
                        <div className="space-y-2">
                          <FormLabel className="text-sm font-medium">Clase</FormLabel>
                          <SelectPopover<ClassCatalogWithDetails>
                            items={ClassCatalog ?? []}
                            value={field.value as string}
                            onChange={field.onChange}
                            placeholder="Selecciona una clase"
                            getKey={(c: ClassCatalogWithDetails) => c._id}
                            getLabel={(c: ClassCatalogWithDetails) => c.name}
                            renderItem={(c: ClassCatalogWithDetails) => (
                              <div className="flex items-center">
                                <span>{c.name} - {c.teacher?.name} {c.teacher?.lastName}</span>
                              </div>
                            )}
                            disabled={operation === "view"}
                          />
                        </div>
                      )}
                    />
                  </div>

                  <CrudFields
                    fields={[
                      {
                        name: 'enrollmentDate',
                        label: 'Fecha de asignación',
                        type: 'date',
                        required: true
                      },
                      {
                        name: 'averageScore',
                        label: 'Promedio',
                        type: 'number',
                        placeholder: 'Promedio final de la clase',
                        step: '0.1'
                      }
                    ]}
                    form={form}
                    operation={operation}
                  />

                  {(operation != 'create') && (
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Estado</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Determina si la asignación está activa o inactiva
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value === "active"}
                              onCheckedChange={(val) => field.onChange(val ? "active" : "inactive")}
                              disabled={operation === 'view'}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}
            </CrudDialog>
          </div>
        </div>
      )}
    </>
  )
}