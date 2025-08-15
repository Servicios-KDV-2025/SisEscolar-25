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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/shadcn/tabs";
import {
  ArrowLeft,
  Plus,
  FileText,
  Calendar,
  Clock,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
} from "@repo/ui/icons";
import Link from "next/link";

// Mock data
const classInfo = {
  name: "Matemáticas Avanzadas",
  group: "10-A",
  term: "Unidad 2",
};

const tasks = [
  {
    id: 1,
    title: "Ensayo sobre la Revolución Mexicana",
    subject: "Historia",
    dueDate: "2024-01-15",
    assignedDate: "2024-01-08",
    submitted: 22,
    total: 28,
    status: "active",
    description:
      "Ensayo de 2 páginas sobre las causas de la Revolución Mexicana",
    submittedStudents: [
      "María González",
      "Carlos Pérez",
      "Ana Martínez",
      "Luis Rodríguez",
      "Sofia López",
      "Diego Hernández",
      "Valentina Castro",
      "Mateo Silva",
      "Isabella Torres",
      "Santiago Morales",
      "Camila Vargas",
      "Nicolás Ruiz",
      "Gabriela Mendoza",
      "Alejandro Jiménez",
      "Daniela Ortiz",
      "Fernando Ramos",
      "Lucía Guerrero",
      "Andrés Delgado",
      "Paola Aguilar",
      "Sebastián Vega",
      "Natalia Flores",
      "Emilio Cortés",
    ],
    pendingStudents: [
      "Roberto Sánchez",
      "Carmen Medina",
      "Javier Romero",
      "Adriana Navarro",
      "Rodrigo Herrera",
      "Valeria Cruz",
    ],
  },
  {
    id: 2,
    title: "Examen de Matemáticas - Fracciones",
    subject: "Matemáticas",
    dueDate: "2024-01-18",
    assignedDate: "2024-01-10",
    submitted: 28,
    total: 28,
    status: "completed",
    description: "Examen sobre operaciones básicas con fracciones",
    submittedStudents: [
      "María González",
      "Carlos Pérez",
      "Ana Martínez",
      "Luis Rodríguez",
      "Sofia López",
      "Diego Hernández",
      "Valentina Castro",
      "Mateo Silva",
      "Isabella Torres",
      "Santiago Morales",
      "Camila Vargas",
      "Nicolás Ruiz",
      "Gabriela Mendoza",
      "Alejandro Jiménez",
      "Daniela Ortiz",
      "Fernando Ramos",
      "Lucía Guerrero",
      "Andrés Delgado",
      "Paola Aguilar",
      "Sebastián Vega",
      "Natalia Flores",
      "Emilio Cortés",
      "Roberto Sánchez",
      "Carmen Medina",
      "Javier Romero",
      "Adriana Navarro",
      "Rodrigo Herrera",
      "Valeria Cruz",
    ],
    pendingStudents: [],
  },
  {
    id: 3,
    title: "Proyecto de Ciencias Naturales",
    subject: "Ciencias",
    dueDate: "2024-01-20",
    assignedDate: "2024-01-05",
    submitted: 15,
    total: 28,
    status: "active",
    description: "Investigación sobre el ciclo del agua con maqueta",
    submittedStudents: [
      "María González",
      "Carlos Pérez",
      "Ana Martínez",
      "Luis Rodríguez",
      "Sofia López",
      "Diego Hernández",
      "Valentina Castro",
      "Mateo Silva",
      "Isabella Torres",
      "Santiago Morales",
      "Camila Vargas",
      "Nicolás Ruiz",
      "Gabriela Mendoza",
      "Alejandro Jiménez",
      "Daniela Ortiz",
    ],
    pendingStudents: [
      "Fernando Ramos",
      "Lucía Guerrero",
      "Andrés Delgado",
      "Paola Aguilar",
      "Sebastián Vega",
      "Natalia Flores",
      "Emilio Cortés",
      "Roberto Sánchez",
      "Carmen Medina",
      "Javier Romero",
      "Adriana Navarro",
      "Rodrigo Herrera",
      "Valeria Cruz",
    ],
  },
  {
    id: 4,
    title: "Lectura: El Principito",
    subject: "Español",
    dueDate: "2024-01-25",
    assignedDate: "2024-01-12",
    submitted: 8,
    total: 28,
    status: "active",
    description: "Lectura completa del libro con reporte de comprensión",
    submittedStudents: [
      "María González",
      "Carlos Pérez",
      "Ana Martínez",
      "Luis Rodríguez",
      "Sofia López",
      "Diego Hernández",
      "Valentina Castro",
      "Mateo Silva",
    ],
    pendingStudents: [
      "Isabella Torres",
      "Santiago Morales",
      "Camila Vargas",
      "Nicolás Ruiz",
      "Gabriela Mendoza",
      "Alejandro Jiménez",
      "Daniela Ortiz",
      "Fernando Ramos",
      "Lucía Guerrero",
      "Andrés Delgado",
      "Paola Aguilar",
      "Sebastián Vega",
      "Natalia Flores",
      "Emilio Cortés",
      "Roberto Sánchez",
      "Carmen Medina",
      "Javier Romero",
      "Adriana Navarro",
      "Rodrigo Herrera",
      "Valeria Cruz",
    ],
  },
];

