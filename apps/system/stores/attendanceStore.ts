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


  
