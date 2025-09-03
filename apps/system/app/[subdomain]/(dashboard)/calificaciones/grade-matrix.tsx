"use client";

import type React from "react";
import { useState } from "react";
import { Input } from "@repo/ui/components/shadcn/input";
import { Id } from "@repo/convex/convex/_generated/dataModel";

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
  assignments: Assignment[] | undefined; // ✨ Aceptar undefined
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
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-muted z-10">
          <tr>
            <th className="text-left p-3 border border-border bg-muted font-semibold text-muted-foreground min-w-[200px] sticky left-0">
              Estudiante
            </th>
            {assignments!.map((assignment) => (
              <th
                key={assignment._id}
                className="text-center p-3 border border-border bg-muted font-semibold text-muted-foreground min-w-[120px]"
              >
                <div className="space-y-1">
                  <div className="font-medium text-sm">{assignment.name}</div>
                  <div className="text-xs text-muted-foreground">Max: {assignment.maxScore}</div>
                </div>
              </th>
            ))}
            <th className="text-center p-3 border border-border bg-muted font-semibold text-muted-foreground min-w-[100px] sticky right-0">
              Promedio
            </th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => {
            if (!student.student) return null; // Salta la fila si el estudiante es nulo
            
            const average = calculateAverage(student.id);

            return (
              <tr key={student.id} className="hover:bg-muted/50 transition-colors">
                <td className="p-3 border border-border bg-card sticky left-0">
                    <div className="font-medium text-card-foreground">{student.student.name}</div>
                </td>
                {assignments!.map((assignment) => {
                  const grade = getGrade(student.id, assignment._id);
                  const cellId = `${student.id}-${assignment._id}`;
                  const isEditing = editingCell === cellId;

                  return (
                    <td key={assignment._id} className="p-1 border border-border text-center">
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
                           className={grade! > (assignment.maxScore*0.7) ? "text-green-600" : (grade! < (assignment.maxScore*0.7) ? "text-red-700" : "text-gray-700")}
                        >
                          {grade !== undefined ? `${grade}` : "-"}
                        </div>
                      )}
                    </td>
                  );
                })}
                <td className="p-3 border border-border text-center bg-card sticky right-0">
                  {average !== null ? (
                    <p
                      
                      className={average >= 80 ? "text-green-500" : (average >= 70 ? "text-gray-500" : "text-red-400")}
                    >
                      {average}%
                    </p>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}