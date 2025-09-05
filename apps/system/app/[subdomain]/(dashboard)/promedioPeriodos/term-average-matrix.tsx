// components/term-average-matrix.tsx
"use client";

import { Card, CardContent } from "@repo/ui/components/shadcn/card";
import { Id } from "@repo/convex/convex/_generated/dataModel";

interface StudentWithClass {
  id: Id<"studentClass">;
  student: {
    _id: Id<"student">;
    name: string;
  } | null;
}

interface TermAverage {
  termId: Id<"term">; // Agregamos termId en lugar de termName
  averageScore: number | null;
}

interface TermAverageMatrixProps {
  students: StudentWithClass[];
  averages: Map<string, TermAverage[]>; // Key: studentClassId, Value: array of averages
  terms: { _id: Id<"term">; name: string }[];
}

export function TermAverageMatrix({
  students,
  averages,
  terms,
}: TermAverageMatrixProps) {
        
  return (
    
        <div className="overflow-auto max-h-[calc(100vh-300px)]">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-muted z-10">
              <tr>
                <th className="text-left p-3 border border-border bg-muted font-semibold text-muted-foreground min-w-[200px] sticky left-0">
                  Estudiante
                </th>
                {terms.map((term) => (
                  <th
                    key={term._id}
                    className="text-center p-3 border border-border bg-muted font-semibold text-muted-foreground min-w-[120px]"
                  >
                    {term.name}
                  </th>
                ))}
                <th className="text-center p-3 border border-border bg-muted font-semibold text-muted-foreground min-w-[100px] sticky right-0">
                  Promedio Final
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                if (!student.student) return null;
                const studentAverages = averages.get(student.id) || [];
                const finalAverage = calculateFinalAverage(studentAverages);

                return (
                  <tr key={student.id} className="hover:bg-muted/50 transition-colors">
                    <td className="p-3 border border-border bg-card sticky left-0 font-medium text-card-foreground">
                      {student.student.name}
                    </td>
                    {terms.map((term) => {
                      const average = studentAverages.find(avg => avg.termId === term._id);
                      const averageScore = average?.averageScore;
                      return (
                        <td key={term._id} className="p-3 border border-border text-center">
                          {averageScore !== null ? (
                            <p className={averageScore! >= 80 ? "text-green-500" : (averageScore! >= 70 ? "text-gray-500" : "text-red-400")}>
                              {averageScore}%
                            </p>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-3 border border-border text-center bg-card sticky right-0">
                      {finalAverage !== null ? (
                        <p className={finalAverage >= 80 ? "text-green-500" : (finalAverage >= 70 ? "text-gray-500" : "text-red-400")}>
                          {finalAverage}%
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

// Lógica simple para calcular el promedio final de los promedios de los periodos.
const calculateFinalAverage = (averages: TermAverage[]): number | null => {
    const validAverages = averages.filter(avg => avg.averageScore !== null);
    if (validAverages.length === 0) return null;
    const sum = validAverages.reduce((acc, avg) => acc + avg.averageScore!, 0);
    return Math.round(sum / validAverages.length);
};