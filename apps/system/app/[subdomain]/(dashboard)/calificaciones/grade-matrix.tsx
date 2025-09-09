"use client";

import type React from "react";
import { useState } from "react";
import { Input } from "@repo/ui/components/shadcn/input";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { toast } from 'sonner'; // ✨ Importa la librería de toast
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/shadcn/table";

// Update types to match your Convex schema
interface StudentWithClass {
  id: Id<"studentClass">;
  student: {
    _id: Id<"student">;
    name: string;
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
}

interface GradeMatrixProps {
  students: StudentWithClass[];
  assignments: Assignment[] | undefined; 
  grades: Grade[];
  onGradeUpdate: (studentClassId: string, assignmentId: string, score: number | null) => void;
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

  const getGrade = (studentClassId: string, assignmentId: string) => {
    return grades.find((g) => g.studentClassId === studentClassId && g.assignmentId === assignmentId)?.score;
  };

  const handleCellClick = (studentClassId: string, assignmentId: string) => {
    const cellId = `${studentClassId}-${assignmentId}`;
    setEditingCell(cellId);
    const currentGrade = getGrade(studentClassId, assignmentId);
    setTempValue(currentGrade?.toString() || "");
  };

  const handleCellBlur = (studentClassId: string, assignmentId: string) => {
    const score = tempValue === "" ? null : Number.parseFloat(tempValue);

    // ✨ Validación para que la calificación no sea mayor que el puntaje máximo
    const assignment = assignments?.find(a => a._id === assignmentId);
    if (score !== null && assignment && score > assignment.maxScore) {
      toast.error(`La calificación no puede ser mayor que el puntaje máximo (${assignment.maxScore}).`);
      setEditingCell(null);
      return; // Detiene la función
    }
  
    if (!isNaN(score!)) {
      onGradeUpdate(studentClassId, assignmentId, score);
    }
    setEditingCell(null);
    setTempValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent, studentClassId: string, assignmentId: string) => {
    if (e.key === "Enter") {
      handleCellBlur(studentClassId, assignmentId);
    } else if (e.key === "Escape") {
      setEditingCell(null);
      setTempValue("");
    }
  };

  return (
    <div className="overflow-auto max-h-[calc(100vh-300px)]">
      <Table >
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
                  <div className="text-xs text-muted-foreground">Max: {assignment.maxScore}</div>
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
              <TableRow key={student.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="p-3 border border-border bg-card sticky left-0">
                  <div className="font-medium text-card-foreground">{student.student.name}</div>
                </TableCell>
                {assignments!.map((assignment) => {
                  const grade = getGrade(student.id, assignment._id);
                  const cellId = `${student.id}-${assignment._id}`;
                  const isEditing = editingCell === cellId;
      
                  return (
                    <TableCell key={assignment._id} className="p-1 border border-border text-center">
                      {isEditing ? (
                        <Input
                          type="number"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          onBlur={() => handleCellBlur(student.id, assignment._id)}
                          onKeyDown={(e) => handleKeyDown(e, student.id, assignment._id)}
                          className="w-full text-center border-accent"
                          min="0"
                          max={assignment.maxScore}
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={() => handleCellClick(student.id, assignment._id)}
                          className={`
                            ${grade! > (assignment.maxScore * 0.7) ? "text-green-600" : (grade! < (assignment.maxScore * 0.7) ? "text-red-700" : "text-gray-700")}
                            cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded
                          `}
                        >
                          {grade !== undefined ? `${grade}` : "-"}
                        </div>
                      )}
                    </TableCell>
                  );
                })}
                <TableCell className="p-3 border border-border text-center bg-card sticky right-0">
                  {average !== null ? (
                    <p
                      className={average >= 80 ? "text-green-500" : (average >= 70 ? "text-gray-500" : "text-red-400")}
                    >
                      {average}%
                    </p>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}