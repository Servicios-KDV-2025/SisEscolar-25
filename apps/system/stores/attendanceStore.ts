import { api } from "@repo/convex/convex/_generated/api";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import { useEffect } from "react";
import { create } from "zustand";

export interface AttendanceRecord {
  _id: Id<'attendance'>
  date: number
  attendanceState: 'present' | 'absent' | 'justified' | 'unjustified'
  comments?: string
}

export interface StudentAttendance {
  student: {
    _id: Id<'student'>
    name: string
    lastName?: string
    enrollment: string
  }
  attendanceRecords: {
    classCatalogId: Id<'classCatalog'>
    className: string
    attendanceState: 'present' | 'absent' | 'justified' | 'unjustified' | null
    attendanceId: Id<'attendance'> | null
  }[]
}

export interface AttendanceHistory {
  classCatalog: {
    _id: Id<'classCatalog'>
    name: string
    subject: string
    group: string
  }
  attendanceRecords: AttendanceRecord[] 
}

interface AttendanceState {
  // Estado
  selectedGroup: Id<'group'> | null
  selectedDate: number
  studentsAttendance: StudentAttendance[]
  attendanceHistory: AttendanceHistory[]
  isLoading: boolean
  error: string | null
  // Acciones
  setSelectedGroup: (groupId: Id<'group'> | null) => void
  setSelectedDate: (date: number) => void
  setStudentsAttendance: (attendance: StudentAttendance[]) => void
  setAttendanceHistory: (history: AttendanceHistory[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string) => void
  clearError: () => void
  // Reset
  reset: () => void
}

export const useAttendanceStore = create<AttendanceState>((set) => ({
  // Estado inicial
  selectedGroup: null,
  selectedDate: Date.now(),
  studentsAttendance: [],
  attendanceHistory: [],
  isLoading: false,
  error: null,
  // Setters
  setSelectedGroup: (groupId) => set({selectedGroup: groupId}),
  setSelectedDate: (date) => set({selectedDate: date}),
  setStudentsAttendance: (attendance) => set({studentsAttendance: attendance}), 
  setAttendanceHistory: (history) => set({attendanceHistory: history}),
  setLoading: (loading) => set({isLoading: loading}),
  setError: (error) => set({error: error}),
  clearError: () => set({error: null}),
  // Reset
  reset: () => set({
    selectedGroup: null,
    selectedDate:Date.now(),
    studentsAttendance: [],
    attendanceHistory: [],
    isLoading: false,
    error: null
  })
}))

// Hook personalizado que combina Zustand con Convex
export const useAttendanceWithConvex = (schoolId?: Id<'school'>, teacherId?: Id<'user'>) => {
  const store = useAttendanceStore()

  // Queries
  const teacherGroups = useQuery(
    api.functions.attendance.getTeacherGroup,
    schoolId && teacherId ? {schoolId, teacherId} : 'skip'
  )

  const studentsForAttendance = useQuery(
    api.functions.attendance.getStudentsByGroupForAttendance,
    schoolId && store.selectedGroup ? {
      schoolId,
      groupId: store.selectedGroup,
      date: store.selectedDate
    } : 'skip'
  )

  // Mutation
  const updateAttendanceMutation = useMutation(api.functions.attendance.updateAttendance)

  // Efectos para actualizar el store cuando cambian los datos
  useEffect(() => {
    if(studentsForAttendance) {
      store.setStudentsAttendance(studentsForAttendance)
    }
  }, [studentsForAttendance])

  // Funciones
  const updateAttendance = async (
    studentClassId: Id<'studentClass'>,
    attendanceState: 'present' | 'absent' | 'justified' | 'unjustified' ,
    comments?: string
  ) => {
    if(!teacherId) {
      store.setError('No hay profesor autenticado')
      return false
    }

    try {
      store.setLoading(true)
      store.clearError()

      await updateAttendanceMutation({
        studentClassId,
        date: store.selectedDate,
        attendanceState,
        comments,
        updatedBy: teacherId
      })

      store.setLoading(false)
      return true
    } catch(error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar asistencia'
      store.setError(errorMessage)
      store.setLoading(false)
      return false
    }  
  }
  
  const fetchAttendanceHistory = async (
    studentId: Id<"student">,
    classCatalogId?: Id<"classCatalog">,
    startDate?: number,
    endDate?: number
  ) => {
    if (!schoolId) {
      store.setError('No hay escuela seleccionada');
      return;
    }

    try {
      store.setLoading(true);
      store.clearError();
      
      // Esta función se implementaría con una query adicional si es necesario
      // Por ahora usamos la query existente
      store.setLoading(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener historial';
      store.setError(errorMessage);
      store.setLoading(false);
    }
  }

  return {
    // Estado
    teacherGroups: teacherGroups || [],
    studentsAttendance: store.studentsAttendance,
    selectedGroup: store.selectedGroup,
    selectedDate: store.selectedDate,
    isLoading: store.isLoading,
    error: store.error,
    
    // Acciones
    setSelectedGroup: store.setSelectedGroup,
    setSelectedDate: store.setSelectedDate,
    updateAttendance,
    fetchAttendanceHistory,
    clearError: store.clearError,
    reset: store.reset,
  }
}

  
