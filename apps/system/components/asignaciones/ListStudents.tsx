import { api } from "@repo/convex/convex/_generated/api";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { Button } from "@repo/ui/components/shadcn/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@repo/ui/components/shadcn/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/shadcn/table";
import { useQuery } from "convex/react";
import { Dispatch, SetStateAction } from "react";

interface DialogPorps {
  open: boolean
  close: Dispatch<SetStateAction<boolean>>
  assignmentDetails: {
    assignment: {
      _id: Id<"assignment">;
      name: string;
      description: string | undefined;
      dueDate: number;
      maxScore: number;
    };
    classCatalog: {
      _id: Id<"classCatalog">;
      name: string;
    };
    totalStudents: number;
    submittedCount: number;
    pendingCount: number;
    submittedStudents: any[];
    pendingStudents: any[];
  } | undefined
}


export default function ListStudents({ open, close, assignmentDetails }: DialogPorps) {
  const students = useQuery(
    api.functions.student.getStudentWithClasses,
    assignmentDetails?.classCatalog._id
      ? { classCatalogId: assignmentDetails?.classCatalog._id as Id<"classCatalog"> }
      : "skip"
  )

  const grades = useQuery(
    api.functions.grades.getGradesByAssignment,
    assignmentDetails?.assignment._id 
      ? {assignmentId: assignmentDetails.assignment._id as Id<'assignment'>}
      : 'skip'
  )

  const getGrade = (studentClassId: string, assignmentId: string) => {
    return grades!.find(
      (g) =>
        g.studentClassId === studentClassId && g.assignmentId === assignmentId
    )?.score;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={close}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Alumnos asignados de {assignmentDetails?.assignment.name}
            </DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">Alumno</TableHead>
                <TableHead className="w-1/4">Calificación</TableHead>
                <TableHead className="w-2/5">Comentarios</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students?.map((student) => {
                return (
                  <TableRow
                    key={student._id}
                  >
                    <TableCell>
                      <div>
                        {student.student?.name}
                      </div>
                    </TableCell>

                    <TableCell>
                      {grades?.map((grade) => (
                          grade.score
                      ))}
                    </TableCell>
                    
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <div className="mt-6 flex justify-center">
            <Button
              // onClick={handleSaveGrades} 
              className="px-8 py-2 text-lg">
              Guardar Calificaciones
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}