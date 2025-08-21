export interface AttendanceRecord {
  studentClassId: string
  date: number
  present: boolean
  justified?: boolean
  comments?: string
  registrationDate: number
  createdBy: string
  updatedBy?: string
  updatedAt?: number
}

export interface Student {
  id: string
  name: string
  rollNumber: string
  email: string
  phone: string
  avatar?: string
}

export interface StudentClass {
  id: string
  studentId: string
  classId: string
  className: string
  student: Student
}

export interface AttendanceWithStudent extends AttendanceRecord {
  student: Student
  className: string
}
