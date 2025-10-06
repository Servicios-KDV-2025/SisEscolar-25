// En grading-modal.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui/components/shadcn/dialog";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/shadcn/avatar";
import { Save, User, BookOpen, Star, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@repo/convex/convex/_generated/dataModel";

import { es } from 'date-fns/locale'; // Importa el locale en español
import { formatDate } from "date-fns";

// Tipos de datos que ya tienes
interface Student {
  _id: Id<"student">;
  name: string;
  avatar?: string;
}

interface StudentClass {
  _id: Id<"studentClass">;
  student: Student | null;
}

// Ahora usamos interfaces para ambos contextos (Asignación y Promedio)
interface AssignmentData {
  _id: Id<"assignment">;
  name: string;
  maxScore: number;
}

interface TermData {
  _id: Id<"term">;
  name: string;
  startDate: number;
  endDate: number;
}

interface GradeData {
  _id: Id<"grade">;
  studentClassId: Id<"studentClass">;
  assignmentId: Id<"assignment">;
  score: number | null;
  comments?: string;
}

interface AverageData {
  _id: Id<"termAverage">;
  studentClassId: Id<"studentClass">;
  termId: Id<"term">;
  averageScore: number | null;
  comments?: string;
}

// ✅ La interfaz del modal ahora es flexible
interface GradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentClass: StudentClass | null;
  context: "assignment" | "term"; // Para saber qué tipo de datos estamos mostrando
  data: {
    item: AssignmentData | TermData | null;
    grade: GradeData | AverageData | null;
  };
  onSave: (
    studentClassId: Id<"studentClass">,
    itemId: Id<"assignment"> | Id<"term">,
    score: number | null,
    comments: string
  ) => void;
  canUpdateRubric: boolean;
}

const CharacterCounter = ({
  current,
  max,
}: {
  current: number;
  max: number;
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
  context,
  data,
  onSave,
  canUpdateRubric,
}: GradingModalProps) {
  const [currentScoreValue, setCurrentScoreValue] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data.grade) {
      if (context === "assignment") {
        const gradeData = data.grade as GradeData;
        setCurrentScoreValue(gradeData.score?.toString() || "");
        setComment(gradeData.comments || "");
      } else {
        const averageData = data.grade as AverageData;
        setCurrentScoreValue(averageData.averageScore?.toString() || "");
        setComment(averageData.comments || "");
      }
    } else {
      setCurrentScoreValue("");
      setComment("");
    }
    setError(null);
  }, [data.grade, context, isOpen]);

  const handleSave = () => {
    if (!studentClass || !data.item) {
      toast.error("Error: Información del estudiante o la tarea/período no disponible." + error);
      return;
    }

    const score = currentScoreValue === "" ? null : Number.parseFloat(currentScoreValue);

    // Obtener la puntuación máxima según el contexto
    const maxScore = context === "assignment"
      ? (data.item as AssignmentData).maxScore
      : 100;

    if (score !== null && (isNaN(score) || score < 0 || score > maxScore)) {
      toast.error(
        `La calificación debe ser un número entre 0 y ${maxScore}.`
      );
      return;
    }

    onSave(studentClass._id, data.item._id as Id<"assignment"> | Id<"term">, score, comment);

    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  if (!studentClass || !studentClass.student || !data.item) {
    return null;
  }

  const termItem = data.item as TermData;
  const formattedStartDate = termItem.startDate ? formatDate(termItem.startDate, 'P', { locale: es }) : 'N/A';
  const formattedEndDate = termItem.endDate ? formatDate(termItem.endDate, 'P', { locale: es }) : 'N/A';

  // ✅ Contenido dinámico según el contexto
  const isAssignment = context === "assignment";
  const itemTitle = isAssignment ? "Asignación" : "Período";
  const scoreLabel = isAssignment ? "Calificación" : "Promedio";
  const maxScore = isAssignment
    ? (data.item as AssignmentData).maxScore
    : 100;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            {isAssignment ? "Registrar Calificación" : "Registrar Promedio"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  {isAssignment ? <BookOpen className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                  Detalles de la {itemTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{(data.item.name).toUpperCase()}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {isAssignment ? (
                    <div className="text-sm text-muted-foreground">
                      <p>Puntuación máxima: {maxScore} puntos</p>
                    </div>
                  ) : (
                    // ✅ Muestra las fechas solo en el contexto de "term"
                    <div className="text-sm text-muted-foreground">
                      <p>Inicio: {formattedStartDate}</p>

                      <p>Fin: {formattedEndDate}</p>

                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="score">{scoreLabel} (0 - {maxScore})</Label>
              <Input
                id="score"
                type="number"
                min="0"
                max={maxScore}
                value={currentScoreValue}
                onChange={(e) => setCurrentScoreValue(e.target.value)}
                placeholder="Ingresa la calificación"
                disabled={!canUpdateRubric}
              />
            </div>
            {currentScoreValue !== "" && (Number(currentScoreValue) < 0 || Number(currentScoreValue) > maxScore) && (
              <p className="text-sm text-red-600">
                La {scoreLabel.toLowerCase()} debe estar entre 0 y {maxScore}.
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
                disabled={!canUpdateRubric}
              />
              {(canUpdateRubric) && (
                <CharacterCounter
                  current={comment.length}
                  max={500}
                />
              )}
            </div>
            {canUpdateRubric && (
              <Button onClick={handleSave} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Guardar {scoreLabel}
              </Button>
            )}
          </div>
        </div>
        <DialogFooter className="hidden"></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}