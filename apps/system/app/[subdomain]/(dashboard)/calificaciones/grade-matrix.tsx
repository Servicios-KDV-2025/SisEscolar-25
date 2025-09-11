"use client";

import type React from "react";
import { useState } from "react";
import { Input } from "@repo/ui/components/shadcn/input";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/shadcn/table";
import { GradingModal } from "components/grading-modal";//message-square
import { MessageCircleMore, MessageCircleDashed } from "@repo/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/shadcn/tooltip";

interface StudentWithClass {
  id: Id<"studentClass">;
  student: {
    _id: Id<"student">;
    name: string;
    avatar?: string;
  } | null;
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
  comments?: string;
}

interface GradeMatrixProps {
  students: StudentWithClass[];
  assignments: Assignment[] | undefined;
  grades: Grade[];
  onGradeUpdate: (
    studentClassId: string,
    assignmentId: string,
    score: number | null,
    comment: string // <-- New argument
  ) => void;
  calculateAverage: (studentClassId: string) => number | null;
}

export function GradeMatrix({
  students,
  assignments,
  grades,
  onGradeUpdate,
  calculateAverage,
}: GradeMatrixProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentClass, setSelectedStudentClass] =
    useState<StudentWithClass | null>(null);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);

  // Función para manejar el clic en el ícono y preparar los datos para el modal
  const handleButtonClick = (studentId: string, assignmentId: string) => {
    const studentClassData = students.find((s) => s.id === studentId);
    const assignmentData = assignments?.find((a) => a._id === assignmentId);
    const gradeData = grades.find(
      (g) => g.studentClassId === studentId && g.assignmentId === assignmentId
    );

    setSelectedStudentClass(studentClassData || null);
    setSelectedAssignment(assignmentData || null);
    setSelectedGrade(gradeData || null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedStudentClass(null);
    setSelectedAssignment(null);
    setSelectedGrade(null);
  };

  // Esta función ahora recibe el comentario
  const handleModalSave = (
    studentClassId: Id<"studentClass">,
    assignmentId: Id<"assignment">,
    score: number | null,
    comment: string // Recibes el comentario del modal
  ) => {
    // Llama a la única función que ahora se encarga de la calificación y el comentario
    onGradeUpdate(studentClassId, assignmentId, score, comment);

    handleModalClose();
  };

  const getGrade = (studentClassId: string, assignmentId: string) => {
    return grades.find(
      (g) =>
        g.studentClassId === studentClassId && g.assignmentId === assignmentId
    )?.score;
  };

  const handleCellClick = (studentClassId: string, assignmentId: string) => {
    const cellId = `${studentClassId}-${assignmentId}`;
    setEditingCell(cellId);
    const currentGrade = getGrade(studentClassId, assignmentId);
    setTempValue(currentGrade?.toString() || "");
  };

  // Implementación única de la función handleCellBlur
  const handleCellBlur = (studentClassId: string, assignmentId: string) => {
    const score = tempValue === "" ? null : Number.parseFloat(tempValue);

    const assignment = assignments?.find((a) => a._id === assignmentId);
    if (score !== null && assignment && score > assignment.maxScore) {
      toast.error(
        `La calificación no puede ser mayor que el puntaje máximo (${assignment.maxScore}).`
      );
      setEditingCell(null);
      return;
    }

    const existingGrade = grades.find(
      (g) =>
        g.studentClassId === studentClassId && g.assignmentId === assignmentId
    );
    const currentComment = existingGrade?.comments || "";

    if (!isNaN(score!)) {
      onGradeUpdate(studentClassId, assignmentId, score, currentComment);
    }
    setEditingCell(null);
    setTempValue("");
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    studentClassId: string,
    assignmentId: string
  ) => {
    if (e.key === "Enter") {
      handleCellBlur(studentClassId, assignmentId);
    } else if (e.key === "Escape") {
      setEditingCell(null);
      setTempValue("");
    }
  };

  return (
    <div className="overflow-auto max-h-[calc(100vh-300px)]">
      <Table>
        <TableHeader className="sticky top-0 bg-muted z-10">
          <TableRow>
            <TableHead className="text-left p-3 border border-border bg-muted font-semibold text-muted-foreground min-w-[200px] sticky left-0">
              Estudiante
            </TableHead>
            {assignments!.map((assignment) => (
              <TableHead
                key={assignment._id}
                className="text-center p-3 border border-border bg-muted font-semibold text-muted-foreground min-w-[120px]"
              >
                <div className="space-y-1">
                  <div className="font-medium text-sm">{assignment.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Max: {assignment.maxScore}
                  </div>
                </div>
              </TableHead>
            ))}
            <TableHead className="text-center p-3 border border-border bg-muted font-semibold text-muted-foreground min-w-[100px] sticky right-0">
              Promedio
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => {
            if (!student.student) return null;

            const average = calculateAverage(student.id);

            return (
              <TableRow
                key={student.id}
                className="hover:bg-muted/50 transition-colors"
              >
                <TableCell className="p-3 border border-border bg-card sticky left-0">
                  <div className="font-medium text-card-foreground">
                    {student.student.name}
                  </div>
                </TableCell>
                {assignments!.map((assignment) => {
                  const grade = getGrade(student.id, assignment._id);
                  const cellId = `${student.id}-${assignment._id}`;
                  const isEditing = editingCell === cellId;
                  const gradeData = grades.find(
                    (g) =>
                      g.studentClassId === student.id &&
                      g.assignmentId === assignment._id
                  );
                  

                  const commentText = gradeData?.comments
                  ? gradeData.comments.length > 25
                    ? `${gradeData.comments.substring(0, 25)}...`
                    : gradeData.comments
                  : null;

                  return (
                    <TableCell
                      key={assignment._id}
                      className="p-1 border border-border text-center"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            onBlur={() =>
                              handleCellBlur(student.id, assignment._id)
                            }
                            onKeyDown={(e) =>
                              handleKeyDown(e, student.id, assignment._id)
                            }
                            className="w-full text-center border-accent"
                            min="0"
                            max={assignment.maxScore}
                            autoFocus
                          />
                        ) : (
                          <div
                            onClick={() =>
                              handleCellClick(student.id, assignment._id)
                            }
                            className={`
          ${
            grade! > assignment.maxScore * 0.7
              ? "text-green-600"
              : grade! < assignment.maxScore * 0.7
                ? "text-red-700"
                : "text-gray-700"
          }
          cursor-pointer hover:bg-gray-400 hover:text-white rounded px-2 py-1 min-w-[40px
        `}
                          >
                            {grade !== undefined ? `${grade}` : "-"}
                          </div>
                        )}
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            {commentText ? (<MessageCircleMore
                              onClick={() => {
                                handleButtonClick(student.id, assignment._id);
                              }}
                              className="h-7.5 w-7.5 rounded-lg  justify-end p-0.5 cursor-pointer hover:bg-gray-400 hover:text-white transition-colors" 
                            />):(<MessageCircleDashed
                              onClick={() => {
                                handleButtonClick(student.id, assignment._id);
                              }}
                              className="h-7.5 w-7.5 rounded-lg justify-end p-0.5 cursor-pointer hover:bg-gray-400 hover:text-white transition-colors" 
                            />)}
                            
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            {commentText ?(<p>{commentText}</p>):(<p>No hay comentarios</p>)}
                            
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  );
                })}
                <TableCell className="p-3 border border-border text-center bg-card sticky right-0">
                  {average !== null ? (
                    <div className="flex items-center justify-center space-x-2">
                      <p
                        className={
                          average >= 80
                            ? "text-green-500"
                            : average >= 70
                              ? "text-gray-500"
                              : "text-red-400"
                        }
                      >
                        {average}%
                      </p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <GradingModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        studentClass={selectedStudentClass}
        assignment={selectedAssignment}
        grade={selectedGrade}
        onSave={handleModalSave}
      />
    </div>
  );
}
