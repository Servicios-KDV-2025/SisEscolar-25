"use client"

import { useState } from "react"
import { Search, Mail, Phone } from "@repo/ui/icons"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card"
import { Input } from "@repo/ui/components/shadcn/input"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/shadcn/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select"
// import { Badge } from "@repo/ui/components/shadcn/badge"

// interface StudentManagementProps {
//   studentClasses: StudentClass[]
// }

export default function StudentManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState("all")

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de estudiantes</CardTitle>
          <CardDescription>Visualización de la información y los perfiles de los estudiantes</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Busqueda y filtro */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400"/>
              <Input
                placeholder="Buscar estudiantes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Seleccionar clase"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las clases</SelectItem>
                <SelectItem value="1A">Clase 1A</SelectItem>
                <SelectItem value="2A">Clase 2A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de estudiantes */}
          <div className="space-y-4">
            {/* {filteredStudents.map((studentClass) => { */}
              {/* const attendanceRate = calculateAttendanceRate(studentClass.student.id) */}
                {/* return () */}
                <div 
                  // key={studentClass.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage alt="Fulanito Fulano"
                          // src={studentClass.student.avatar || "/placeholder.svg"}
                        />
                        <AvatarFallback>
                          Ff
                          {/* {studentClass.student.name.split(' ').map((n) => n[0])} */}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium text-lg">Fulano Fulanito</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <samp>N°: 1Q2S3E4F</samp>
                          <samp>Clase: 1A</samp>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3"/>
                            <samp>Fulanito@escuela.edu.mx</samp>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3"/>
                            <span>677 107 1156</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="felx items-center space-x-3">Bueno
                      {/* {getAttendanceRateBadge(attendanceRate)} // Como se considera el estado de la asistencia del alumno (exelente, bueno, promedio, malo)*/}
                    </div>
                  </div>
                </div>
          </div>

          {/* {filteredStudents.length === 0 && ( */}
            <div className="text-center py-8 text-gray-500">
              No se encontraron estudiantes que coincidan con el criterio de busqueda.
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
// export default function StudentManagement({ studentClasses }: StudentManagementProps) {
//   const [searchTerm, setSearchTerm] = useState("")
//   const [selectedClass, setSelectedClass] = useState("all")

//   const filteredStudents = studentClasses.filter((studentClass) => {
//     const matchesSearch =
//       studentClass.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       studentClass.student.rollNumber.includes(searchTerm) ||
//       studentClass.student.email.toLowerCase().includes(searchTerm.toLowerCase())
//     const matchesClass = selectedClass === "all" || studentClass.className === selectedClass
//     return matchesSearch && matchesClass
//   })

//   // Calcular attendanceRate basado en registros reales si es necesario
//   const calculateAttendanceRate = (studentId: string) => {
//     // Aquí podrías implementar lógica real para calcular la tasa de asistencia
//     // Por ahora devolvemos un valor mock
//     return Math.floor(Math.random() * 100); // Valor temporal
//   }

//   const getAttendanceRateBadge = (rate: number) => {
//     if (rate >= 95) return <Badge className="bg-green-500">Excellent</Badge>
//     if (rate >= 85) return <Badge className="bg-blue-500">Good</Badge>
//     if (rate >= 75) return <Badge className="bg-yellow-500">Average</Badge>
//     return <Badge variant="destructive">Poor</Badge>
//   }

//   return (
//     <div className="space-y-6">
//       <Card>
//         <CardHeader>
//           <CardTitle>Gestión de estudiantes</CardTitle>
//           <CardDescription>Visualización de la información y los perfiles de los estudiantes</CardDescription>
//         </CardHeader>
//         <CardContent>
//           {/* Busqueda y filtro */}
//           <div className="flex flex-col sm:flex-row gap-4 mb-6">
//             <div className="relative flex-1">
//               <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400"/>
//               <Input
//                 placeholder="Buscar estudiantes..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="pl-10"
//               />
//             </div>
//             <Select value={selectedClass} onValueChange={setSelectedClass}>
//               <SelectTrigger className="w-full sm:w-[180px]">
//                 <SelectValue placeholder="Seleccionar clase"/>
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">Todas las clases</SelectItem>
//                 <SelectItem value="10A">Clase 10A</SelectItem>
//                 <SelectItem value="20A">Clase 20A</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//           {/* Lista de estudiantes */}
//           <div className="space-y-4">
//             {filteredStudents.map((studentClass) => {
//               const attendanceRate = calculateAttendanceRate(studentClass.student.id)

//               return(
//                 <div key={studentClass.id} className="border rounded-lg p-4 hover:bg-gray-50">
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center space-x-4">
//                       <Avatar className="h-12 w-12" >
//                         <AvatarImage
//                           src={studentClass.student.avatar || "/placeholder.svg"}
//                           alt={studentClass.student.name}
//                         />
//                         <AvatarFallback>
//                           {studentClass.student.name.split(' ').map((n) => n[0])}
//                         </AvatarFallback>
//                       </Avatar>
//                       <div>
//                         <h3 className="font-medium text-lg">{studentClass.student.name}</h3>
//                         <div className="flex items-center space-x-4 text-sm text-gray-600">
//                           <span>N°: {studentClass.student.rollNumber}</span>
//                           <span>Clase: {studentClass.className}</span>
//                         </div>
//                         <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
//                           <div className="flex items-center space-x-1">
//                             <Mail className="h-3 w-3"/>
//                             <span>{studentClass.student.email}</span>
//                           </div>
//                           <div className="flex items-center space-x-1">
//                             <Phone className="h-3 w-3"/>
//                             <span>{studentClass.student.phone}</span>
//                           </div>
//                         </div>
//                       </div>
//                     </div>

//                     <div className="felx items-center space-x-3">
//                       {getAttendanceRateBadge(attendanceRate)}
//                     </div>
//                   </div>
//                 </div>
//               )
//             })}
//           </div>

//           {filteredStudents.length === 0 && (
//             <div className="text-center py-8 text-gray-500">
//               No se encontraron estudiantes que coincidan con el criterio de busqueda.
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   )
// }
