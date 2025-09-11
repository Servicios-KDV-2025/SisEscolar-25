"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/shadcn/avatar";
import { Save, User, BookOpen, Star } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@repo/convex/convex/_generated/dataModel";

// Tipos de datos
interface Student {
  _id: Id<"student">;
  name: string;
  avatar?: string;
}

interface StudentClass {
  id: Id<"studentClass">;
  student: Student | null;
}

interface Assignment {
  _id: Id<"assignment">;
  name: string;
  maxScore: number;
}

interface Grade {
  _id: Id<"grade">;
  studentClassId: Id<"studentClass">;
  assignmentId: Id<"assignment">;
  score: number | null;
  comments?: string; // Agregué el campo de comentario
}

interface GradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Ahora el modal recibe los objetos completos del estudiante y la asignación
  studentClass: StudentClass | null;
  assignment: Assignment | null;
  grade: Grade | null | undefined;
  onSave: (
    studentClassId: Id<"studentClass">,
    assignmentId: Id<"assignment">,
    score: number | null,
    comments: string
  ) => void;
}
const CharacterCounter = ({
    current,
    max,
    // fieldName,
  }: {
    current: number;
    max: number;
    fieldName: string;
  }) => {
    const remaining = max - current;
    const isNearLimit = remaining <= 10;
    const isOverLimit = remaining < 0;

    return (
      <div
        className={`text-xs mt-1 text-right ${isOverLimit ? "text-red-600" : isNearLimit ? "text-amber-600" : "text-gray-500"}`}
      >
        {current}/{max} caracteres{" "}
      </div>
    );
  };

export function GradingModal({
  isOpen,
  onClose,
  studentClass,
  assignment,
  grade,
  onSave,
}: GradingModalProps) {
  // Inicializa el estado con los valores de las props
  const [currentGradeValue, setCurrentGradeValue] = useState(grade?.score?.toString() || "");
  const [comment, setComment] = useState(grade?.comments || "");

  // Sincroniza el estado local cuando las props cambian (al abrirse el modal para una nueva celda)
  useEffect(() => {
    setCurrentGradeValue(grade?.score?.toString() || "");
    setComment(grade?.comments || "");
  }, [grade]);

  const handleSave = () => {
    if (!studentClass || !assignment) {
      toast.error("Error: Información del estudiante o la asignación no disponible.");
      return;
    }

    const score = currentGradeValue === "" ? null : Number.parseFloat(currentGradeValue);

    if (score !== null && (isNaN(score) || score < 0 || score > assignment.maxScore)) {
      toast.error(
        `La calificación debe ser un número entre 0 y ${assignment.maxScore}.`
      );
      return;
    }

    // Llama a la función onSave que se encarga de la lógica de guardado
    onSave(studentClass.id, assignment._id, score, comment);
    
    onClose(); // Cierra el modal después de guardar
  };

  const handleClose = () => {
    // Resetear el estado al cerrar para evitar que la información de la celda anterior se quede
    setCurrentGradeValue("");
    setComment("");
    onClose();
  };
  
  // No renderiza el modal si la información esencial no está disponible
  if (!studentClass || !studentClass.student || !assignment) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Registrar Calificación
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel de información */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Información del Estudiante
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={studentClass.student.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{studentClass.student.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{studentClass.student.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Detalles de la Asignación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{assignment.name}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Puntuación máxima: {assignment.maxScore} puntos</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Formulario de calificación y comentario */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="grade">Calificación (0 - {assignment.maxScore})</Label>
              <Input
                id="grade"
                type="number"
                min="0"
                max={assignment.maxScore}
                value={currentGradeValue}
                onChange={(e) => setCurrentGradeValue(e.target.value)}
                placeholder="Ingresa la calificación"
              />
            </div>
            {currentGradeValue !== "" && (Number(currentGradeValue) < 0 || Number(currentGradeValue) > assignment.maxScore) && (
              <p className="text-sm text-red-600">
                La calificación debe estar entre 0 y {assignment.maxScore}.
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="comment">Comentario</Label>
              <Textarea
                id="comment"
                value={comment}
                maxLength={500}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escribe un comentario sobre el trabajo del estudiante..."
                rows={4}
              />
              <CharacterCounter
                current={comment.length}
                max={500}
                fieldName="comment"
              />
            </div>
            <Button onClick={handleSave} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Guardar Calificación
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}