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
import { GradingModal } from "components/grading-modal";
import { MessageCircleMore, MessageCircleDashed } from "@repo/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@repo/ui/components/shadcn/tooltip";

interface StudentWithClass {
  _id: Id<"studentClass">;
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
  canUpdateRubric: boolean;
}

export function GradeMatrix({
  students,
  assignments,
  grades,
  onGradeUpdate,
  calculateAverage,
  canUpdateRubric,
}: GradeMatrixProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentClass, setSelectedStudentClass] = useState<StudentWithClass | null>(null);

  // ✅ Usamos un estado único para los datos del modal
  const [selectedData, setSelectedData] = useState<{
    item: Assignment | null;
    grade: Grade | null;
  }>({ item: null, grade: null });

  const handleButtonClick = (studentId: string, assignmentId: string) => {
    const studentClassData = students.find((s) => s._id === studentId);
    const assignmentData = assignments?.find((a) => a._id === assignmentId);
    const gradeData = grades.find(
      (g) => g.studentClassId === studentId && g.assignmentId === assignmentId
    );

    setSelectedStudentClass(studentClassData || null);
    setSelectedData({
      item: assignmentData || null,
      grade: gradeData || null,
    });
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedStudentClass(null);
    setSelectedData({ item: null, grade: null });
  };

  const handleModalSave = (
    studentClassId: Id<"studentClass">,
    itemId: Id<"assignment"> | Id<"term">,
    score: number | null,
    comment: string
  ) => {
    onGradeUpdate(studentClassId, itemId as Id<"assignment">, score, comment);
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
    <TooltipProvider>
      <div className="overflow-auto max-h-[calc(100vh-300px)] border border-border rounded-lg">
        <Table className="relative">
          <TableHeader>

            <TableRow >
              <TableHead className="sticky left-0 z-20 bg-background text-center min-w-[200px]">
                Estudiante
              </TableHead>
              {assignments!.map((assignment) => (
                <TableHead
                  key={assignment._id}
                  className="text-center min-w-[120px]"
                >
                  <div className="space-y-1">
                    <div className="font-medium text-sm">{assignment.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Max: {assignment.maxScore}
                    </div>
                  </div>
                </TableHead>
              ))}
              <TableHead className="sticky right-0 z-20 bg-background text-center">
                Promedio
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => {
              if (!student.student) return null;

              const average = calculateAverage(student._id);

              return (
                <TableRow
                  key={student._id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="sticky left-0 z-10 bg-card">
                    <div className="font-medium text-card-foreground">
                      {student.student.name}
                    </div>
                  </TableCell>
                  {assignments!.map((assignment) => {
                    const grade = getGrade(student._id, assignment._id);
                    const cellId = `${student._id}-${assignment._id}`;
                    const isEditing = editingCell === cellId;
                    const gradeData = grades.find(
                      (g) =>
                        g.studentClassId === student._id &&
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
                        className="p-1 text-center"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          {(isEditing && canUpdateRubric) ? (
                            <Input
                              type="number"
                              value={tempValue}
                              onChange={(e) => setTempValue(e.target.value)}
                              onBlur={() =>
                                handleCellBlur(student._id, assignment._id)
                              }
                              onKeyDown={(e) =>
                                handleKeyDown(e, student._id, assignment._id)
                              }
                              className="w-full text-center "
                              min="0"
                              max={assignment.maxScore}
                              autoFocus
                            />
                          ) : (
                            <div
                              onClick={() =>
                                handleCellClick(student._id, assignment._id)
                              }
                              className={`
            ${grade! > assignment.maxScore * 0.7
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
                          <Tooltip delayDuration={200}>
                            <TooltipTrigger asChild>
                              {commentText ? (
                                <MessageCircleMore
                                  onClick={() => {
                                    handleButtonClick(student._id, assignment._id);
                                  }}
                                  className="h-7.5 w-7.5 rounded-lg justify-end p-0.5 cursor-pointer hover:bg-gray-400 hover:text-white transition-colors"
                                />
                              ) : (
                                <MessageCircleDashed
                                  onClick={() => {
                                    handleButtonClick(student._id, assignment._id);
                                  }}
                                  className="h-7.5 w-7.5 rounded-lg justify-end p-0.5 cursor-pointer hover:bg-gray-400 hover:text-white transition-colors"
                                />
                              )}
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              {commentText ? (
                                <p>{commentText}</p>
                              ) : (
                                <p>No hay comentarios</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    );
                  })}
                  <TableCell className="sticky right-0 z-10 p-3 text-center bg-card">
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

        {/* ✅ Modal con el nuevo formato de props */}
        <GradingModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          studentClass={selectedStudentClass}
          context="assignment"
          data={selectedData}
          onSave={handleModalSave}
          canUpdateRubric={canUpdateRubric}
        />
      </div>
    </TooltipProvider>
  );
}