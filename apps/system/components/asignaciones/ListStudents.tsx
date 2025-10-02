import { useUser } from "@clerk/nextjs";
import { api } from "@repo/convex/convex/_generated/api";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { Button } from "@repo/ui/components/shadcn/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@repo/ui/components/shadcn/dialog";
import { Input } from "@repo/ui/components/shadcn/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/shadcn/table";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { useMutation, useQuery } from "convex/react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "sonner";
import { useUserWithConvex } from "stores/userStore";

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

interface GradeData {
  studentClassId: Id<'studentClass'>
  score: string
  comments: string
}

// Crear datos iniciales vacios
const createEmptyGradeData = (studentClassId: Id<'studentClass'>): GradeData => ({
  studentClassId,
  score: '',
  comments: ''
})

export default function ListStudents({ open, close, assignmentDetails }: DialogPorps) {
  const { user: clerkUser } = useUser()
  const { currentUser } = useUserWithConvex(clerkUser?.id)
  const upsertGrade = useMutation(api.functions.grades.upsertGrade)

  const [gradesData, setGradesData] = useState<Record<string, GradeData>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

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

  useEffect(() => {
    if(open && students && grades && !isInitialized) {
      const initialData: Record<string, GradeData> = {}

      students.forEach((student) => {
        const existingGrade = grades.find(
          g => g.studentClassId === student._id
        )

        initialData[student._id] = {
          studentClassId: student._id,
          score: existingGrade?.score.toString() || '',
          comments: existingGrade?.comments || ''
        }
      })

      setGradesData(initialData)
    }
  }, [open, students, grades, isInitialized])

  useEffect(() => {
    if(!open) {
      setIsInitialized(false)
      setGradesData({})
    }
  }, [open])

  const getGrade = (studentClassId: string) => {
    return grades?.find(g => g.studentClassId === studentClassId)?.score
  };

  const handleGradeChange = (studentClassId: Id<'studentClass'>, field: keyof GradeData, value: string) => {
    setGradesData(prev => {
      const currentStudentData = prev[studentClassId] || createEmptyGradeData(studentClassId)

      if(!currentStudentData) {
        return {
          ...prev,
          [studentClassId]: {
            studentClassId,
            score: field === 'score' ? value : '',
            comments: field === 'comments' ? value : ''
          }
        }
      }

      // Si existe, actualizar solo el campo específico
      return {
        ...prev,
        [studentClassId]: {
          ...currentStudentData,
          [field]: value
        }
      }
    })
  }

  const getSafeValue = (studentClassId: string, field: keyof GradeData): string => {
    const data = gradesData[studentClassId]
    return data?.[field] || ''
  }

  const handleSaveGrades = async () => {
    if(!currentUser || !assignmentDetails) return

    setIsSaving(true)
    try{
      const gradesToSave = Object.values(gradesData).filter(gradeData => gradeData.score.trim() !== '')

      if(gradesToSave.length === 0) {
        toast.info('No hay calificaciones para guardar')
        return
      }

      const promises = gradesToSave.map(async (gradeData) => {
        const score = parseFloat(gradeData.score)
        if(isNaN(score)) {
          console.warn('Calificación invalida')
          toast.warning(`Calificación invalida para estudiante: ${gradeData.score}`)
          return  
        }

        if (score > assignmentDetails.assignment.maxScore) {
          toast.error(`La calificación ${score} excede el máximo permitido (${assignmentDetails.assignment.maxScore})`)
          return
        }

        await upsertGrade({
          studentClassId: gradeData.studentClassId as Id<'studentClass'>,
          assignmentId: assignmentDetails.assignment._id,
          score: score,
          comments: gradeData.comments,
          registeredById: currentUser._id
        })
      })

      const result = await Promise.all(promises)
      const successfulSeves = result.filter(result => result !== undefined).length
      toast.success(`${successfulSeves} calificación(es) guardada(s) correctamente`)
      close(false) // Cerrar el dialog despies de guardar
    } catch (error){
      console.error('Error al guaradar las calificaciones: ',error)
      toast.error('Error al guardar las calificaciones')
    } finally {
      setIsSaving(false)
    }
  }

  const getSubmissionStatus = (studentClassId: Id<'studentClass'>) => {
    const isSubmitted = assignmentDetails?.submittedStudents.some(
      student => student.studentClassId === studentClassId
    )
    return isSubmitted ? 'Entregado' : 'Pendiente'
  }

  return (
    <>
      <Dialog open={open} onOpenChange={close}>
        <DialogContent className="max-w-full max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Calificaciones: {assignmentDetails?.assignment.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg text-sm">
              <div>
                <span className="font-medium">Clase:</span>
                <p>{assignmentDetails?.classCatalog.name}</p>
              </div>
              <div>
                <span className="font-medium">Puntuación maxima:</span>
                <p>{assignmentDetails?.assignment.maxScore}</p>
              </div>
              <div>
                <span className="font-medium">Progreso:</span>
                <p>{assignmentDetails?.submittedCount}/{assignmentDetails?.totalStudents} entregados</p>
              </div>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">Alumno</TableHead>
                <TableHead className="w-1/3">Estado</TableHead>
                <TableHead className="w-1/4">Calificación</TableHead>
                <TableHead className="w-2/5">Comentarios</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students?.map((student) => {
                const existingGrade = getGrade(student._id)
                const status = getSubmissionStatus(student._id)

                const currentScore = getSafeValue(student._id, 'score')
                const currentComments = getSafeValue(student._id, 'comments')

                return (
                  <TableRow
                    key={student._id}
                  >
                    <TableCell>
                      <div className="font-medium">
                        {student.student?.name} {student.student?.lastName || ''} 
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {student.student?.enrollment}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        status === 'Entregado'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                      }`}>
                        {status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={assignmentDetails?.assignment.maxScore}
                          autoFocus
                          placeholder="0"
                          value={currentScore}
                          onChange={(e) => handleGradeChange(student._id, 'score', e.target.value)}
                          className="w-20"
                        />
                      </div>
                      {existingGrade !== undefined && (
                        <div className="text-xs text-muted-foreground">
                          Actual: {existingGrade}
                        </div>
                      )}
                    </TableCell>
                    <TableCell
                    >
                      <Textarea
                        placeholder="Comentario sobre la entrega"
                        rows={2}
                        value={currentComments || ''}
                        onChange={(e) => handleGradeChange(student._id, 'comments', e.target.value)}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {students?.length || 0} estudiante{students?.length !== 1 ? 's' : ''} en esta clase
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveGrades}
                disabled={isSaving}
                className="px-6"
              >
                {isSaving ? 'Guardando...' : 'Guardar Calificaciones'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}