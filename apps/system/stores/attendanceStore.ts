import { api } from "@repo/convex/convex/_generated/api"
import { Id } from "@repo/convex/convex/_generated/dataModel"
import { useMutation, useQuery } from "convex/react"
import { useCallback, useEffect } from "react"
import { create } from "zustand"

// Tipo de ASISTENCIA basado en el schema de Convex
export type Attendance = {
  _id: string
  studentClassId: Id<'studentClass'>
  date: number
  present: boolean
  justified: boolean
  comments: string
  registrationDate: number
  createdBy: Id<'user'>
  updatedBy: Id<'user'>
  updatedAt: number
}

export type CreateAttendance = {
  studentClassId: Id<'studentClass'>
  date: number
  present: boolean
  justified?: boolean
  comments?: string
  registrationDate: number
  createdBy: Id<'user'>
  updatedBy: Id<'user'>
  updatedAt: number
}

export type updateAttendance = {
  id: Id<'attendance'>
  studentClassId: Id<'studentClass'>
  date: number
  present: boolean
  justified?: boolean
  comments?: string
  registrationDate: number
  createdBy: Id<'user'>
  updatedBy: Id<'user'>
  updatedAt: number
}

export type AttendanceStore = {
  attendance: Attendance[]
  selectedAttendance: Attendance | null
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  error: string | null
  createError: string | null
  updateError: string | null
  deleteError: string | null
  setAttendance: (attendance: Attendance[]) => void
  setSelectedAttendance: (attendance: Attendance | null) => void
  setLoading: (loading: boolean) => void
  setCreating: (creating: boolean) => void
  setUpdating: (updating: boolean) => void
  setDeleting: (deleting: boolean) => void
  setError: (error: string | null) => void
  setCreateError: (error: string | null) => void
  setUpdateError: (error: string | null) => void
  setDeleteError: (error: string | null) => void
  clearErrors: () => void
  reset: () => void
}

const initialState = {
  attendance: [],
  selectedAttendance: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  createError: null,
  updateError: null,
  deleteError: null
}

export const useAttendanceStore = create<AttendanceStore>((set) => ({
  ...initialState,
  setAttendance: (attendance) => set({attendance}),
  setSelectedAttendance: (selectedAttendance) => set({selectedAttendance}),
  setLoading: (isLoading) => set({isLoading}),
  setCreating: (isCreating) => set({isCreating}),
  setUpdating: (isUpdating) => set({ isUpdating }),
  setDeleting: (isDeleting) => set({ isDeleting }),
  setError: (error) => set({ error }),
  setCreateError: (createError) => set({ createError }),
  setUpdateError: (updateError) => set({ updateError }),
  setDeleteError: (deleteError) => set({ deleteError }),
  clearErrors: () => set({
    error: null,
    createError: null,
    updateError: null,
    deleteError: null,
  }),
  reset: () => set(initialState),
}))

type AttendanceQueryData = {
  _id: Id<'attendance'>
  studentClassId: Id<'studentClass'>
  date: number
  present: boolean
  justified: boolean
  comments: string
  registrationDate: number
  createdBy: Id<'user'>
  updatedBy: Id<'user'>
  updatedAt: number
}

export const useAttendance = (studentClassId: Id<'studentClass'>) => {
  const {
    attendance,
    selectedAttendance,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    createError,
    updateError,
    deleteError,
    setAttendance,
    setSelectedAttendance,
    setCreating,
    setUpdating,
    setDeleting,
    setCreateError,
    setUpdateError,
    setDeleteError,
    clearErrors,
  } = useAttendanceStore()

  // Query para obtener las asistencias de la clase
  const attendanceQuery = useQuery(
    api.functions.attendance.getAttendance,
    studentClassId ? { studentClassId } : 'skip'
  )

  // Mutations
  const createAttendanceMutation = useMutation(api.functions.attendance.createAttendance)
  const updateAttendanceMutation = useMutation(api.functions.attendance.updateAttendance)
  const deleteAttendanceMutatuon = useMutation(api.functions.attendance.deleteAttendance)

  // Create
  const createAttendance = useCallback(async (data: CreateAttendance) => {
    setCreating(true)
    setCreateError(null)
    try {
      await createAttendanceMutation({
        ...data,
        studentClassId: data.studentClassId as Id<'studentClass'>
      })
    } catch(error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear las asistencias'
      setCreateError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setCreating(false)
    }
  },[createAttendanceMutation, setCreating, setCreateError])

  // UPDATE
  const updateAttendance = useCallback(async (data: updateAttendance) => {
    setUpdating(true)
    setUpdateError(null)
    try{
      await updateAttendanceMutation({
        id: data.id,
        studentClassId: data.studentClassId,
        date: data.date,
        present: data.present,
        justified: data.justified,
        comments: data.comments,
        registrationDate: data.registrationDate,
        createdBy: data.createdBy,
        updatedBy: data.updatedBy,
        updatedAt: data.updatedAt
      })
    } catch(error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar asistencia'
      setUpdateError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setUpdating(false)
    }
  },[updateAttendanceMutation, setUpdating, setUpdateError])

  // DELETE
  const deleteAttendance = useCallback(async (id: string, studentClassId: string) => {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteAttendanceMutatuon({
        id: id as Id<'attendance'>,
        studentClassId: studentClassId as Id<'studentClass'>
      })
    } catch(error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar asistencia'
      setDeleteError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setDeleting(false)
    }
  },[deleteAttendanceMutatuon, setDeleting, setDeleteError])

  // Refrescar periodos cuando cambie la query
  useEffect(() => {
    if(attendanceQuery) {
      setAttendance(
        (attendanceQuery as AttendanceQueryData[]).map((p) => ({
          _id: p._id,
          studentClassId: p.studentClassId,
          date: p.date,
          present: p.present,
          justified: p.justified,
          comments: p.comments,
          registrationDate: p.registrationDate,
          createdBy: p.createdBy,
          updatedBy: p.updatedBy,
          updatedAt: p.updatedAt
        }))
      )
    }
  }, [attendanceQuery, setAttendance])

  return {
    attendance,
    selectedAttendance,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    createError,
    updateError,
    deleteError,
    createAttendance,
    updateAttendance,
    deleteAttendance,
    setSelectedAttendance,
    clearErrors,
  }
}