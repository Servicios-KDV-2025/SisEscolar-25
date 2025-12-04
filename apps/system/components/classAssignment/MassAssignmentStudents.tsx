import { Student } from "@/types/student"
import { api } from "@repo/convex/convex/_generated/api"
import { Id } from "@repo/convex/convex/_generated/dataModel"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { Button } from "@repo/ui/components/shadcn/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card"
import { Checkbox } from "@repo/ui/components/shadcn/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/shadcn/dialog"
import { Input } from "@repo/ui/components/shadcn/input"
import { ScrollArea } from "@repo/ui/components/shadcn/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select"
import { TableBody, TableCell, TableHead, TableHeader, TableRow, Table } from "@repo/ui/components/shadcn/table"
import { AlertCircle, CheckCircle2, Search, Users, XCircle } from "@repo/ui/icons"
import { useMutation, useQuery } from "convex/react"
import { BookOpen } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { ClassCatalogWithDetails } from "stores/classCatalogStore"

interface MassAssignmentStudetsProps {
  isOpen: boolean
  onClose: () => void
  schoolId: Id<'school'>
  students: Student[]
  classCatalogs: ClassCatalogWithDetails[]
}

interface AssignmentResult {
  student: Student
  success: boolean
  error?: string
}

export default function MassAssignmentStudets({ isOpen, onClose, schoolId, students, classCatalogs }: MassAssignmentStudetsProps) {
  const [selectedStudents, setSelectedStudents] = useState<Set<Id<'student'>>>(new Set())
  const [selectedClass, setSelectedClass] = useState<Id<'classCatalog'> | ''>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [groupFilter, setGroupFilter] = useState('all')
  const [isAssigning, setIsAssigning] = useState(false)
  const [assignmentResult, setAssignmentResult] = useState<AssignmentResult[]>([])
  const [showResult, setShowResult] = useState(false)

  const createStudentClass = useMutation(api.functions.studentsClasses.createStudentClass)
  const exsistingEnrollments = useQuery(
    api.functions.studentsClasses.getStudentClassesBySchool,
    schoolId ? { schoolId } : 'skip'
  )
  //Filtrar estidoantes
  const filteredStudent = students.filter(student => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.enrollment.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })
  // Filtrar clase por grado y grupo
  const filteredClasses = classCatalogs.filter(classCatalog => {
    const matchesGrade = gradeFilter === "all" || classCatalog.group?.grade.startsWith(gradeFilter);
    const matchesGroup = groupFilter === "all" || classCatalog.group?.name.startsWith(groupFilter);
    return matchesGrade && matchesGroup;
  })
  // Verificar si el estudiante ya esta asignado a una clase
  const isStudentAlreadyEnrolled = (studentId: Id<'student'>) => {
    if (!selectedClass || !exsistingEnrollments) return false

    return exsistingEnrollments.some(enrollment =>
      enrollment?.student._id === studentId &&
      enrollment.classCatalog._id === selectedClass
    )
  }
  // Seleccionar/deseleccioner todos los estudiantes
  const toggleSelectAll = () => {
    if (selectedStudents.size === filteredStudent.length) {
      setSelectedStudents(new Set())
    } else {
      const allStudentId = new Set(filteredStudent.map(student => student._id))
      setSelectedStudents(allStudentId)
    }
  }
  // Seleccionar/deseleccionar los estudandes individualmente
  const toggleStudent = (studentId: Id<'student'>) => {
    const newSelected = new Set(selectedStudents)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedStudents(newSelected)
  }
  // Reiniciar el formulario
  const handleReset = () => {
    setSelectedStudents(new Set())
    setSelectedClass('')
    setSearchTerm('')
    setGradeFilter('all')
    setGroupFilter('all')
    setAssignmentResult([])
    setShowResult(false)
  }
  // Asignar estudiantes masivamente
  const handleMassAssignment = async () => {
    if (!selectedClass || selectedStudents.size === 0) {
      toast.error('Error', {
        description: 'Debes seleccionar una clase y al menos un estudiante'
      })
      return
    }

    setIsAssigning(true)
    setAssignmentResult([])

    const results: AssignmentResult[] = []
    const selectedStudentsArray = Array.from(selectedStudents)

    try {
      // Prosesar asignaciones una por una
      for (const studentId of selectedStudentsArray) {
        const student = students.find(s => s._id === studentId)
        if (!student) continue

        try {
          // Verificar si ya esta asignado
          if (isStudentAlreadyEnrolled(studentId)) {
            results.push({
              student,
              success: false,
              error: 'Ya esta asignado(a) a esta clase'
            })
            continue
          }
          // Crear la asignación
          await createStudentClass({
            schoolId,
            classCatalogId: selectedClass as Id<'classCatalog'>,
            studentId,
            enrollmentDate: Date.now(),
            status: 'active',
            averageScore: 0
          })

          results.push({
            student,
            success: true
          })
        } catch (error) {
          results.push({
            student,
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
          })
        }
      }

      setAssignmentResult(results)
      setShowResult(true)
      // Mostrar resumen
      const successful = results.filter(r => r.success).length
      const failed = results.filter(r => !r.success).length

      if (failed === 0) {
        toast.success('Éxito', {
          description: `Se asignaron ${successful} estudiantes correctamente.`
        })
      } else if (successful === 0) {
        toast.error('Error', {
          description: `Los estudiantes ya pertenecen a esta clase.`
        })
      } else {
        toast.warning('Resultado parcial', {
          description: `${successful} asignacion(es) existosas, ${failed} fallidas`
        })
      }
      handleReset()
    } catch {
      toast.error('Error', {
        description: 'Ocurrio un error durante la asignación masiva'
      })
    } finally {
      setIsAssigning(false)
    }
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  const selectedClassData = classCatalogs.find(c => c._id === selectedClass)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[100vh] sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">Asignación masiva</DialogTitle>
          <DialogDescription>
            Selecciona varios estudiantes y asígnalos fácilmente a una clase específica.
          </DialogDescription>
        </DialogHeader>

        <div className="flex sm:flex-row flex-col gap-2 max-h-[70vh] overflow-y-auto">
          {/* Panel de selección de Estudiantes */}
          <Card className="flex flex-col w-1/2 mr-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <div className='flex flex-col'>
                  <span>Seleccionar Estudiantes</span>
                  <span>({selectedStudents.size} seleccionados)</span>
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={toggleSelectAll}
                  disabled={filteredStudent.length === 0}
                >
                  {selectedStudents.size === filteredStudent.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </Button>
              </CardTitle>
              <CardDescription>
                Busca y selecciona a los estudiantes que deseas asignar.
              </CardDescription>
              {/* Busqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar estudiantes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-0">
              <ScrollArea className="h-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Checkbox
                          checked={selectedStudents.size === filteredStudent.length && filteredStudent.length > 0}
                          onCheckedChange={toggleSelectAll}
                          disabled={filteredStudent.length === 0}
                        />
                      </TableHead>
                      <TableHead>Estudiante</TableHead>
                      <TableHead>Matricula</TableHead>
                      <TableHead className="w-20">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudent.map((student) => {
                      const isEnrolled = isStudentAlreadyEnrolled(student._id)

                      return (
                        <TableRow key={student._id} className={isEnrolled ? 'opacity-50' : ''}>
                          <TableCell>
                            <Checkbox
                              checked={selectedStudents.has(student._id)}
                              onCheckedChange={() => toggleStudent(student._id)}
                              disabled={isEnrolled}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {student.name} {student.lastName}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {student.enrollment}
                          </TableCell>
                          <TableCell>
                            {isEnrolled ? (
                              <Badge variant='outline' className="text-xs bg-red-50 border-red-200 text-red-600">
                                Ya asignado
                              </Badge>
                            ) : (
                              <Badge variant='outline' className="text-xs bg-green-50 border-green-200 text-green-600">
                                Sin asignar
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}

                    {filteredStudent.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No se encontraron estudiantes
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
          {/* Panel de selección de Clase y Resultados */}
          <div className="space-y-4 w-1/2">
            {/* Selección de clase */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Seleccionar Clase
                </CardTitle>
                <CardDescription>
                  Elige la clase a la que se asignarán los estudiantes seleccionados.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {/* Selección de clase especifica */}
                  <Select
                    value={selectedClass}
                    onValueChange={(value: string) => setSelectedClass(value as Id<'classCatalog'> | '')}
                  >
                    <SelectTrigger className="w-full truncate">
                      <SelectValue placeholder='Selecciona una clase' />
                    </SelectTrigger>
                    <SelectContent className="">
                      {filteredClasses.map(classCatalog => (
                        <SelectItem key={classCatalog._id} value={classCatalog._id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{classCatalog.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {classCatalog.group?.name} - {classCatalog.teacher?.name}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                      {filteredClasses.length === 0 && (
                        <SelectItem value="" disabled>
                          No hay clases disponibles
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {/* información de la calse seleccionada */}
                  {selectedClassData && (
                    <div className="p-3 border rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <span>{selectedClassData.name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div>Grupo: {selectedClassData.group?.name}</div>
                        <div>Grado: {selectedClassData.group?.grade}</div>
                        <div>Materia: {selectedClassData.subject?.name}</div>
                        <div>Maestro: {selectedClassData.teacher?.name}</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            {/* Resumen y resultados */}
            {showResult ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Resultados de la asignación
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {assignmentResult.map((result, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-2 rounded border ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
                        >
                          <div className="flex items-center gap-2">
                            {result.success ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className="text-sm font-medium">
                              {result.student.name} {result.student.lastName}
                            </span>
                          </div>
                          <span className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                            {result.success ? 'Exito' : result.error}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : (
              <Card className='space-y-0'>
                <CardHeader>
                  <CardTitle className="text-sm">Resumen</CardTitle>
                  <CardContent className="space-y-1">
                    <div className="flex justify-between">
                      <span>Estudiantes seleccionados:</span>
                      <Badge variant='outline'>{selectedStudents.size}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Clase seleccionada:</span>
                      <Badge variant={selectedClass ? 'default' : 'outline'}>
                        {selectedClass ? 'Si' : 'No'}
                      </Badge>
                    </div>
                    {selectedClass && selectedStudents.size > 0 && (
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <p className="text-sm text-primary font-medium">
                          Se asignarán {selectedStudents.size} estudandes a la clase seleccionada.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </CardHeader>
              </Card>
            )}
          </div>
        </div>

        <DialogFooter>
          {/* <Button
            variant='outline'
            onClick={handleReset}
            disabled={isAssigning}
          >
            Reiniciar
          </Button> */}

          {/* {showResult ? (
            <Button onClick={handleClose}>
              Cerrar
            </Button>
          ) : ( */}
          <div className="w-full justify-end flex">
            <Button
              onClick={handleMassAssignment}
              disabled={!selectedClass || selectedStudents.size === 0 || isAssigning}
              className=""
            >
              {isAssigning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Asignando...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  Asignar ({selectedStudents.size}) estudiandes
                </>
              )}
            </Button>
          </div>
          {/* )} */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}