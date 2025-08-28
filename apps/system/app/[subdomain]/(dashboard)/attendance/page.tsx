"use client"

import { useState } from "react"
import { Calendar, Users, AlertCircle, CheckCircle, XCircle } from "@repo/ui/icons"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/shadcn/tabs"
import { Button } from "@repo/ui/components/shadcn/button"
import AttendanceMarking from "components/attendance/attendance-marking"
import AbsenceJustification from "components/attendance/absence-justification"  //"@/components/absence-justification"
import AttendanceHistory from "components/attendance/attendance-history"
import StudentManagement from "components/attendance/student-management"
import type { AttendanceRecord, StudentClass } from "@/types/attendance"

// Mock data matching the schema
const mockStudentClasses: StudentClass[] = [
  {
    id: "sc1",
    studentId: "s1",
    classId: "c1",
    className: "10A",
    student: {
      id: "s1",
      name: "John Doe",
      rollNumber: "2024001",
      email: "john.doe@school.edu",
      phone: "+1234567890",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  },
  {
    id: "sc2",
    studentId: "s2",
    classId: "c1",
    className: "10A",
    student: {
      id: "s2",
      name: "Jane Smith",
      rollNumber: "2024002",
      email: "jane.smith@school.edu",
      phone: "+1234567891",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  },
  {
    id: "sc3",
    studentId: "s3",
    classId: "c1",
    className: "10A",
    student: {
      id: "s3",
      name: "Mike Johnson",
      rollNumber: "2024003",
      email: "mike.johnson@school.edu",
      phone: "+1234567892",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  },
  {
    id: "sc4",
    studentId: "s4",
    classId: "c1",
    className: "10A",
    student: {
      id: "s4",
      name: "Sarah Wilson",
      rollNumber: "2024004",
      email: "sarah.wilson@school.edu",
      phone: "+1234567893",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  },
]

const mockAttendanceRecords: AttendanceRecord[] = [
  {
    studentClassId: "sc1",
    date: Date.now() - 86400000, // Yesterday
    present: true,
    registrationDate: Date.now() - 86400000,
    createdBy: "teacher1",
  },
  {
    studentClassId: "sc2",
    date: Date.now() - 86400000,
    present: false,
    justified: false,
    comments: "No reason provided",
    registrationDate: Date.now() - 86400000,
    createdBy: "teacher1",
  },
  {
    studentClassId: "sc3",
    date: Date.now() - 86400000,
    present: false,
    justified: true,
    comments: "Medical appointment",
    registrationDate: Date.now() - 86400000,
    createdBy: "teacher1",
    updatedBy: "admin1",
    updatedAt: Date.now() - 82800000,
  },
  {
    studentClassId: "sc4",
    date: Date.now() - 86400000,
    present: true,
    registrationDate: Date.now() - 86400000,
    createdBy: "teacher1",
  },
]

export default function AttendanceDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(mockAttendanceRecords)
  const [studentClasses] = useState<StudentClass[]>(mockStudentClasses)

  // Calculate stats
  const today = new Date().setHours(0, 0, 0, 0)
  const todayRecords = attendanceRecords.filter((record) => {
    const recordDate = new Date(record.date).setHours(0, 0, 0, 0)
    return recordDate === today
  })

  const totalStudents = studentClasses.length
  const presentToday = todayRecords.filter((record) => record.present).length
  const absentToday = todayRecords.filter((record) => !record.present).length
  const pendingJustifications = attendanceRecords.filter(
    (record) => !record.present && record.justified === false,
  ).length

  const attendanceRate = totalStudents > 0 ? (presentToday / totalStudents) * 100 : 0

  // Recent activity with student details
  const recentActivity = attendanceRecords
    .slice(-4)
    .map((record) => {
      const studentClass = studentClasses.find((sc) => sc.id === record.studentClassId)
      return {
        id: record.studentClassId + record.date,
        student: studentClass?.student.name || "Unknown",
        action: record.present ? "Marked Present" : record.justified ? "Absence Justified" : "Marked Absent",
        time: new Date(record.registrationDate).toLocaleTimeString(),
        status: record.present ? "present" : record.justified ? "justified" : "absent",
      }
    })
    .reverse()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Gestión de Asistencia</h1>
          <p className="text-gray-600 mt-2">Realizar un seguimiento de la asistencia diaria y gestionar las justificaciones de ausencia</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 justify-between">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="marking">Marcar Asistencia</TabsTrigger>
            <TabsTrigger value="justification">Justificar Ausencias</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
            <TabsTrigger value="students">Estudiantes</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de alumnos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalStudents}</div>
                  <p className="text-xs text-muted-foreground">Estudiantes matriculados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Presente hoy</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{presentToday}</div>
                  <p className="text-xs text-muted-foreground">Alumnos presentes</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ausente hoy</CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{absentToday}</div>
                  <p className="text-xs text-muted-foreground">Alumnos ausentes</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tasa de asistencia</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{attendanceRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Hoy</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Actividad reciente</CardTitle>
                <CardDescription>Últimas actualizaciones y acciones de asistencia</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            activity.status === "present"
                              ? "bg-green-500"
                              : activity.status === "justified"
                                ? "bg-blue-500"
                                : "bg-red-500"
                          }`}
                        />
                        <div>
                          <p className="font-medium">{activity.student}</p>
                          <p className="text-sm text-gray-600">{activity.action}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">{activity.time}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pending Justifications Alert */}
            {pendingJustifications > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-orange-800">
                    <AlertCircle className="h-5 w-5" />
                    <span>Justificaciones pendientes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-orange-700 mb-4">
                    Hay {pendingJustifications} justificación de ausencia pendiente de revisión.
                  </p>
                  <Button
                    variant="outline"
                    className="border-orange-300 text-orange-800 hover:bg-orange-100 bg-transparent"
                    onClick={() => setActiveTab("justification")}
                  >
                    Revisión de justificaciones 
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="marking">
            <AttendanceMarking
              studentClasses={studentClasses}
              attendanceRecords={attendanceRecords}
              setAttendanceRecords={setAttendanceRecords}
            />
          </TabsContent>

          <TabsContent value="justification">
            <AbsenceJustification
              studentClasses={studentClasses}
              attendanceRecords={attendanceRecords}
              setAttendanceRecords={setAttendanceRecords}
            />
          </TabsContent>

          <TabsContent value="history">
            <AttendanceHistory studentClasses={studentClasses} attendanceRecords={attendanceRecords} />
          </TabsContent>

          <TabsContent value="students">
            <StudentManagement studentClasses={studentClasses}/>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}