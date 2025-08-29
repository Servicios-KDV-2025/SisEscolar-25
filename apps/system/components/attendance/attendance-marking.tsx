"use client"

import { useState } from "react"
import { Search, Check, X } from "@repo/ui/icons"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card"
import { Input } from "@repo/ui/components/shadcn/input"
import { Button } from "@repo/ui/components/shadcn/button"
// import { Badge } from "@repo/ui/components/shadcn/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/shadcn/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select"
import { Textarea } from "@repo/ui/components/shadcn/textarea"
import { Label } from "@repo/ui/components/shadcn/label"

// interface AttendanceMarkingProps {
//   studentClasses: StudentWithClass[]
//   attendanceRecords: AttendanceWithStudent[]
// }

export default function AttendanceMarking() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState("")

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Marcar la asistencia diaria</CardTitle>
          <CardDescription>
            Marcar la asistencia para{' '}
            {new Date().toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o matricula..."
                className="pl-10"
              />
            </div>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Seleccionar clase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10A">Clase 10A</SelectItem>
                <SelectItem value="10B">Clase 10B</SelectItem>
                <SelectItem value="10C">Clase 10C</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {/* {filteredStudents.map((studentClass) => { */}
              {/* const record = getTodayAttendance(studentClass.id) */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage
                        alt={'Fulanito Fulano'}
                      />
                      <AvatarFallback>
                        {'Ff'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{'Fulanito Fulano'}</p>
                      <p className="text-sm text-gray-600">
                        Matricula: {'1A2W3D4R'} | Clase: {'10A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-2">
                      <Button
                        size={'sm'}
                        // variant={record?.present ? "default" : "outline"}
                        // onClick={() => handleMarkAttendance(studentClass.id, true)}
                        className="flex items-center space-x-1"
                      >
                        <Check className="h-4 w-4" />
                        <span>Presente</span>
                      </Button>
                      <Button
                        size={'sm'}
                        // variant={record?.present ? "default" : "outline"}
                        // onClick={() => handleMarkAttendance(studentClass.id, true)}
                        className="flex items-center space-x-1"
                      >
                        <X className="h-4 w-4" />
                        <span>Ausente</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* seccion de comentarios */}
                <div className="space-y-2">
                  <Label 
                    // htmlFor={`comments-${studentClass.id}`} 
                  >Comentarios</Label>
                  <Textarea
                    // id={`comments-${studentClass.id}`}
                    placeholder="Añade cualquier comentario sobre la asistencia...."
                    // value={comments[studentClass.id] || record?.comments || ""}
                    // onChange={(e) => handleCommentChange(studentClass.id, e.target.value)}
                    className="min-h-[60px]"
                  />
                </div>

                {/* Show existing record info */}
                {/* {record && ( */}
                  <div className="text-xs text-gray-500 border-t pt-2">
                    <p>Creada: {new Date().getTime()} 
                      {/* {new Date(record.registrationDate).toLocaleString()} */}
                      {/* {record.updatedAt && <p>Última actualización: {new Date(record.updatedAt).toLocaleString()}</p>} */}
                    </p>
                  </div>
                
              </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button className="px-8">
              Guardar asistencia
            </Button>
          </div>
        </CardContent>
      </Card>
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
