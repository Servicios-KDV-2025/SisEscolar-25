"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card"
import { Button } from "@repo/ui/components/shadcn/button"
import { Input } from "@repo/ui/components/shadcn/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/shadcn/table"
import { Save, GraduationCap }  from "@repo/ui/icons"
// import { toast } from "@repo/ui/components/shadcn/sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/components/shadcn/alert-dialog"


// Datos de ejemplo
const classes = [
  { id: "1", name: "Matemáticas 10A" },
  { id: "2", name: "Matemáticas 10B" },
  { id: "3", name: "Física 11A" },
]

const periods = [
  { id: "1", name: "Primer Período" },
  { id: "2", name: "Segundo Período" },
  { id: "3", name: "Tercer Período" },
]

const gradeRubric = [
  { id: "participation", name: "Participación", maxPoints: 20 },
  { id: "homework", name: "Tareas", maxPoints: 25 },
  { id: "quizzes", name: "Quices", maxPoints: 25 },
  { id: "exam", name: "Examen", maxPoints: 30 },
]

const students = [
  { id: "1", name: "Ana García", email: "ana.garcia@email.com" },
  { id: "2", name: "Carlos López", email: "carlos.lopez@email.com" },
  { id: "3", name: "María Rodríguez", email: "maria.rodriguez@email.com" },
  { id: "4", name: "Juan Martínez", email: "juan.martinez@email.com" },
  { id: "5", name: "Laura Sánchez", email: "laura.sanchez@email.com" },
]

export function CerrarUnidadButton() {
  const [isOpen, setIsOpen] = useState(false);

  const handleCerrarUnidad = async () => {
    try {
      // Aquí iría tu lógica para cerrar la unidad y guardar calificaciones
      // ...
      
      setIsOpen(false); // Cierra el AlertDialog
      alert("Calificaciones guardadas exitosamente Unidad 1 Cerrada")
    } catch (error) {
      setIsOpen(false);
      alert("Calificaciones guardadas exitosamente Unidad 1 Cerrada")
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button>Cerrar Unidad 1</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción guardará todas las calificaciones y cerrará la Unidad 1.
            No podrás realizar más cambios en las calificaciones de este periodo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleCerrarUnidad}>Continuar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function GradesManagement() {
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedPeriod, setSelectedPeriod] = useState("")
  const [grades, setGrades] = useState<Record<string, Record<string, string>>>({})

  const handleGradeChange = (studentId: string, criteriaId: string, value: string) => {
    setGrades((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [criteriaId]: value,
      },
    }))
  }

  const handleSaveGrades = () => {
    console.log("Guardando calificaciones:", grades)
    // Aquí iría la lógica para guardar en la base de datos
    alert("Calificaciones guardadas exitosamente Unidad 1 Cerrada")
    
  }

  const getStudentGrade = (studentId: string, criteriaId: string) => {
    return grades[studentId]?.[criteriaId] || ""
  }

  const calculateTotal = (studentId: string) => {
    let total = 0
    gradeRubric.forEach((criteria) => {
      const grade = Number.parseFloat(getStudentGrade(studentId, criteria.id)) || 0
      total += grade
    })
    return total.toFixed(1)
  }

  
  return (
    
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <GraduationCap className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Calificaciones</h1>
        </div>

        {/* Selección de Clase y Período */}
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Clase y Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Clase</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una clase" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Asignación</label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un período" />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map((period) => (
                      <SelectItem key={period.id} value={period.id}>
                        {period.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Calificaciones */}
        {selectedClass && selectedPeriod && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Calificaciones de Estudiantes</CardTitle>
              
              {/* <Button onClick={handleSaveGrades} className="gap-2">
                <Save className="h-4 w-4" />
                Cerrar Unidad 
              </Button> */}
              <CerrarUnidadButton />
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-48">Estudiante</TableHead>
                      {gradeRubric.map((criteria) => (
                        <TableHead key={criteria.id} className="text-center min-w-32">
                          <div className="space-y-1">
                            <div className="font-semibold">{criteria.name}</div>
                            <div className="text-xs text-gray-500">(Max: {criteria.maxPoints} pts)</div>
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="text-center min-w-24">
                        <div className="font-semibold">Total</div>
                        <div className="text-xs text-gray-500">(100 pts)</div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.email}</div>
                          </div>
                        </TableCell>
                        {gradeRubric.map((criteria) => (
                          <TableCell key={criteria.id} className="text-center">
                            <Input
                              type="number"
                              min="0"
                              max={criteria.maxPoints}
                              step="0.1"
                              value={getStudentGrade(student.id, criteria.id)}
                              onChange={(e) => handleGradeChange(student.id, criteria.id, e.target.value)}
                              className="w-20 text-center"
                              placeholder="0"
                            />
                          </TableCell>
                        ))}
                        <TableCell className="text-center">
                          <div className="font-semibold text-lg">{calculateTotal(student.id)}</div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mensaje cuando no hay selección */}
        {(!selectedClass || !selectedPeriod) && (
          <Card>
            <CardContent className="text-center py-12">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                Selecciona una clase y un período para comenzar a gestionar las calificaciones
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
