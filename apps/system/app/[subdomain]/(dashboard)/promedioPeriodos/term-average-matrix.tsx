// En term-average-matrix.tsx

import type React from "react";
import { useState } from "react";
import { Input } from "@repo/ui/components/shadcn/input";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/shadcn/table";
import { MessageCircleMore, MessageCircleDashed } from "@repo/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@repo/ui/components/shadcn/tooltip";

import { GradingModal } from "components/grading-modal";

// ... (interfaces existentes)
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
  startDate: number; 
  endDate: number;   
}

interface StudentTermAverage {
  _id: Id<"termAverage">;
  studentClassId: Id<"studentClass">;
  termId: Id<"term">;
  averageScore: number | null;
  comments?: string;
}

interface TermAverageMatrixProps {
  students: StudentWithClass[];
  terms: Term[];
  averages: Map<string, StudentTermAverage[]>;
  onAverageUpdate: (studentClassId: string, termId: string, score: number | null, comment: string) => void;
}

export function TermAverageMatrix({
  students,
  terms,
  averages,
  onAverageUpdate,
}: TermAverageMatrixProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithClass | null>(null);
  const [selectedData, setSelectedData] = useState<{
    item: Term | null;
    grade: StudentTermAverage | null;
  }>({ item: null, grade: null });


  const getAverageScore = (studentClassId: string, termId: string) => {
    const studentAverages = averages.get(studentClassId);
    return studentAverages?.find((avg) => avg.termId === termId)?.averageScore;
  };

  const getComment = (studentClassId: string, termId: string) => {
    const studentAverages = averages.get(studentClassId);
    return studentAverages?.find((avg) => avg.termId === termId)?.comments;
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
      onAverageUpdate(studentClassId, termId, score, getComment(studentClassId, termId) || "");
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

  const handleButtonClick = (studentId: string, termId: string) => {
    const studentData = students.find((s) => s.id === studentId);
    const termData = terms.find((t) => t._id === termId);
    const averageData = averages
      .get(studentId)
      ?.find((avg) => avg.termId === termId);

    setSelectedStudent(studentData || null);
    setSelectedData({
      item: termData || null,
      grade: averageData || null,
    });
    setIsModalOpen(true);
  };
  
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
    setSelectedData({ item: null, grade: null });
  };
  
const handleModalSave = (
  studentClassId: Id<"studentClass">,
  itemId: Id<"assignment"> | Id<"term">,
  score: number | null,
  comment: string
) => {
  onAverageUpdate(studentClassId, itemId as Id<"term">, score, comment);
  handleModalClose();
};


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
    <TooltipProvider>
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
                  
                  const commentText = getComment(student.id, term._id);
                  return (
                    <TableCell key={term._id} className="p-1 border border-border text-center">
                      <div className="flex items-center justify-center space-x-2">
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
                           className={`
                           ${average !== null && average! > (100 * 0.7)
                              ? "text-green-600"
                              : average !== null && average! < (100 * 0.7)
                              ? "text-red-700"
                              : "text-gray-700"
                            }
                           cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded
                         `}
                        >
                          {average !== undefined ? `${average}` : "-"}
                        </div>
                      )}
                       <Tooltip delayDuration={200}>
                                                   <TooltipTrigger asChild>
                                                     {commentText ? (
                                                       <MessageCircleMore
                                                         onClick={() => {
                                                           handleButtonClick(student.id, term._id);
                                                         }}
                                                         className="h-7.5 w-7.5 rounded-lg justify-end p-0.5 cursor-pointer hover:bg-gray-400 hover:text-white transition-colors"
                                                       />
                                                     ) : (
                                                       <MessageCircleDashed
                                                         onClick={() => {
                                                           handleButtonClick(student.id, term._id);
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
      <GradingModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        studentClass={selectedStudent}
        context="term" // ✅ Contexto "term"
        data={selectedData}
        onSave={(studentClassId, itemId, score, comment) =>
          handleModalSave(studentClassId, itemId, score, comment)
        }
      />
    </div>
    </TooltipProvider>
  );
}