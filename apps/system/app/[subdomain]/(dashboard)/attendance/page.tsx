"use client"

import { useUser } from "@clerk/nextjs"
import { api } from "@repo/convex/convex/_generated/api"
import { Id } from "@repo/convex/convex/_generated/dataModel"
import { Button } from "@repo/ui/components/shadcn/button"
import { Calendar } from "@repo/ui/components/shadcn/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card"
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/shadcn/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select"
import { BookOpen, CalendarIcon, Loader2, Save } from "@repo/ui/icons"
import AttendanceTable from "components/attendance/attendanceTable"
import { useMutation, useQuery } from "convex/react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useAttendance } from "stores/attendanceStore"
import { useUserSchoolsWithConvex } from "stores/userSchoolsStore"
import { useUserWithConvex } from "stores/userStore"

// Función para formatear fechas en español
const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  return date.toLocaleDateString('es-ES', options);
};

// Función para obtener solo la fecha sin hora (timestamp de inicio del día)
const getStartOfDayTimestamp = (date: Date): number => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate.getTime();
}

export default function AttendanceDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Obtener usuario actual
  const {user: clerkUser} = useUser()
  const { currentUser } = useUserWithConvex(clerkUser?.id)

  // Obtener escuela del usuario actual
  const {userSchools, isLoading: schoolsLoading} = useUserSchoolsWithConvex(currentUser?._id)

  const teacherClasses = useQuery(
    api.functions.attendance.getTeacherClasses, 
    currentUser ? {userId: currentUser._id} : 'skip'
  )

   // Obtener todas las clases activas
  const allClasses = useQuery(api.functions.attendance.getAllActiveClasses)
  
  // Obtener estudiantes y asistencias para la clase seleccionada
  const attendanceQueryData = useQuery(
    api.functions.attendance.getAttendanceByDate,
    selectedClass ? {
      classCatalogId: selectedClass as any,
      date: getStartOfDayTimestamp(selectedDate)
    } : 'skip'
  )

  const { attendanceData, updateAttendance, getAttendanceForSubmit } = useAttendance(attendanceQueryData || [])

  const registerAttendance = useMutation(api.functions.attendance.registerAttendance)

  // Actualizar datos locales cuando cambia la query
  useEffect(() => {
    if (attendanceQueryData) {
      // Resetear el estado local con los datos de la query
      const newData = attendanceQueryData.map(item => ({
        ...item,
        present: item.present ?? false,
        justified: item.justified ?? false,
        comments: item.comments || ''
      }));
      // Necesitarías actualizar el hook useAttendance aquí
    }
  }, [attendanceQueryData])

  const handleSaveAttendance = async () => {
    if (!selectedClass || !attendanceData.length || !currentUser) return

    setIsSubmitting(true)
    try{
      const attendances = attendanceData.map(item => ({
        studentClassId: item.studentClassId,
        present: item.present ?? false,
        justified: item.justified ?? false,
        comments: item.comments || ''
      }));

      await registerAttendance({
        classCatalogId: selectedClass as any,
        date: getStartOfDayTimestamp(selectedDate),
        attendances
      })

      toast.success('✅ Asistencias guardadas')
    }catch (error) {
      console.error('Error al guardar asistencias:', error);
      toast.error('❌ Error')
    }finally {
      setIsSubmitting(false)
    }
  }

  const selectedClassInfo = allClasses?.find(cls => cls._id === selectedClass)

  return (
    <main className="container mx-auto py-10">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Sistema de Asistencias</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registro de asistencia</CardTitle>
          <CardDescription>
            Selecciona la clase y fecha para registrar las asistencias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end mb-6">
            {/* Selector de clase */}
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Clase</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una clase" />
                </SelectTrigger>
                <SelectContent>
                  {allClasses?.map((classItem) => (
                    <SelectItem key={classItem._id} value={classItem._id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{classItem.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {classItem.subjectName} - {classItem.groupName}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selector de fecha */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      formatDate(selectedDate) // ✅ Usamos la función nativa
                    ) : (
                      <span>Selecciona una fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Botón de guardar */}
            <div className="flex items-end">
              <Button
                onClick={handleSaveAttendance}
                disabled={!selectedClass || !attendanceData.length || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Asistencias
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Información de la clase seleccionada */}
          {selectedClassInfo && (
            <div className="bg-muted p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-lg mb-2">Información de la Clase</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Materia:</span>
                  <p>{selectedClassInfo.subjectName}</p>
                </div>
                <div>
                  <span className="font-medium">Grupo:</span>
                  <p>{selectedClassInfo.groupName}</p>
                </div>
                <div>
                  <span className="font-medium">Profesor:</span>
                  <p>{selectedClassInfo.teacherName}</p>
                </div>
                <div>
                  <span className="font-medium">Ciclo:</span>
                  <p>{selectedClassInfo.cycleName}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tabla de asistencias */}
          {selectedClass && attendanceQueryData && (
            <AttendanceTable
              data={attendanceData}
              selectedDate={selectedDate}
              onAttendanceChange={updateAttendance}
            />
          )}
        </CardContent>
      </Card>
    </main>
  )
}