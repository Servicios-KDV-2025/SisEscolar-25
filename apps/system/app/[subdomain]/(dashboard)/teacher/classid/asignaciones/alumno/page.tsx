"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/shadcn/dialog";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { Label } from "@repo/ui/components/shadcn/label";
import {
  Calendar,
  MessageCircle,
  FileText,
  Clock,
  Phone,
  Mail,
  Send,
  Users,
  CheckCircle,
} from "@repo/ui/icons";
import Link from "next/link";

export default function StudentProfile() {
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [contactMethod, setContactMethod] = useState("email");

  // Datos de ejemplo del alumno
  const student = {
    name: "María González Rodríguez",
    id: "2024-001",
    grade: "5° Grado",
    section: "A",
    parentEmail: "padres.maria@email.com",
    parentPhone: "+52 55 1234-5678",
    parentNames: "Carlos González y Ana Rodríguez",
  };

  const pendingTasks = [
    {
      name: "Ensayo sobre la Revolución Mexicana",
      dueDate: "2024-01-15",
      subject: "Historia",
    },
    {
      name: "Examen de Matemáticas - Fracciones",
      dueDate: "2024-01-18",
      subject: "Matemáticas",
    },
    {
      name: "Proyecto de Ciencias Naturales",
      dueDate: "2024-01-20",
      subject: "Ciencias",
    },
  ];

  const completedTasks = [
    {
      name: "Examen de Español - Comprensión Lectora",
      subject: "Español",
      grade: "9.2",
      submittedDate: "2024-01-10",
      dueDate: "2024-01-10",
      comments:
        "Excelente comprensión del texto. Demostró habilidades analíticas muy buenas. Mejorar la ortografía en algunas palabras.",
    },
    {
      name: "Tarea de Matemáticas - Problemas de Fracciones",
      subject: "Matemáticas",
      grade: "8.5",
      submittedDate: "2024-01-08",
      dueDate: "2024-01-08",
      comments:
        "Buen manejo de las operaciones básicas. Necesita practicar más la simplificación de fracciones complejas.",
    },
    {
      name: "Proyecto de Arte - Técnicas de Pintura",
      subject: "Arte",
      grade: "9.0",
      submittedDate: "2024-01-05",
      dueDate: "2024-01-06",
      comments:
        "Creatividad excepcional y buen uso del color. Entregado un día antes, mostrando buena organización.",
    },
    {
      name: "Investigación de Ciencias - El Sistema Solar",
      subject: "Ciencias",
      grade: "9.8",
      submittedDate: "2024-01-03",
      dueDate: "2024-01-03",
      comments:
        "Investigación muy completa y bien estructurada. Excelente uso de fuentes confiables. Presentación impecable.",
    },
    {
      name: "Ensayo de Historia - La Independencia",
      subject: "Historia",
      grade: "8.7",
      submittedDate: "2024-12-20",
      dueDate: "2024-12-20",
      comments:
        "Buen análisis histórico. Argumentos sólidos pero podría profundizar más en las causas económicas.",
    },
  ];

  const generalComments =
    "María es una estudiante muy dedicada y participativa. Muestra gran interés por aprender y siempre está dispuesta a ayudar a sus compañeros. Su rendimiento académico es excelente, aunque necesita mejorar en la organización de sus tareas para evitar entregas tardías. Se recomienda continuar fomentando su curiosidad natural y brindar apoyo adicional en gestión del tiempo.";

  const handleContactParents = () => {
    if (contactMethod === "email") {
      // Simular envío de email
      const emailBody = encodeURIComponent(`
Estimados ${student.parentNames},

${message}

Saludos cordiales,
Profesor(a) [Nombre]
${student.grade} - Sección ${student.section}
      `);
      window.open(
        `mailto:${student.parentEmail}?subject=Información sobre ${student.name}&body=${emailBody}`
      );
    } else {
      // Simular llamada telefónica
      window.open(`tel:${student.parentPhone}`);
    }
    setContactDialogOpen(false);
    setMessage("");
  };

  const handleGenerateReport = () => {
    // Simular generación de reporte PDF
    const reportData = {
      student,
      pendingTasks,
      completedTasks,
      generalComments,
      average: "9.1",
      generatedDate: new Date().toLocaleDateString("es-ES"),
    };

    // En una implementación real, aquí se generaría un PDF
    console.log("Generando reporte para:", reportData);

    // Simular descarga
    const reportContent = `
REPORTE ACADÉMICO
================

Estudiante: ${student.name}
Grado: ${student.grade} - Sección ${student.section}
ID: ${student.id}
Fecha de generación: ${reportData.generatedDate}

PROMEDIO GENERAL: ${reportData.average}

TAREAS PENDIENTES:
${pendingTasks.map((task) => `- ${task.name} (${task.subject}) - Vence: ${new Date(task.dueDate).toLocaleDateString("es-ES")}`).join("\n")}

TAREAS ENTREGADAS:
${completedTasks.map((task) => `- ${task.name}: ${task.grade} (${new Date(task.submittedDate).toLocaleDateString("es-ES")})`).join("\n")}

COMENTARIOS GENERALES:
${generalComments}
    `;

    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte_${student.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="mb-4">
          <Link href="/teacher/classid/">
            <Button variant="outline" size="sm">
              <Users className="w-4 h-4 mr-2" />
              Ver Progreso de Tareas de la Clase
            </Button>
          </Link>
        </div>

        <Card className="w-full">
          <CardHeader className="bg-blue-50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-blue-900">
                  {student.name}
                </CardTitle>
                <p className="text-blue-700 mt-1">
                  {student.grade} - Sección {student.section} | ID: {student.id}
                </p>
              </div>
              <div className="flex gap-2">
                <Dialog
                  open={contactDialogOpen}
                  onOpenChange={setContactDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Contactar Padres
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        Contactar Padres de {student.name}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Información de contacto:</Label>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {student.parentEmail}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {student.parentPhone}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Método de contacto:</Label>
                        <div className="flex gap-2">
                          <Button
                            variant={
                              contactMethod === "email" ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setContactMethod("email")}
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Email
                          </Button>
                          <Button
                            variant={
                              contactMethod === "phone" ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setContactMethod("phone")}
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            Teléfono
                          </Button>
                        </div>
                      </div>

                      {contactMethod === "email" && (
                        <div className="space-y-2">
                          <Label htmlFor="message">Mensaje:</Label>
                          <Textarea
                            id="message"
                            placeholder="Escriba su mensaje aquí..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={4}
                          />
                        </div>
                      )}

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setContactDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={handleContactParents}>
                          <Send className="w-4 h-4 mr-2" />
                          {contactMethod === "email"
                            ? "Enviar Email"
                            : "Llamar"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button size="sm" onClick={handleGenerateReport}>
                  <FileText className="w-4 h-4 mr-2" />
                  Generar Reporte
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-8">
            {/* Estadísticas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {completedTasks.length}
                </div>
                <div className="text-sm text-blue-700">Tareas Entregadas</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {pendingTasks.length}
                </div>
                <div className="text-sm text-orange-700">Tareas Pendientes</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">9.1</div>
                <div className="text-sm text-green-700">Promedio General</div>
              </div>
            </div>

            {/* Tareas Pendientes */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-orange-500" />
                Tareas Pendientes
              </h3>
              <div className="grid gap-3">
                {pendingTasks.map((task, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{task.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Fecha límite:{" "}
                        {new Date(task.dueDate).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-800"
                      >
                        {task.subject}
                      </Badge>
                      <Badge
                        variant="destructive"
                        className="bg-orange-100 text-orange-800 border-orange-300"
                      >
                        Pendiente
                      </Badge>
                      <Button className="">Calificar</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comentarios Generales */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Comentarios Generales
              </h3>
              <div className="p-4 bg-gray-50 border rounded-lg">
                <p className="text-gray-700 leading-relaxed">
                  {generalComments}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                Tareas Entregadas
              </h3>
              <div className="space-y-4">
                {completedTasks.map((task, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {task.name}
                        </h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Entregado:{" "}
                            {new Date(task.submittedDate).toLocaleDateString(
                              "es-ES"
                            )}
                          </span>
                          <span>
                            Fecha límite:{" "}
                            {new Date(task.dueDate).toLocaleDateString("es-ES")}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-800"
                        >
                          {task.subject}
                        </Badge>
                        <div className="text-right">
                          <div
                            className={`text-lg font-bold ${
                              Number.parseFloat(task.grade) >= 9
                                ? "text-green-600"
                                : Number.parseFloat(task.grade) >= 7
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }`}
                          >
                            {task.grade}
                          </div>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${
                              new Date(task.submittedDate) <=
                              new Date(task.dueDate)
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {new Date(task.submittedDate) <=
                            new Date(task.dueDate)
                              ? "A tiempo"
                              : "Tardía"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded border-l-4 border-l-blue-400">
                      <p className="text-sm text-gray-700 font-medium mb-1">
                        Comentarios del maestro:
                      </p>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {task.comments}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
