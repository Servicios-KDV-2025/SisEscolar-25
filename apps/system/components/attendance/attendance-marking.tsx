"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Calendar, Users, CheckCircle, XCircle, Clock } from "@repo/ui/icons"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card"
import { Button } from "@repo/ui/components/shadcn/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select"
import { Label } from "@repo/ui/components/shadcn/label"
import { useToast } from "@repo/ui/components/shadcn/use-toast"
import { useAttendance } from "stores/attendanceStore" 
import { Id } from "@repo/convex/convex/_generated/dataModel"
// import { Badge } from "@repo/ui/components/shadcn/badge"

// interface AttendanceMarkingProps {
//   studentClasses: StudentWithClass[]
//   attendanceRecords: AttendanceWithStudent[]
// }

export default function AttendanceMarking() {
  const { user } = useUser()
  const { toast } = useToast()
  const {
    students,
    teacherClasses,
    selectedClass,
    selectedDate,
    attendance,
    isLoading,
    isCreating,
    error,
    setSelectedClass,
    setSelectedDate,
    markAttendance
  } = useAttendance()

  const [localAttendance, setLocalAttendance] = useState<Record<string, boolean>>({})

  // Sincronizar el estado local con las asistencias cargadas
  useEffect(() => {
    const initialAttendance: Record<string, boolean> = {}
    attendance.forEach(att => {
      initialAttendance[att.studentClassId] = att.present
    })
    setLocalAttendance(initialAttendance)
  }, [attendance])

  // Handler para cambiar la asistencia localmente
  const handleAttendanceChange = (studentClassId: string, present: boolean) => {
    setLocalAttendance(prev => ({
      ...prev,
      [studentClassId]: present
    }))
  }

  // Handler para guardar todas las asistencias
  const handleSaveAll = () => {
    if (!selectedClass) {
      toast({
        title: "Error",
        description: "Por favor selecciona una clase primero",
        variant: "destructive"
      })
      return
    }

    try {
      const promises = Object.entries(localAttendance).map(([studentClassId, present]) =>
        markAttendance(studentClassId as Id<'studentClass'>, present)
      )

      await Promise.all(promises)

      toast({
        title: "Éxito",
        description: "Asistencias guardadas correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al guardar las asistencias",
        variant: "destructive"
      })
    }
  }

  // Calcular estadísticas
  const totalStudents = students.length
  const presentCount = Object.values(localAttendance).filter(present => present).length
  const absentCount = totalStudents - presentCount
  const attendancePercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0

  // Formatear fecha
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Selectores de clase y fecha */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Asistencia</CardTitle>
          <CardDescription>Selecciona la clase y fecha para marcar asistencia</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="class">Clase</Label>
              <Select
                value={selectedClass || ""}
                onValueChange={(value) => setSelectedClass(value as Id<'classCatalog'>)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una clase" />
                </SelectTrigger>
                <SelectContent>
                  {teacherClasses?.map((classItem: any) => (
                    <SelectItem key={classItem._id} value={classItem._id}>
                      {classItem.name} - {classItem.groupName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <input
                type="date"
                value={new Date(selectedDate).toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value).getTime())}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadisticas */}
      {selectedClass && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total alumnos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">Matriculados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Presentes</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{presentCount}</div>
              <p className="text-xs text-muted-foreground">Alumnos presentes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ausentes</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{absentCount}</div>
              <p className="text-xs text-muted-foreground">Alumnos ausentes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Porcentaje</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendancePercentage}%</div>
              <p className="text-xs text-muted-foreground">Asistencia del día</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de estudiantes */}
      {selectedClass && students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Lista de Estudiantes - {formatDate(selectedDate)}
            </CardTitle>
            <CardDescription>
              Marca la asistencia de cada estudiante para el día seleccionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {students.map((student) => (
                <div
                  key={student.studentClassId}
                  className="felx items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    {student.student.imgUrl ? (
                      <img
                        src={student.student.imgUrl}
                        alt={student.student.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">
                        {student.student.name} {student.student.lastName || ''}
                      </p>
                      <p className="text-sm text-gray-500">
                        Matrícula: {student.student.enrollment}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant={localAttendance[student.studentClassId] ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleAttendanceChange(student.studentClassId, true)}
                        disabled={isCreating}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Presente
                      </Button>

                      <Button
                        variant={localAttendance[student.studentClassId] === false ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => handleAttendanceChange(student.studentClassId, false)}
                        disabled={isCreating}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Ausente
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleSaveAll}
                disabled={isCreating || Object.keys(localAttendance).length === 0}
                size="lg"
              >
                {isCreating ? "Guardando..." : "Guardar Todas las Asistencias"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedClass && students.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay estudiantes</h3>
            <p className="text-gray-500">No hay estudiantes matriculados en esta clase.</p>
          </CardContent>
        </Card>
      )}

      {!selectedClass && (
        <Card>
          <CardContent className="py-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona una clase</h3>
            <p className="text-gray-500">Por favor selecciona una clase para comenzar a marcar asistencia.</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}
// export default function AttendanceMarking({
//   studentClasses,
//   attendanceRecords,
// }: AttendanceMarkingProps) {
//   const [searchTerm, setSearchTerm] = useState("")
//   const [selectedClass, setSelectedClass] = useState("10A")
//   const [comments, setComments] = useState<Record<string, string>>({})

//   const today = new Date().setHours(0, 0, 0, 0)

//   // Filter students by class and search term
//   const filteredStudents = studentClasses.filter(
//     (studentClass) =>
//       studentClass.className === selectedClass &&
//       (studentClass.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         studentClass.student.enrollment.includes(searchTerm)),
//   )

//   // Get today's attendance for each student
//   const getTodayAttendance = (studentClassId: string) => {
//     return attendanceRecords.find(
//       (record) => record.studentClassId === studentClassId && new Date(record.date).setHours(0, 0, 0, 0) === today,
//     )
//   }

//   const handleMarkAttendance = async (studentClassId: string, present: boolean) => {
//     await markAttendance({
//       studentClassId: studentClassId as string,
//       date: Date.now(),
//       present,
//       comments: comments[studentClassId]
//     })
//   }    

//   const handleCommentChange = (studentClassId: string, comment: string) => {
//     setComments((prev) => ({
//       ...prev,
//       [studentClassId]: comment,
//     }))
//   }

//   const getStatusBadge = (studentClassId: string) => {
//     const record = getTodayAttendance(studentClassId)
//     if (!record) return <Badge variant="outline">No marcada</Badge>

//     if (record.present) {
//       return <Badge className="bg-green-500">Presente</Badge>
//     } else {
//       return <Badge variant="destructive">Ausente</Badge>
//     }
//   }

//   const saveAllAttendance = () => {
//     // Here you would typically save to a database
//     alert("Attendance saved successfully!")
//   }

//   return (
//     <div className="space-y-6">
//       <Card>
//         <CardHeader>
//           <CardTitle>Marcar la asistencia diaria</CardTitle>
//           <CardDescription>
//            Marcar la asistencia para{" "}
//             {new Date().toLocaleDateString("en-US", {
//               weekday: "long",
//               year: "numeric",
//               month: "long",
//               day: "numeric",
//             })}
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="flex flex-col sm:flex-row gap-4 mb-6">
//             <div className="relative flex-1">
//               <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
//               <Input
//                 placeholder="Buscar pot nombre o matricula..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="pl-10"
//               />
//             </div>
//             <Select value={selectedClass} onValueChange={setSelectedClass}>
//               <SelectTrigger className="w-full sm:w-[180px]">
//                 <SelectValue placeholder="Select class" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="10A">Clase 10A</SelectItem>
//                 <SelectItem value="10B">Clase 10B</SelectItem>
//                 <SelectItem value="11A">Clase 11A</SelectItem>
//                 <SelectItem value="11B">Clase 11B</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="space-y-4">
//             {filteredStudents.map((studentClass) => {
//               const record = getTodayAttendance(studentClass.id)
//               return (
//                 <div key={studentClass.id} className="border rounded-lg p-4 space-y-4">
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center space-x-4">
//                       <Avatar>
//                         <AvatarImage
//                           src={studentClass.student.imgUrl || "/placeholder.svg"}
//                           alt={studentClass.student.name}
//                         />
//                         <AvatarFallback>
//                           {studentClass.student.name
//                             .split(" ")
//                             .map((n) => n[0])
//                             .join("")}
//                         </AvatarFallback>
//                       </Avatar>
//                       <div>
//                         <p className="font-medium">{studentClass.student.name}</p>
//                         <p className="text-sm text-gray-600">
//                           Matricula: {studentClass.student.enrollment} | Clase: {studentClass.className}
//                         </p>
//                       </div>
//                     </div>

//                     <div className="flex items-center space-x-3">
//                       {getStatusBadge(studentClass.id)}
//                       <div className="flex space-x-2">
//                         <Button
//                           size="sm"
//                           variant={record?.present ? "default" : "outline"}
//                           onClick={() => handleMarkAttendance(studentClass.id, true)}
//                           className="flex items-center space-x-1"
//                         >
//                           <Check className="h-4 w-4" />
//                           <span>Presente</span>
//                         </Button>
//                         <Button
//                           size="sm"
//                           variant={record?.present === false ? "destructive" : "outline"}
//                           onClick={() => handleMarkAttendance(studentClass.id, false)}
//                           className="flex items-center space-x-1"
//                         >
//                           <X className="h-4 w-4" />
//                           <span>Ausente</span>
//                         </Button>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Comments section */}
//                   <div className="space-y-2">
//                     <Label htmlFor={`comments-${studentClass.id}`}>Comentarios (Opcional)</Label>
//                     <Textarea
//                       id={`comments-${studentClass.id}`}
//                       placeholder="Añade cualquier comentario sobre la asistencia...."
//                       value={comments[studentClass.id] || record?.comments || ""}
//                       onChange={(e) => handleCommentChange(studentClass.id, e.target.value)}
//                       className="min-h-[60px]"
//                     />
//                   </div>

//                   {/* Show existing record info */}
//                   {record && (
//                     <div className="text-xs text-gray-500 border-t pt-2">
//                       <p>Creada: {new Date(record.registrationDate).toLocaleString()}</p>
//                       {record.updatedAt && <p>Última actualización: {new Date(record.updatedAt).toLocaleString()}</p>}
//                     </div>
//                   )}
//                 </div>
//               )
//             })}
//           </div>

//           <div className="flex justify-end mt-6">
//             <Button onClick={saveAllAttendance} className="px-8">
//               Guardar asistencia
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }
