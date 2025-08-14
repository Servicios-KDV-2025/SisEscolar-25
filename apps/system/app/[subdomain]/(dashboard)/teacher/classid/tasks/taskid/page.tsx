
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/shadcn/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/shadcn/table"
import { Input } from "@repo/ui/components/shadcn/input"
import { Button } from "@repo/ui/components/shadcn/button"
import { Textarea } from "@repo/ui/components/shadcn/textarea"

// Sample student data
const students = [
  { id: 1, name: "Ana García" },
  { id: 2, name: "Carlos Rodríguez" },
  { id: 3, name: "María López" },
  { id: 4, name: "Juan Martínez" },
  { id: 5, name: "Laura Sánchez" },
  { id: 6, name: "Pedro Fernández" },
  { id: 7, name: "Carmen Ruiz" },
  { id: 8, name: "Miguel Torres" },
]

interface Grade {
  studentId: number
  grade: string
  comments: string
}

export default function GradingPage() {
  const [grades, setGrades] = useState<Grade[]>(
    students.map((student) => ({
      studentId: student.id,
      grade: "",
      comments: "",
    })),
  )

  const updateGrade = (studentId: number, field: "grade" | "comments", value: string) => {
    setGrades((prev) => prev.map((grade) => (grade.studentId === studentId ? { ...grade, [field]: value } : grade)))
  }

  const handleSaveGrades = () => {
    console.log("Calificaciones guardadas:", grades)
    // Here you would typically send the data to your backend
    alert("Calificaciones guardadas exitosamente")
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Calificar Actividad: Examen de Matemáticas - Unidad 3
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">Alumno</TableHead>
                <TableHead className="w-1/4">Calificación</TableHead>
                <TableHead className="w-2/5">Comentarios</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => {
                const studentGrade = grades.find((g) => g.studentId === student.id)
                return (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0-100"
                        value={studentGrade?.grade || ""}
                        onChange={(e) => updateGrade(student.id, "grade", e.target.value)}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        placeholder="Comentarios opcionales..."
                        value={studentGrade?.comments || ""}
                        onChange={(e) => updateGrade(student.id, "comments", e.target.value)}
                        className="min-h-[60px] resize-none"
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          <div className="mt-6 flex justify-center">
            <Button onClick={handleSaveGrades} className="px-8 py-2 text-lg">
              Guardar Calificaciones
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
