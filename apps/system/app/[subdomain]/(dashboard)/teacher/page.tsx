"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/shadcn/card';
import { Button } from "@repo/ui/components/shadcn/button"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { BookOpen, Users, Calendar, ArrowLeft } from '@repo/ui/icons';
import Link from "next/link"

// Mock data
const teacherClasses = [
  {
    id: 1,
    name: "Matemáticas Avanzadas",
    group: "10-A",
    term: "Unidad 2",
    studentCount: 28,
    color: "bg-blue-500"
  },
  {
    id: 2,
    name: "Álgebra Lineal",
    group: "11-B",
    term: "Unidad 1",
    studentCount: 24,
    color: "bg-green-500"
  },
  {
    id: 3,
    name: "Cálculo Diferencial",
    group: "12-A",
    term: "Unidad 3",
    studentCount: 22,
    color: "bg-purple-500"
  },
  { 
    id: 4,
    name: "Geometría",
    group: "9-C",
    term: "Unidad 2",
    studentCount: 30,
    color: "bg-orange-500"
  }
]

export default function TeacherDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 sticky top-0 z-10">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Panel del Maestro</h1>
                <p className="text-gray-600">Prof. María González</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm">
              <Calendar className="w-4 h-4 mr-1" />
              Periodo 2024-1
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Mis Clases</h2>
          <p className="text-gray-600">Selecciona una clase para gestionar las calificaciones</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teacherClasses.map((classItem) => (
            <Card key={classItem.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className={`w-3 h-3 rounded-full ${classItem.color}`}></div>
                  <Badge variant="outline">{classItem.term}</Badge>
                </div>
<Link href={`/teacher/classid/`}>
                <CardTitle className="text-lg">{classItem.name}</CardTitle>
                </Link>
                <CardDescription className="flex items-center gap-4">
                  <span className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-1" />
                    {classItem.group}
                  </span>
                  <span className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {classItem.studentCount} estudiantes
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Link href={`/teacher/class/grade`}>
                    <Button className="w-full" size="sm">
                      Calificaciones
                    </Button>
                  </Link>
                  <Link href={`/teacher/classid/tasks`}>
                    <Button className="w-full" variant="outline" size="sm">
                      Tareas
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
