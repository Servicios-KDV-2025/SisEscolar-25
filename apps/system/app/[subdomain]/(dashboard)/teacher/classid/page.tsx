"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
import { Button } from "@repo/ui/components/shadcn/button";
import { Badge } from "@repo/ui/components/shadcn/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/shadcn/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/shadcn/dialog";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import { ArrowLeft, Plus, User } from "@repo/ui/icons";
import Link from "next/link";

// Mock data
const classInfo = {
  name: "Matemáticas Avanzadas",
  group: "10-A",
  term: "Unidad 2",
};

const gradeRubric = [
  { id: 1, name: "Examen Parcial", weight: 40, maxScore: 100 },
  { id: 2, name: "Tareas", weight: 30, maxScore: 100 },
  { id: 3, name: "Participación", weight: 20, maxScore: 100 },
  { id: 4, name: "Proyecto Final", weight: 10, maxScore: 100 },
];

const students = [
  { id: 1, name: "Ana García", studentId: "2024001", average: 85 },
  { id: 2, name: "Carlos López", studentId: "2024002", average: 92 },
  { id: 3, name: "María Rodríguez", studentId: "2024003", average: 78 },
  { id: 4, name: "Juan Pérez", studentId: "2024004", average: 88 },
  { id: 5, name: "Laura Martínez", studentId: "2024005", average: 95 },
];

export default function ClassGrades() {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  {classInfo.name}
                </h1>
                <p className="text-gray-600">
                  {classInfo.group} - {classInfo.term}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mx-auto grid-cols-2 items-center grid gap-8">
          <div className="">
            {/* Rubric Table */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-2xl">Criterios de Evaluación</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    {/* <TableRow>
                      <TableHead>Criterio</TableHead>
                      <TableHead>Peso (%)</TableHead>
                      <TableHead>Puntuación Máxima</TableHead>
                    </TableRow> */}
                  </TableHeader>
                  <TableBody>
                    {gradeRubric.map((criterion) => (
                      <TableRow key={criterion.id}>
                        <TableCell className="font-medium">
                          {criterion.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{criterion.weight}%</Badge>
                        </TableCell>
                        <TableCell>{criterion.maxScore}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="">
            <Card className="mb-8">
              <CardHeader>
                <Link href={`/teacher/classid/tasks/`}>
                  <CardTitle className="text-2xl">Asignaciones</CardTitle>
                </Link>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    {gradeRubric.map((criterion) => (
                      <TableRow key={criterion.id}>
                        <Link href={`/teacher/classid/tasks/taskid`}>
                          <TableCell className="font-medium">
                            {criterion.name}
                          </TableCell>
                        </Link>
                        <TableCell>
                          <Badge variant="secondary">{criterion.weight}%</Badge>
                        </TableCell>
                        <TableCell>{criterion.maxScore}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Estudiantes</CardTitle>
            <CardDescription>
              Haz clic en un estudiante para registrar una calificación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Promedio Actual</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow
                    key={student.id}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        {student.name}
                      </div>
                    </TableCell>
                    <TableCell>{student.studentId}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          student.average >= 90
                            ? "default"
                            : student.average >= 80
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {student.average}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/teacher/classid/tasks/alumno`}>
                        <Button size="sm">Ver Detalles</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Grade Registration Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Registrar Calificación</DialogTitle>
              <DialogDescription>
                {selectedStudent && `Estudiante: ${selectedStudent.name}`}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="criterion">Criterio de Evaluación</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un criterio" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeRubric.map((criterion) => (
                      <SelectItem
                        key={criterion.id}
                        value={criterion.id.toString()}
                      >
                        {criterion.name} (Max: {criterion.maxScore})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="score">Puntuación</Label>
                <Input
                  id="score"
                  type="number"
                  placeholder="Ingresa la puntuación"
                  min="0"
                  max="100"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="comments">Comentarios (Opcional)</Label>
                <Textarea
                  id="comments"
                  placeholder="Añade comentarios sobre la evaluación..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setIsDialogOpen(false)}>
                Guardar Calificación
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
