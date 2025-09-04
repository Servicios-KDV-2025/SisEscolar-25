"use client"

import { useState } from "react"
import { Plus, Search, Eye, Edit, Trash2, School } from "@repo/ui/icons"
import { useEffect } from "react"
import { Button } from "@repo/ui/components/shadcn/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card"
import { Input } from "@repo/ui/components/shadcn/input"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/shadcn/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/shadcn/tabs"
import { useMutation, useQuery } from "convex/react"
import { api } from "@repo/convex/convex/_generated/api"
import { Id } from "@repo/convex/convex/_generated/dataModel"
import { toast } from "sonner"
import { CrudDialog, useCrudDialog } from "@repo/ui/components/dialog/crud-dialog"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/shadcn/form"
import { Switch } from "@repo/ui/components/shadcn/switch"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { useUserWithConvex } from "stores/userStore"
import { useCurrentSchool } from "stores/userSchoolsStore"
import { StudentClassDto, studentClassSchema } from "schema/studentClassSchema"
import { StudentClasses } from "@/types/studentClass"
import { parseConvexErrorMessage } from "lib/parseConvexErrorMessage"
import { SelectPopover } from "./selectPopover"
import { ClassCatalog } from "@/types/classCatalog"
import { Student } from "@/types/student"


export default function StudentClassesDashboard() {
  const { user: clerkUser } = useUser();
  const { currentUser } = useUserWithConvex(clerkUser?.id)
  const {
    currentSchool
  } = useCurrentSchool(currentUser?._id);


  const students = useQuery(api.functions.student.listStudentsBySchool, currentSchool ? { schoolId: currentSchool.school._id as Id<'school'> } : 'skip')
  const classCatalogs = useQuery(api.functions.classCatalog.getAllClassCatalog, currentSchool ? { schoolId: currentSchool.school._id as Id<'school'> } : 'skip')
  const schoolYears = useQuery(api.functions.schoolCycles.ObtenerCiclosEscolares, currentSchool ? { escuelaID: currentSchool.school._id as Id<'school'> } : 'skip')
  const enrollments = useQuery(
    api.functions.studentsClasses.getStudentClassesBySchool,
    currentSchool ? { schoolId: currentSchool.school._id as Id<'school'> } : 'skip'
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
  const [gradeFilter, setGradeFilter] = useState<string>("all")
  const [groupFilter, setGroupFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("enrollments")

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
  })
  useEffect(() => {
    setSchoolYearFilter(schoolYears?.[schoolYears.length - 1]?.name || "all")
  }, [schoolYears])

  const filteredEnrollments = (enrollments?.filter(Boolean) || []).filter((enrollment) => {
    const matchesSearch =
      enrollment?.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment?.student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment?.student.enrollment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (enrollment?.classCatalog.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment?.classCatalog.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesSchoolYear = schoolYearFilter === "all" || enrollment?.schoolCycle?.name?.startsWith(schoolYearFilter)
    const matchesGrade = gradeFilter === "all" || enrollment?.classCatalog?.grade?.startsWith(gradeFilter)
    const matchesGroup = groupFilter === "all" || enrollment?.classCatalog?.group?.startsWith(groupFilter)
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && enrollment?.status === "active") ||
      (statusFilter === "inactive" && enrollment?.status === "inactive")

    return matchesSearch && matchesGrade && matchesStatus && matchesGroup && matchesSchoolYear
  })

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!currentSchool?.school?._id) {
      toast.error('Error', { description: 'No se ha encontrado la escuela.' })
      return
    }

    const validatedValues = values as StudentClassDto

    try {
      if (operation === 'create') {
        await createEnrollment({
          schoolId: currentSchool?.school._id as Id<"school">,
          classCatalogId: validatedValues.classCatalogId as Id<"classCatalog">,
          studentId: validatedValues.studentId as Id<"student">,
          enrollmentDate: new Date(validatedValues.enrollmentDate).getTime(),
          status: "active",
          averageScore: validatedValues.averageScore
        })
        toast.success("Creado correctamente")
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
        toast.success("Actualizado correctamente")
      } else {
        throw new Error('Operación no válida')
      }
      close()
    } catch (err) {
      const cleanMessage = parseConvexErrorMessage(err)
      toast.error("Error", { description: cleanMessage })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteEnrollment({ id: id as Id<"studentClass">, schoolId: currentSchool?.school?._id as Id<"school"> })
      toast.success('Eliminado correctamente')
      close()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar la inscripción'
      toast.error(errorMessage)
    }
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

  if (enrollments === undefined) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center text-gray-600 py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          Cargando las inscripciones...
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 mx-auto">
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Clases por Alumno</h1>
              <p className="text-sm sm:text-base text-gray-600">
                <strong>Gestión completa de inscripciones de alumnos a clases.</strong>
              </p>
            </div>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm text-gray-600">
              Visualiza todas las relaciones registradas, aplica filtros avanzados y accede a información detallada por alumno.
              Permite editar o eliminar inscripciones, generar reportes personalizados y exportar datos en múltiples formatos.
              Ideal para un control académico claro, eficiente y centralizado.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2 mb-6">
          <Button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Nueva Inscripción
          </Button>

          <Link href={`/`} className="w-full sm:w-auto">
            <Button className="flex items-center justify-center gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Asignar Clases Masivamente
            </Button>
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
            <TabsTrigger value="enrollments" className="text-xs sm:text-sm">
              Inscripciones
            </TabsTrigger>
            <TabsTrigger value="reports" className="text-xs sm:text-sm">
              Reportes
            </TabsTrigger>
          </TabsList>

          <Card>
            <CardContent className="p-4 sm:p-6">
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
                  </div>
                  <div className="flex flex-1 flex-col sm:flex-row gap-3 justify-center">
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

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="inactive">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <TabsContent value="enrollments" className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg sm:text-xl">Lista de Inscripciones</CardTitle>
                    <CardDescription className="text-sm">
                      Mostrando {filteredEnrollments.length} de {enrollments?.length || 0} inscripciones
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                      Exportar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto w-full">
                  <div className="w-full">
                    <Table className="w-full table-auto">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[110px] px-4">Alumno</TableHead>
                          <TableHead className="w-[120px] text-center">Ciclo Escolar</TableHead>
                          <TableHead className="w-[120px] text-center">Grado y Grupo</TableHead>
                          <TableHead className="w-[150px] text-center">Materia</TableHead>
                          <TableHead className="w-[110px] text-center">Maestro</TableHead>
                          <TableHead className="w-[110px] text-center">Promedio</TableHead>
                          <TableHead className="w-[140px] text-center">Fecha de Inscripción</TableHead>
                          <TableHead className="w-[100px] text-center">Estado</TableHead>
                          <TableHead className="w-[140px] text-center sticky right-0 bg-white shadow-[-2px_0_5px_rgba(0,0,0,0.1)] z-10">
                            Acciones
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEnrollments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                              No hay inscripciones registradas
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
                              <TableCell>
                                <div className="flex justify-center items-center truncate">
                                  {enrollment?.schoolCycle?.name}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-center items-center truncate">
                                  {enrollment?.classCatalog.grade} {enrollment?.classCatalog.group}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-center items-center truncate">
                                  {enrollment?.classCatalog.subject}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-center items-center truncate">
                                  {enrollment?.classCatalog.teacher}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-center items-center truncate">
                                  {enrollment?.averageScore !== undefined ? enrollment.averageScore.toFixed(2) : '-'}
                                </div>
                              </TableCell>
                              <TableCell className="px-4">
                                <div className="flex justify-center items-center truncate">
                                  {enrollment?.enrollmentDate
                                    ? new Date(enrollment.enrollmentDate).toISOString().split("T")[0]
                                    : "No date"}
                                </div>
                              </TableCell>
                              <TableCell className="px-4 text-center">
                                <Badge className={`text-center text-white font-medium py-1 ${enrollment?.status === "active" ? "bg-green-600 px-3" : " bg-red-600 "}`}>
                                  {enrollment?.status === "active" ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell className="px-4 sticky right-0 bg-white shadow-[-2px_0_5px_rgba(0,0,0,0.1)] z-10">
                                <div className="flex gap-1 justify-center">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openView(mapEnrollmentToFormValues(enrollment as unknown as StudentClasses))}
                                    className="h-8 w-8 p-0"
                                    title="Editar"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEdit(mapEnrollmentToFormValues(enrollment as unknown as StudentClasses))}
                                    className="h-8 w-8 p-0"
                                    title="Editar"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      openDelete(enrollment as Record<string, unknown>)
                                    }}
                                    className="h-8 w-8 p-0"
                                    title="Borrar"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Estadísticas Generales</CardTitle>
                  <CardDescription className="text-sm">Resumen de inscripciones en la escuela</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {statistics && (
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="text-center p-3 sm:p-4 border rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-blue-600">
                          {statistics.totalEnrollments}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">Total Inscripciones</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 border rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-green-600">
                          {statistics.activeEnrollments}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">Inscripciones Activas</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 border rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-purple-600">
                          {statistics.totalStudents}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">Total Alumnos</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 border rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-orange-600">
                          {statistics.averageClassesPerStudent}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">Promedio Clases/Alumno</div>
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

        <CrudDialog
          isOpen={isOpen}
          operation={operation}
          title={
            operation === 'create' ? 'Crear nueva inscripción de alumno por clase' :
              operation === 'edit' ? 'Editar inscripción de alumno por clase' : 'Ver inscripción de alumno por clase'
          }
          description={
            operation === 'create' ? 'Completa los campos para crear una nueva inscripción.' :
              operation === 'edit' ? 'Actualizar los datos de la inscripción.' : 'Detalles de la inscripción'
          }
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
        >
          {(form, operation) => (
            <div className="space-y-6">

              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <SelectPopover<Student>
                    items={students ?? []}
                    value={field.value as string}
                    onChange={field.onChange}
                    placeholder="Selecciona estudiante"
                    getKey={(s: Student) => s._id}
                    getLabel={(s: Student) => `${s.name} ${s.lastName ?? ""} (${s.enrollment})`}
                    renderItem={(s: Student) => (
                      <>
                        {s.name} {s.lastName} ({s.enrollment})
                      </>
                    )}
                    disabled={operation === "view"}
                  />
                )}
              />

              <FormField
                control={form.control}
                name="classCatalogId"
                render={({ field }) => (
                  <SelectPopover<ClassCatalog>
                    items={classCatalogs ?? []}
                    value={field.value as string}
                    onChange={field.onChange}
                    placeholder="Selecciona clase"
                    getKey={(c: ClassCatalog) => c._id}
                    getLabel={(c: ClassCatalog) => c.name}
                    renderItem={(c: ClassCatalog) => <>{c.name}</>}
                    disabled={operation === "view"}
                  />
                )}
              />

              <FormField
                control={form.control}
                name="enrollmentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de inscripción</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        disabled={operation === 'view'}
                        value={
                          field.value
                            ? (typeof field.value === 'number'
                              ? new Date(field.value).toISOString().split("T")[0]
                              : new Date(field.value as string).toISOString().split("T")[0])
                            : ''
                        }
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="averageScore"
                render={({ field }) => {
                  const inputValue = field.value === null || field.value === undefined
                    ? ""
                    : String(field.value);

                  return (
                    <FormItem>
                      <FormLabel>Promedio</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.1"
                          placeholder="Promedio final de la clase"
                          value={inputValue}
                          onChange={(e) => {
                            const value = e.target.value;
                            const numValue = value === ""
                              ? undefined
                              : Number(value);
                            field.onChange(numValue);
                          }}
                          disabled={operation === "view"}

                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
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
                          Determina si la inscripción está activa o inactiva
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
  )
}