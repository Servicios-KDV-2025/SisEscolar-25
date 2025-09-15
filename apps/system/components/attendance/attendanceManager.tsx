'use client'

import { useUser } from "@clerk/nextjs"
import { api } from "@repo/convex/convex/_generated/api"
import { Id } from "@repo/convex/convex/_generated/dataModel"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { Button } from "@repo/ui/components/shadcn/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card"
import { Label } from "@repo/ui/components/shadcn/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select"
import { Textarea } from "@repo/ui/components/shadcn/textarea"
import { Calendar, Save, Users } from "@repo/ui/icons"
import { useMutation, useQuery } from "convex/react"
import { useState, useMemo } from "react"
import { useClassCatalog } from "stores/classCatalogStore"
import { useCurrentSchool } from "stores/userSchoolsStore"
import { useUserWithConvex } from "stores/userStore"

type AttendanceState = "present" | "absent" | "justified" | "unjustified"

interface AttendanceRecord {
  studentClassId: Id<'studentClass'>
  state: AttendanceState
  comments: string
}

export default function AttendanceManager() {
  const { user: clerkUser } = useUser()
  const { currentUser } = useUserWithConvex(clerkUser?.id)
  const {currentSchool, isLoading} = useCurrentSchool(currentUser?._id)
  const { classCatalogs } = useClassCatalog(currentSchool?.school._id as Id<'school'>)

  const [selectedClass, setSelectedClass] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]) // Formato YYYY-MM-DD
  // const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({})
  const [temporaryUpdates, setTemporaryUpdates] = useState<Record<string, Partial<AttendanceRecord>>>({})
  const [isSaving, setIsSaving] = useState(false)

  const createAttendanceMutation = useMutation(api.functions.attendance.createAttendance)

  // const dateTimestamp = selectedDate ? Math.floor(new Date(selectedDate).getTime() / 1000) : 0
  const dateTimestamp = useMemo(() => 
    selectedDate ? Math.floor(new Date(selectedDate).getTime() / 1000) : 0
  , [selectedDate])

  const existingAttendance = useQuery(
    api.functions.attendance.getAttendanceByClassAndDate,
    selectedClass && currentUser?._id ? {
      classCatalogId: selectedClass as Id<'classCatalog'>,
      date: dateTimestamp
    } : 'skip'
  )

  const studentClasses = useQuery(
    api.functions.studentsClasses.getStudentClassesBySchool,
    currentSchool ? { schoolId: currentSchool.school._id as Id<'school'> } : 'skip'
  )

  // Filtrar estudiantes que pertenecen a la clase seleccionada
  // const studentsInSelectedClass = studentClasses?.filter((sc) => 
  //   sc?.classCatalog._id === selectedClass
  // )
  const studentsInSelectedClass = useMemo(() => 
    studentClasses?.filter((sc) => sc?.classCatalog._id === selectedClass)
  , [studentClasses, selectedClass])

  // Cargar asistencia existente cuando cambia la clase o fecha
  // useEffect(() => {
  //   if(existingAttendance && studentsInSelectedClass) {
  //     const initialRecords: Record<string, AttendanceRecord> = {}

  //     studentsInSelectedClass.forEach((sc) => {
  //       if(!sc) return

  //       const existingRecord = existingAttendance.find(
  //         (record) => record.studentId === sc.student._id
  //       )

  //       if(existingRecord?.attendance) {
  //         initialRecords[sc.student._id] = {
  //           studentClassId: existingRecord.studentClassId,
  //           state: existingRecord.attendance.attendanceState,
  //           comments: existingRecord.attendance.comments || ''
  //         }
  //       } else if(sc._id) {
  //         initialRecords[sc.student._id] = {
  //           studentClassId: sc._id,
  //           state: 'present',
  //           comments: ''
  //         }
  //       }
  //     })
  //     setAttendanceRecords(initialRecords)
  //   }
  // }, [existingAttendance, studentsInSelectedClass])
  const baseAttendanceRecords = useMemo(() => {
    const records: Record<string, AttendanceRecord> = {}
    
    if (!existingAttendance || !studentsInSelectedClass) {
      return records
    }

    studentsInSelectedClass.forEach((sc) => {
      if (!sc) return

      const existingRecord = existingAttendance.find(
        (record) => record.studentId === sc.student._id
      )

      if (existingRecord?.attendance) {
        records[sc.student._id] = {
          studentClassId: existingRecord.studentClassId,
          state: existingRecord.attendance.attendanceState,
          comments: existingRecord.attendance.comments || ''
        }
      } else if (sc._id) {
        records[sc.student._id] = {
          studentClassId: sc._id,
          state: 'present',
          comments: ''
        }
      }
    })
    
    return records
  }, [existingAttendance, studentsInSelectedClass])

  // Combinar registros base con actualizaciones temporales
  const attendanceRecords = useMemo(() => {
    const combined: Record<string, AttendanceRecord> = { ...baseAttendanceRecords }
    
    Object.entries(temporaryUpdates).forEach(([studentId, updates]) => {
      if (combined[studentId]) {
        combined[studentId] = { ...combined[studentId], ...updates }
      } else if (studentsInSelectedClass) {
        const studentClass = studentsInSelectedClass.find(sc => sc?.student._id === studentId)
        if (studentClass?._id) {
          combined[studentId] = {
            studentClassId: studentClass._id,
            state: "present",
            comments: "",
            ...updates
          }
        }
      }
    })
    
    return combined
  }, [baseAttendanceRecords, temporaryUpdates, studentsInSelectedClass])

  const getStateColor = (state: AttendanceState) => {
    switch (state) {
      case "present":
        return "bg-green-100 text-green-800 border-green-200"
      case "absent":
        return "bg-red-100 text-red-800 border-red-200"
      case "justified":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "unjustified":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const updateAttendance = (studentId: string, field: keyof AttendanceRecord, value: string) => {
    setTemporaryUpdates((prev) => {
      const currentRecord = prev[studentId] || {
        studentClassId: studentsInSelectedClass?.find(sc => sc?.student._id === studentId)?._id as Id<"studentClass">,
        state: "present" as AttendanceState,
        comments: ""
      }

      return {
        ...prev,
        [studentId]: {
          ...currentRecord,
          [field]: value
        }
      }
    })
  }

  const handleSave = async () => {
    if(!currentUser?._id) return

    setIsSaving(true)
    try {
      const dateTimestamp = selectedDate ? Math.floor(new Date(selectedDate).getTime() / 1000) : 0

      const savePromises = Object.values(attendanceRecords).map( async (record) => {
        await createAttendanceMutation({
          studentClassId: record.studentClassId,
          date: dateTimestamp,
          attendanceState: record.state,
          comments: record.comments,
          createdBy: currentUser._id as Id<'user'>,
          updatedBy: currentUser._id as Id<'user'>
        })
      })

      await Promise.all(savePromises)

      console.log('Asistencia guardada exitosamente') // Agregar una notificación de exito
    } catch {
      console.error('Error al guardar la asistencia') // Agregar una notificación de error
    } finally {
      setIsSaving(false)
    }
  }

  if(isLoading) {
    return <div className="text-center py-10">Cargando escuela...</div>
  }

  return(
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Configuración de Asistencia {dateTimestamp}
          </CardTitle>
          <CardDescription>Selecciona la clase y fecha para registrar la asistencia</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="class-select">Clase</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una clase" />
              </SelectTrigger>
              <SelectContent>
                {classCatalogs?.map((cc) => (
                  <SelectItem key={cc._id} value={cc._id}>
                    {cc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date-input">Fecha</Label>
            <input
              id="date-input"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de estudiantes */}
      {selectedClass && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lista de Estudiantes
            </CardTitle>
            <CardDescription>Registra la asistencia de cada estudiante</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedClass && studentsInSelectedClass && studentsInSelectedClass.length > 0 ? (
                studentsInSelectedClass
                  .filter((sc) => sc !== null && sc !== undefined)
                  .map((sc) => (
                    <div key={sc!.student._id} className="border rounded-lg p-4 space-y3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{sc!.student.name} {sc!.student.lastName}</h4>
                          <p className="text-sm text-muted-foreground">Matricula: {sc!.student.enrollment}</p>
                        </div>
                        <Badge
                          className={getStateColor(attendanceRecords[sc!.student._id]?.state || 'present')}
                        >
                          {attendanceRecords[sc!.student._id]?.state || 'Presente'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Estado de Asistencia</Label>
                          <Select
                            value={attendanceRecords[sc!.student._id]?.state || 'present'}
                            onValueChange={(value) => updateAttendance(sc!.student._id, 'state', value as AttendanceState)}
                          >
                            <SelectTrigger>
                              <SelectValue/>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">Presente</SelectItem>
                              <SelectItem value="absent">Ausente</SelectItem>
                              <SelectItem value="justified">Justificado</SelectItem>
                              <SelectItem value="unjustified">Injustificado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Comentarios (opcional)</Label>
                          <Textarea
                            placeholder="Agrega un comentario..."
                            value={attendanceRecords[sc!.student._id]?.comments || ''}
                            onChange={(e) => updateAttendance(sc!.student._id, 'comments', e.target.value)}
                            className="min-h-[80px]"
                          />
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-center py-4">No hay estudiantes en esta clase.</p>
              )}
            </div>

            {studentsInSelectedClass && studentsInSelectedClass.length > 0 && (
              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4"/>
                  {isSaving ? 'Guardando...' : 'Guardar Asistencia'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
    </div>
  )
}