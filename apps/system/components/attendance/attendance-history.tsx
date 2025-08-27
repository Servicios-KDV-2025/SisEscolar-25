"use client"

import { useState } from "react"
import { Download } from "@repo/ui/icons"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card"
import { Button } from "@repo/ui/components/shadcn/button"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { Input } from "@repo/ui/components/shadcn/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/shadcn/table"
import { AttendanceWithStudent, StudentWithClass } from "stores/attendanceStore"

interface AttendanceHistoryProps {
  studentClasses: StudentWithClass[]
  attendanceRecords: AttendanceWithStudent[]
}
export default function AttendanceHistory({}) {
  return (
    <div>
      Historial se asistencia
    </div>
  )
}
// export default function AttendanceHistory({ studentClasses, attendanceRecords }: AttendanceHistoryProps) {
//   const [searchTerm, setSearchTerm] = useState("")
//   const [selectedClass, setSelectedClass] = useState("all")
//   const [selectedStatus, setSelectedStatus] = useState("all")
//   const [dateFilter, setDateFilter] = useState("")

//   // Combine attendance records with student information
//   const attendanceWithStudents = attendanceRecords
//     .map((record) => {
//       const studentClass = studentClasses.find((sc) => sc.id === record.studentClassId)
//       return {
//         ...record,
//         student: studentClass?.student,
//         className: studentClass?.className,
//       }
//     })
//     .filter((record) => record.student) // Only include records with valid student data

//   const filteredHistory = attendanceWithStudents.filter((record) => {
//     const matchesSearch =
//       record.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       record.student?.enrollment.includes(searchTerm)
//     const matchesClass = selectedClass === "all" || record.className === selectedClass

//     let matchesStatus = true
//     if (selectedStatus === "present") matchesStatus = record.present
//     else if (selectedStatus === "absent") matchesStatus = !record.present
//     else if (selectedStatus === "justified") matchesStatus = !record.present && record.justified === true
//     else if (selectedStatus === "unjustified") matchesStatus = !record.present && record.justified === false

//     const recordDate = new Date(record.date).toISOString().split("T")[0]
//     const matchesDate = !dateFilter || recordDate === dateFilter

//     return matchesSearch && matchesClass && matchesStatus && matchesDate
//   })

//   const getStatusBadge = (record: AttendanceRecord) => {
//     if (record.present) {
//       return <Badge className="bg-green-500">Presente</Badge>
//     } else if (record.justified === true) {
//       return <Badge className="bg-blue-500">Ausencia Justificada</Badge>
//     } else if (record.justified === false) {
//       return <Badge variant="destructive">Ausencia injustificada</Badge>
//     } else {
//       return <Badge variant="outline">Ausencia (Pendiente)</Badge>
//     }
//   }

//   const exportData = () => {
//     // Create CSV content
//     const headers = ["Date", "Student Name", "Roll Number", "Class", "Status", "Justified", "Comments", "Created By"]
//     const csvContent = [
//       headers.join(","),
//       ...filteredHistory.map((record) =>
//         [
//           new Date(record.date).toLocaleDateString(),
//           record.student?.name || "",
//           record.student?.enrollment || "",
//           record.className || "",
//           record.present ? "Present" : "Absent",
//           record.justified === true ? "Yes" : record.justified === false ? "No" : "Pending",
//           `"${record.comments || ""}"`,
//           record.createdBy,
//         ].join(","),
//       ),
//     ].join("\n")

//     // Download CSV
//     const blob = new Blob([csvContent], { type: "text/csv" })
//     const url = window.URL.createObjectURL(blob)
//     const a = document.createElement("a")
//     a.href = url
//     a.download = `attendance-history-${new Date().toISOString().split("T")[0]}.csv`
//     a.click()
//     window.URL.revokeObjectURL(url)
//   }

//   return (
//     <div className="space-y-6">
//       <Card>
//         <CardHeader>
//           <div className="flex items-center justify-between">
//             <div>
//               <CardTitle>Historial de asistencia</CardTitle>
//               <CardDescription>Ver y exportar registros históricos de asistencia</CardDescription>
//             </div>
//             <Button onClick={exportData} className="flex items-center space-x-2">
//               <Download className="h-4 w-4" />
//               <span>Exportar CSV</span>
//             </Button>
//           </div>
//         </CardHeader>
//         <CardContent>
//           {/* Filters */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//             <Input placeholder="Search student..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
//             <Select value={selectedClass} onValueChange={setSelectedClass}>
//               <SelectTrigger>
//                 <SelectValue placeholder="Select class" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">Todas las clases</SelectItem>
//                 <SelectItem value="10A">Clase 10A</SelectItem>
//                 <SelectItem value="10B">Clase 10B</SelectItem>
//                 <SelectItem value="11A">Clase 11A</SelectItem>
//                 <SelectItem value="11B">Clase 11B</SelectItem>
//               </SelectContent>
//             </Select>
//             <Select value={selectedStatus} onValueChange={setSelectedStatus}>
//               <SelectTrigger>
//                 <SelectValue placeholder="Select status" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">Todos los estados</SelectItem>
//                 <SelectItem value="present">Presente</SelectItem>
//                 <SelectItem value="absent">Ausente</SelectItem>
//                 <SelectItem value="justified">Justificado</SelectItem>
//                 <SelectItem value="unjustified">Injustificado</SelectItem>
//               </SelectContent>
//             </Select>
//             <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
//           </div>

//           {/* Attendance Table */}
//           <div className="border rounded-lg">
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Fecha</TableHead>
//                   <TableHead>Nombre</TableHead>{/**Alumno */}
//                   <TableHead>Matricula</TableHead>
//                   <TableHead>Clase</TableHead>
//                   <TableHead>Estado</TableHead>
//                   <TableHead>Comentario</TableHead>
//                   <TableHead>Creado</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {filteredHistory.map((record) => (
//                   <TableRow key={`${record.studentClassId}-${record.date}`}>
//                     <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
//                     <TableCell className="font-medium">{record.student?.name}</TableCell>
//                     <TableCell>{record.student?.enrollment}</TableCell>
//                     <TableCell>{record.className}</TableCell>
//                     <TableCell>{getStatusBadge(record)}</TableCell>
//                     <TableCell className="max-w-xs truncate" title={record.comments}>
//                       {record.comments || "-"}
//                     </TableCell>
//                     <TableCell className="text-sm text-gray-500">
//                       {new Date(record.registrationDate).toLocaleDateString()}
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </div>

//           {filteredHistory.length === 0 && (
//             <div className="text-center py-8 text-gray-500">No attendance records found matching your filters.</div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   )
// }
