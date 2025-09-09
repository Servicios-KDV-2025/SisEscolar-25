"use client";

import type React from "react";
import { useState } from "react";
import { Input } from "@repo/ui/components/shadcn/input";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/shadcn/table";

// Actualiza los tipos para reflejar el modelo de termAverage
interface StudentWithClass {
  id: Id<"studentClass">;
  student: {
    _id: Id<"student">;
    name: string;
  } | null;
}

interface Term {
  _id: Id<"term">;
  name: string;
}

// Los promedios que recibes tienen esta estructura
interface StudentTermAverage {
  _id: Id<"termAverage">;
  studentClassId: Id<"studentClass">;
  termId: Id<"term">;
  averageScore: number | null;
}

interface TermAverageMatrixProps {
  students: StudentWithClass[];
  terms: Term[];
  averages: Map<string, StudentTermAverage[]>; // Un mapa donde cada valor es un ARRAY de promedios
  onAverageUpdate: (studentClassId: string, termId: string, score: number | null) => void;
}

export function TermAverageMatrix({
  students,
  terms,
  averages,
  onAverageUpdate,
}: TermAverageMatrixProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>("");

  const getAverageScore = (studentClassId: string, termId: string) => {
    const studentAverages = averages.get(studentClassId);
    return studentAverages?.find((avg) => avg.termId === termId)?.averageScore;
  };

  const handleCellClick = (studentClassId: string, termId: string) => {
    const cellId = `${studentClassId}-${termId}`;
    setEditingCell(cellId);
    const currentAverage = getAverageScore(studentClassId, termId);
    setTempValue(currentAverage?.toString() || "");
  };

  const handleCellBlur = (studentClassId: string, termId: string) => {
    const score = tempValue === "" ? null : Number.parseFloat(tempValue);

    if (score !== null && score > 100) {
      toast.error(`La calificación no puede ser mayor que 100.`);
      setEditingCell(null);
      return;
    }
  
    if (!isNaN(score!)) {
      onAverageUpdate(studentClassId, termId, score);
    }
    setEditingCell(null);
    setTempValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent, studentClassId: string, termId: string) => {
    if (e.key === "Enter") {
      handleCellBlur(studentClassId, termId);
    } else if (e.key === "Escape") {
      setEditingCell(null);
      setTempValue("");
    }
  };

  // ✨ Nueva función para calcular el promedio anual en el frontend
  const calculateAnnualAverage = (studentClassId: string): number | null => {
    const studentAverages = averages.get(studentClassId);
    if (!studentAverages || studentAverages.length === 0) {
      return null;
    }
    
    let totalScoreSum = 0;
    let validTermsCount = 0;

    studentAverages.forEach(avg => {
      if (avg.averageScore !== null) {
        totalScoreSum += avg.averageScore;
        validTermsCount++;
      }
    });

    if (validTermsCount === 0) {
      return null;
    }

    return Math.round(totalScoreSum / validTermsCount);
  };

  return (
    <div className="overflow-auto max-h-[calc(100vh-300px)]">
      <Table className="w-full border-collapse">
        <TableHeader className="sticky top-0 bg-muted z-10">
          <TableRow>
            <TableHead className="text-left p-3 border border-border bg-muted font-semibold text-muted-foreground min-w-[200px] sticky left-0">
              Estudiante
            </TableHead>
            {terms.map((term) => (
              <TableHead
                key={term._id}
                className="text-center p-3 border border-border bg-muted font-semibold text-muted-foreground min-w-[120px]"
              >
                <div className="space-y-1">
                  <div className="font-medium text-sm">{term.name}</div>
                  <div className="text-xs text-muted-foreground">Max: {100}</div>
                </div>
              </TableHead>
            ))}
            <TableHead className="text-center p-3 border border-border bg-muted font-semibold text-muted-foreground min-w-[100px] sticky right-0">
              Promedio Anual
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => {
            if (!student.student) return null;
            
            const annualAverage = calculateAnnualAverage(student.id);

            return (
              <TableRow key={student.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="p-3 border border-border bg-card sticky left-0">
                    <div className="font-medium text-card-foreground">{student.student.name}</div>
                </TableCell>
                {terms.map((term) => {
                  const average = getAverageScore(student.id, term._id);
                  const cellId = `${student.id}-${term._id}`;
                  const isEditing = editingCell === cellId;

                  return (
                    <TableCell key={term._id} className="p-1 border border-border text-center">
                      {isEditing ? (
                        <Input
                          type="number"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          onBlur={() => handleCellBlur(student.id, term._id)}
                          onKeyDown={(e) => handleKeyDown(e, student.id, term._id)}
                          className="w-full text-center border-accent"
                          min="0"
                          max={100}
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={() => handleCellClick(student.id, term._id)}
                           className={average !== null && average! > (100 * 0.7) ? "text-green-600" : (average !== null && average! < (100 * 0.7) ? "text-red-700" : "text-gray-700")}
                        >
                          {average !== undefined ? `${average}` : "-"}
                        </div>
                      )}
                    </TableCell>
                  );
                })}
                <TableCell className="p-3 border border-border text-center bg-card sticky right-0">
                  {annualAverage !== null ? (
                    <p
                      className={annualAverage >= 80 ? "text-green-500" : (annualAverage >= 70 ? "text-gray-500" : "text-red-400")}
                    >
                      {annualAverage}%
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