const taskSubmissions = [
  {
    id: 1,
    studentName: "Ana García",
    studentId: "2024001",
    submittedDate: "2024-03-14",
    status: "submitted",
    score: 100,
  },
  {
    id: 2,
    studentName: "Carlos López",
    studentId: "2024002",
    submittedDate: "2024-03-13",
    status: "graded",
    score: 95,
  },
  {
    id: 3,
    studentName: "María Rodríguez",
    studentId: "2024003",
    submittedDate: null,
    status: "pending",
    score: null,
  },
  {
    id: 4,
    studentName: "Juan Pérez",
    studentId: "2024004",
    submittedDate: "2024-03-15",
    status: "submitted",
    score: null,
  },
  {
    id: 5,
    studentName: "Laura Martínez",
    studentId: "2024005",
    submittedDate: "2024-03-12",
    status: "graded",
    score: 88,
  },
];

export default function TaskManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getSubmissionStatusColor = (status) => {
    switch (status) {
      case "submitted":
        return "bg-yellow-100 text-yellow-800";
      case "graded":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const handleViewDetails = (task) => {
    setSelectedTask(task);
    setDetailsDialogOpen(true);
  };

  const handleGradeSubmission = (submission) => {
    setSelectedSubmission(submission);
    setIsGradeDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  Gestión de Tareas
                </h1>
                <p className="text-gray-600">
                  {classInfo.name} - {classInfo.group}
                </p>
              </div>
            </div>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Asignación
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Asignación</DialogTitle>
                  <DialogDescription>
                    Define una nueva Asignación para tus estudiantes
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="taskTitle">Título de la Tarea</Label>
                    <Input
                      id="taskTitle"
                      placeholder="Ej: Ejercicios de Álgebra"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="taskDescription">Descripción</Label>
                    <Textarea
                      id="taskDescription"
                      placeholder="Describe las instrucciones de la tarea..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="dueDate">Fecha de Entrega</Label>
                      <Input id="dueDate" type="date" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="maxScore">Puntuación Máxima</Label>
                      <Input id="maxScore" type="number" placeholder="100" />
                    </div>
                  </div>
                  <div className="grid gap-2 grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="taskType">Tipo de Tarea</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="homework">Tarea</SelectItem>
                          <SelectItem value="project">Proyecto</SelectItem>
                          <SelectItem value="practice">Práctica</SelectItem>
                          <SelectItem value="exam">Examen</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="taskType">Periodo</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="temrU1">Unidad 1</SelectItem>
                          <SelectItem value="temrU2">Unidad 2</SelectItem>
                          <SelectItem value="temrU3">Unidad 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={() => setIsCreateDialogOpen(false)}>
                    Crear Tarea
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tasks">Mis Tareas</TabsTrigger>
            <TabsTrigger value="submissions">Entregas</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Tareas</CardTitle>
                <CardDescription>
                  Administra las tareas asignadas a tu clase
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <Link href="/teacher/classid/tasks/taskid">
                              <h3 className="text-lg font-semibold">
                                {task.title}
                              </h3>
                            </Link>
                            <Badge className={getStatusColor(task.status)}>
                              {task.status === "active" ? "Activa" : "Cerrada"}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-2">
                            {task.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Vence: {task.dueDate}
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              Creada: {task.assignedDate}
                            </span>
                            <span>Puntuación máxima: {100}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t">
                        <div className="flex items-center gap-4">
                          <span className="text-sm">
                            <span className="font-medium">
                              {task.submitted}
                            </span>{" "}
                            de <span className="font-medium">{task.total}</span>{" "}
                            entregas
                          </span>
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{
                                width: `${(task.submitted / task.total) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(task)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Entregas
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submissions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-4xl">Asignación</CardTitle>
                {/* <CardDescription>
                  Revisa y califica las entregas de tus estudiantes
                </CardDescription> */}
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Select>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Filtrar por tarea" />
                    </SelectTrigger>
                    <SelectContent>
                      {tasks.map((task) => (
                        <SelectItem key={task.id} value={task.id.toString()}>
                          {task.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  {/* <TableHeader>
                    <TableRow>
                      <TableHead>Estudiante</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Fecha de Entrega</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Calificación</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader> */}
                  <TableBody>
                    {taskSubmissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell className="font-medium">
                          {submission.studentName}
                        </TableCell>
                        <TableCell>{submission.studentId}</TableCell>
                        <TableCell>
                          {submission.submittedDate || "No entregada"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getSubmissionStatusColor(
                              submission.status
                            )}
                          >
                            {submission.status === "submitted" && "Entregada"}
                            {submission.status === "graded" && "Calificada"}
                            {submission.status === "pending" && "Pendiente"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {submission.score ? (
                            <Badge variant="secondary">
                              {submission.score}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {submission.status === "submitted" && (
                            <Button
                              size="sm"
                              onClick={() => handleGradeSubmission(submission)}
                            >
                              Calificar
                            </Button>
                          )}
                          {submission.status === "graded" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGradeSubmission(submission)}
                            >
                              Revisar
                            </Button>
                          )}
                          {submission.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGradeSubmission(submission)}
                            >
                              Revisar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Grade Submission Dialog */}
        <Dialog open={isGradeDialogOpen} onOpenChange={setIsGradeDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Calificar Entrega</DialogTitle>
              <DialogDescription>
                {selectedSubmission &&
                  `Estudiante: ${selectedSubmission.studentName}`}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="submissionScore">Puntuación</Label>
                <Input
                  id="submissionScore"
                  type="number"
                  placeholder="Ingresa la puntuación"
                  min="0"
                  max="100"
                  defaultValue={selectedSubmission?.score || ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="feedback">Retroalimentación</Label>
                <Textarea
                  id="feedback"
                  placeholder="Proporciona comentarios sobre la entrega..."
                  rows={4}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gradeStatus">Estado</Label>
                <Select defaultValue="graded">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="graded">Calificada</SelectItem>
                    <SelectItem value="needs_revision">
                      Necesita Revisión
                    </SelectItem>
                    <SelectItem value="incomplete">Incompleta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsGradeDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={() => setIsGradeDialogOpen(false)}>
                Guardar Calificación
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de: {selectedTask?.name}</DialogTitle>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-6">
              {/* Información General */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Materia:
                  </span>
                  <p className="text-gray-900">{selectedTask.subject}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Fecha de Entrega:
                  </span>
                  <p className="text-gray-900">
                    {new Date(selectedTask.dueDate).toLocaleDateString("es-ES")}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Progreso:
                  </span>
                  <p className="text-gray-900">
                    {selectedTask.submitted}/{selectedTask.total}
                  </p>
                  <p className="text-gray-900">
                    {(selectedTask.submitted / selectedTask.total) * 100}%
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Estado:
                  </span>
                  <Badge className={getStatusColor(selectedTask.status)}>
                    {selectedTask.status === "completed"
                      ? "Completada"
                      : selectedTask.status === "active"
                        ? "Activa"
                        : "Vencida"}
                  </Badge>
                </div>
              </div>

              {/* Estudiantes que Entregaron */}
              <div>
                <h4 className="text-lg font-semibold text-green-700 mb-3 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Estudiantes que Entregaron ({selectedTask.submitted})
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {selectedTask.submittedStudents.map((student, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-green-50 rounded"
                    >
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-800">{student}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Estudiantes Pendientes */}
              {selectedTask.pendingStudents.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-red-700 mb-3 flex items-center">
                    <XCircle className="w-5 h-5 mr-2" />
                    Estudiantes Pendientes (
                    {selectedTask.pendingStudents.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedTask.pendingStudents.map((student, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-red-50 rounded"
                      >
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-800">{student}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
