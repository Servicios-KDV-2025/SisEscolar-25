import { useUser } from "@clerk/nextjs";
import { api } from "@repo/convex/convex/_generated/api";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { Button } from "@repo/ui/components/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@repo/ui/components/shadcn/dialog";
import { Input } from "@repo/ui/components/shadcn/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/shadcn/table";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/components/shadcn/tooltip";
import { MessageCircleDashed, MessageCircleMore } from "@repo/ui/icons";
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
  } | undefined
}

interface GradeData {
  studentClassId: Id<'studentClass'>
  score: string
  comments: string
}

interface EditState {
  score: boolean
  comments: boolean
}

interface CommentsModalState {
  isOpen: boolean
  studentClassId: Id<'studentClass'> | null
  studentName: string
  currentComments: string
}

const createEmptyEditState = (): EditState => ({
  score: false,
  comments: false
})
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

  const [editingState, setEditingState] = useState<Record<string, EditState>>({})

  const [commentsModal, setCommentModal] = useState<CommentsModalState>({
    isOpen: false,
    studentClassId: null,
    studentName: '',
    currentComments: ''
  })

  const students = useQuery(
    api.functions.student.getStudentWithClasses,
    assignmentDetails?.classCatalog._id && currentUser
      ? { 
          classCatalogId: assignmentDetails?.classCatalog._id as Id<"classCatalog">,
          canViewAll: true,
          teacherId: currentUser._id
        }
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
      const initialEditState: Record<string, EditState> = {}

      students.forEach((student) => {
        const existingGrade = grades.find(
          g => g.studentClassId === student._id
        )

        initialData[student._id] = {
          studentClassId: student._id,
          score: existingGrade?.score.toString() || '',
          comments: existingGrade?.comments || ''
        }

        initialEditState[student._id] = {
          score: false,
          comments: false
        }
      })

      setGradesData(initialData)
      setEditingState(initialEditState)
      setIsInitialized(true)
    }
  }, [open, students, grades, isInitialized])

  useEffect(() => {
    if(!open) {
      setIsInitialized(false)
      setGradesData({})
      setEditingState({})
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

  // Funcion para abrir el modal de comentarios
  const openCommentsModal = (studentClassId: Id<'studentClass'>, studentName: string, currentComments: string ) => {
    setCommentModal({
      isOpen: true,
      studentClassId,
      studentName,
      currentComments
    })
  }

  // Funcion para cerrar el modal
  const closeCommentsModal = () => {
    setCommentModal({
      isOpen: false,
      studentClassId: null,
      studentName: '',
      currentComments: ''
    })
  }

  // Función para guardar comentarios desde el modal
  const handleSaveComments = () => {
    if(commentsModal.studentClassId) {
      handleGradeChange(commentsModal.studentClassId, 'comments', commentsModal.currentComments)
    }
    closeCommentsModal()
  }

  // Función para activar el modo edición
  const startEditing = (studentClassId: Id<'studentClass'>, field: keyof EditState) => {
    setEditingState(prev => {
      const currentEditState = prev[studentClassId] || createEmptyEditState()

      return {
        ...prev,
        [studentClassId]: {
          ...currentEditState,
          [field]: true
        }
      }
    })
  }

  // Función para desactivar el modo edición
  const stopEditing = (studentClassId: Id<'studentClass'>, field: keyof EditState) => {
    setEditingState(prev => {
      const currentEditState = prev[studentClassId] || createEmptyEditState()

      return {
        ...prev,
        [studentClassId]: {
          ...currentEditState,
          [field]: false
        }
      }
    })
  }

  // Función para manejar el blur del input (cuando pierde el foco)
  const handleInputBlur = (studentClassId: Id<'studentClass'>, field: keyof EditState) => {
    stopEditing(studentClassId, field)
  }

  // Función para manejar la tecla Enter en el input
  const handleInputKeyDown = (studentClassId: Id<'studentClass'>, field: keyof EditState, e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      stopEditing(studentClassId, field)
    }
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
      const successfullSeves = result.filter(result => result !== undefined).length
      if(successfullSeves) {
        toast.success(`calificación(es) guardada(s) correctamente`)
      }
      
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

  // Funcion para cambiar el estado de la calificacion (texto o input)
  const renderScoreField = (studentClassId: Id<'studentClass'>, currentScore: string) => {
    const isEditing = editingState[studentClassId]?.score || false
    const existingGrade = getGrade(studentClassId)

    if(isEditing) {
      return(
        <div className="flex items-center ">
          <Input
            type="number"
            min={0}
            max={assignmentDetails?.assignment.maxScore}
            autoFocus
            placeholder="0"
            value={currentScore}
            onChange={(e) => handleGradeChange(studentClassId as Id<'studentClass'>, 'score', e.target.value)}
            onBlur={() => handleInputBlur(studentClassId, 'score')}
            onKeyDown={(e) => handleInputKeyDown(studentClassId, 'score', e)}
            className="w-20"
          />
        </div>
      )
    } else {
      return (
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => startEditing(studentClassId, 'score')}
        >
          <div className="min-w-[50px] px-3 py-2 border border-transparent rounded-md group-hover:border-gray-300 group-hover:bg-gray-50 transition-colors">
            <span className="">
              {currentScore || ' - '}
            </span>
            {existingGrade !== undefined && (
              <div className="text-xs text-muted-foreground">
                Actual: {existingGrade}
              </div>
            )}
          </div>
        </div>
      )
    }
  }

  // Funcion para cambiar el estado de los comentarios (texto o textarea)
  const renderComentsField = (studentClassId: Id<'studentClass'>, currentComments: string, studentName: string) => {
    return (
      <Tooltip>
        <TooltipTrigger>
          {currentComments ? (
            <MessageCircleMore
              onClick={() => openCommentsModal(studentClassId as Id<'studentClass'>, studentName, currentComments)}
              className="hover:text-gray-500"
            />
          ) : (
            <MessageCircleDashed
              onClick={() => openCommentsModal(studentClassId as Id<'studentClass'>, studentName, currentComments)}
              className="hover:text-gray-500"
            />
          )}
        </TooltipTrigger>
        <TooltipContent>
          {currentComments ? (
            <p>{currentComments}</p>
          ) : (
            <p>No hay comentarios</p>
          )}
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={close}>
        <DialogContent className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
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
                const status = getSubmissionStatus(student._id)

                const currentScore = getSafeValue(student._id, 'score')
                const currentComments = getSafeValue(student._id, 'comments')
                const studentName = `${student.student?.name} ${student.student?.lastName || ''}`.trim()

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
                      {renderScoreField(student._id, currentScore)}
                    </TableCell>
                    <TableCell>
                      {renderComentsField(student._id, currentComments, studentName)}
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

      {/* Modal para editar comentarios */}
      <Dialog open={commentsModal.isOpen} onOpenChange={closeCommentsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Comentarios para {commentsModal.studentName}</DialogTitle>
            <DialogDescription>Agregar o editar los comentarios para este estudiante</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Comentario sobre la entrega del estudiante"
              rows={5}
              value={commentsModal.currentComments}
              onChange={(e) => setCommentModal(prev => ({
                ...prev,
                currentComments: e.target.value
              }))}
              className="min-h-[150px] resize-y"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button onClick={handleSaveComments}>
              Guardar Comentarios
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}