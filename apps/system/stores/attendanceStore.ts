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
  justified?: boolean
  comments?: string
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
  // createdBy: Id<'user'>
  // updatedBy: Id<'user'>
  // updatedAt: number
}

export type updateAttendance = {
  id: Id<'attendance'>
  // studentClassId: Id<'studentClass'>
  // date: number
  present: boolean
  justified?: boolean
  comments?: string
  // registrationDate: number
  // createdBy: Id<'user'>
  // updatedBy: Id<'user'>
  // updatedAt: number
}

export type AttendanceWithStudent = Attendance & {
  student: {
    _id: Id<'student'>
    name: string
    lastName?: string
    enrollment: string
    imgUrl?: string
  }
  className: string
}

export type StudentWithClass = {
  studentClassId: Id<'studentClass'>
  student: {
    _id: Id<'student'>
    name: string
    lastName?: string
    enrollment: string
    imgUrl?: string
  }
}

export type AttendanceStore = {
  attendance: AttendanceWithStudent[]
  students: StudentWithClass[]
  selectedClass: Id<'classCatalog'> | null
  selectedDate: number
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  error: string | null
  setAttendance: (attendance: AttendanceWithStudent[]) => void
  setStudents: (students: StudentWithClass[]) => void
  setSelectedClass: (classId: Id<'classCatalog'> | null) => void
  setSelectedDate: (date: number) => void
  setLoading: (loading: boolean) => void
  setCreating: (creating: boolean) => void
  setUpdating: (updating: boolean) => void
  setError: (error: string | null) => void
  clearErrors: () => void
}

const initialState: Omit<AttendanceStore,
  'setAttendance' | 'setStudents' | 'setSelectedClass' | 'setSelectedDate' | 
  'setLoading' | 'setCreating' | 'setUpdating' | 'setError' | 'clearErrors'
> = {
  attendance: [],
  students: [],
  selectedClass: null,
  selectedDate: Date.now(),
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  error: null
}

export const useAttendanceStore = create<AttendanceStore>((set) => ({
  ...initialState,
  setAttendance: (attendance) => set({attendance}),
  setStudents: (students) => set({students}),
  setSelectedClass: (selectedClass) => set({selectedClass}),
  setSelectedDate: (selectedDate) => set({selectedDate}),
  setLoading: (isLoading) => set({isLoading}),
  setCreating: (isCreating) => set({isCreating}),
  setUpdating: (isUpdating) => set({ isUpdating }),
  setError: (error) => set({ error }),
  clearErrors: () => set({error: null})
}))

export const useAttendance = (studentClassId: Id<'studentClass'>, classCatalogId: Id<'classCatalog'>  ) => {
  const {
    attendance,
    students,
    selectedClass,
    selectedDate,
    isLoading,
    isCreating,
    isUpdating,
    error,
    setAttendance,
    setStudents,
    setSelectedClass,
    setSelectedDate,
    setCreating,
    setUpdating,
    setError,
    clearErrors,
  } = useAttendanceStore()

  //ObtenerClases del profesor actual
  const teacherClasses = useQuery(
    api.functions.attendance.getTeacherClasses, {}
  )

  // Obtener estudiantes de la seleccionada
  const studentQuery = useQuery(
    api.functions.student.getStudentsByClass,
    classCatalogId ? {classCatalogId} : 'skip'
  )

  // Obtener las asistencias del dia seleccionado
  const attendanceQuery = useQuery(
    api.functions.attendance.getAttendanceByDateandClass,
    selectedClass ? {
      date: selectedDate,
      classCatalogId: selectedClass,
    } : 'skip'
  )

  // MUTACIONES
  const markAttendanceMutation = useMutation(api.functions.attendance.markAttendanceSimple)

  // Cambuar estudiantes cuando cambie la clase seleccionada
  useEffect(() => {
    if(studentQuery && Array.isArray(studentQuery)) {
      const formattendStudents: StudentWithClass[] = studentQuery.map((sc) => ({
        studentClassId: sc._id,
        student: {
          _id: sc.studentId,
          name: sc.student?.name || '',
          lastName: sc.student?.lastName || '',
          enrollment: sc.student?.enrollment || '',
          imgUrl: sc.student?.imgUrl
        },
        className: sc.className || 'Unknow'
      }))
      setStudents(formattendStudents)
    }
  },[studentQuery, setStudents])

  // Cambiar asistencias cuando cambie la fecha o la clase
  useEffect(() => {
    if(attendanceQuery && Array.isArray(attendanceQuery)) {
      const formattedAttendance: AttendanceWithStudent[] = attendanceQuery.map((att: any) => ({
        _id: att._id,
        studentClassId: att.studentClassId,
        date: att.date,
        present: att.present,
        justified: att.justified,
        comments: att.comments,
        registrationDate: att.registrationDate,
        createdBy: att.createdBy,
        updatedBy: att.updatedBy,
        updatedAt: att.updatedAt,
        student: att.student || {
          _id: '' as Id<'student'>,
          name: 'Unknown',
          enrollment: ''
        },
        className: att.className || 'Unknown'
      }))
      setAttendance(formattedAttendance)
    }
  },[attendanceQuery, setAttendance])

  // Marcar Asistencia
  const markAttendance = useCallback( async (
    studentClassId: Id<'studentClass'>,
    present: boolean,
    comments?: string
  ) => {
    if (!selectedClass) {
      setError('No hay clase seleccionada')
      return
    }

    setCreating(true)
    clearErrors()

    try {
      await markAttendanceMutation({
        studentClassId,
        date: selectedDate,
        present,
        comments
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al marcar asistencia'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setCreating(false)
    }
  }, [selectedClass, selectedDate, markAttendanceMutation, setCreating, setError, clearErrors])

  return {
    // Estado
    attendance,
    students,
    teacherClasses,
    selectedClass,
    selectedDate,
    isLoading,
    isCreating,
    isUpdating,
    error,
    
    // Acciones
    setSelectedClass,
    setSelectedDate,
    markAttendance,
    clearErrors
  }
}


  // Query para obtener las asistencias de la clase
  // const attendanceQuery = useQuery(
  //   api.functions.attendance.getAttendance,
  //   studentClassId ? { studentClassId } : 'skip'
  // )
  // const studentClasses = useQuery(
  //   api.functions.student.getStudentWithClasses, classCatalogId ? { classCatalogId } : 'skip'
  // )
  // const attendanceRecords = useQuery(
  //   api.functions.attendance.getAttendanceWithStudents, classCatalogId ? { classCatalogId } : 'skip'
  // )

  // // Mutations
  // const createAttendanceMutation = useMutation(api.functions.attendance.createAttendance)
  // const updateAttendanceMutation = useMutation(api.functions.attendance.updateAttendance)
  // const deleteAttendanceMutatuon = useMutation(api.functions.attendance.deleteAttendance)

  // // Create
  // const createAttendance = useCallback(async (data: CreateAttendance) => {
  //   setCreating(true)
  //   setCreateError(null)
  //   try {
  //     await createAttendanceMutation({
  //       ...data,
  //       studentClassId: data.studentClassId as Id<'studentClass'>
  //     })
  //   } catch(error) {
  //     const errorMessage = error instanceof Error ? error.message : 'Error al crear las asistencias'
  //     setCreateError(errorMessage)
  //     throw new Error(errorMessage)
  //   } finally {
  //     setCreating(false)
  //   }
  // },[createAttendanceMutation, setCreating, setCreateError])

  // // UPDATE
  // const updateAttendance = useCallback(async (data: updateAttendance) => {
  //   setUpdating(true)
  //   setUpdateError(null)
  //   try{
  //     await updateAttendanceMutation({
  //       id: data.id,
  //       studentClassId: data.studentClassId,
  //       date: data.date,
  //       present: data.present,
  //       justified: data.justified,
  //       comments: data.comments,
  //       registrationDate: data.registrationDate,
  //       createdBy: data.createdBy,
  //       updatedBy: data.updatedBy,
  //       updatedAt: data.updatedAt
  //     })
  //   } catch(error) {
  //     const errorMessage = error instanceof Error ? error.message : 'Error al actualizar asistencia'
  //     setUpdateError(errorMessage)
  //     throw new Error(errorMessage)
  //   } finally {
  //     setUpdating(false)
  //   }
  // },[updateAttendanceMutation, setUpdating, setUpdateError])

  // // DELETE
  // const deleteAttendance = useCallback(async (id: string, studentClassId: string) => {
  //   setDeleting(true)
  //   setDeleteError(null)
  //   try {
  //     await deleteAttendanceMutatuon({
  //       id: id as Id<'attendance'>,
  //       studentClassId: studentClassId as Id<'studentClass'>
  //     })
  //   } catch(error) {
  //     const errorMessage = error instanceof Error ? error.message : 'Error al eliminar asistencia'
  //     setDeleteError(errorMessage)
  //     throw new Error(errorMessage)
  //   } finally {
  //     setDeleting(false)
  //   }
  // },[deleteAttendanceMutatuon, setDeleting, setDeleteError])

  // // Refrescar periodos cuando cambie la query
  // useEffect(() => {
  //   if(attendanceQuery) {
  //     setAttendance(
  //       (attendanceQuery as AttendanceQueryData[]).map((p) => ({
  //         _id: p._id,
  //         studentClassId: p.studentClassId,
  //         date: p.date,
  //         present: p.present,
  //         justified: p.justified,
  //         comments: p.comments,
  //         registrationDate: p.registrationDate,
  //         createdBy: p.createdBy,
  //         updatedBy: p.updatedBy,
  //         updatedAt: p.updatedAt
  //       }))
  //     )
  //   }
  // }, [attendanceQuery, setAttendance])

  // return {
  //   attendance,
  //   selectedAttendance,
  //   isLoading,
  //   isCreating,
  //   isUpdating,
  //   isDeleting,
  //   error,
  //   createError,
  //   updateError,
  //   deleteError,
  //   createAttendance,
  //   updateAttendance,
  //   deleteAttendance,
  //   setSelectedAttendance,
  //   clearErrors,
  // }
// }