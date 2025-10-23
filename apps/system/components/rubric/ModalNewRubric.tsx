import {  } from "@/types/classCatalog";
import { Term, ClassCatalog } from "@/types/rubric";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { CrudDialog } from "@repo/ui/components/dialog/crud-dialog";
import { rubricSchema } from "schema/rubric";
import { useGradeRubricStore } from "stores/gradeRubricStore";

interface RubricCrudDialogProps {
  isOpen: boolean
  operation: 'create' | 'edit' | 'view' | 'delete'
  data?: {
    _id: string
    name: string
    weight: number[]
    maxScore: number
    schoolCycle: string
    class: string
    term: string
  }
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  classes: ClassCatalog[]
  terms: Term[]
  selectedClassSchoolCycleName: string
}

export default function ModalNewRubric( {
  isOpen,
  operation,
  data,
  onOpenChange,
  onSubmit,
  onDelete,
  classes,
  terms,
  selectedClassSchoolCycleName
}: RubricCrudDialogProps) {
  const {
    formData,
    setFormData,
    getAvailableWeight,
    getValidationMessage,
    isNameDuplicate,
    getDuplicateInfo,
    canCreateRubric
  } = useGradeRubricStore()

  const shouldShowFromValidation = !!(formData.class && formData.term)
  const availableWeight = getAvailableWeight()
  const validationMessage = getValidationMessage()
  const nameDuplicate = isNameDuplicate(formData.name, data?._id as Id<'gradeRubric'>)
  const duplicateInfo = getDuplicateInfo(formData.name, data?._id as Id<'gradeRubric'>)

  const maxAllowed = (() => {
    if(operation === 'edit' && data) {
      if(shouldShowFromValidation && availableWeight !== null) {
        return Math.min(100, availableWeight)
      } else {
        return 100
      }
    }
    if(shouldShowFromValidation && availableWeight !== null) {
      return Math.min(100, availableWeight)
    }
    return 100
  })

  const handleClassChange = (value: string) => {
    setFormData({ class: value })
    const selectedClassData = classes.find(
      (clase) => clase._id === value
    )
    if(selectedClassData?.schoolCycle) {
      useGradeRubricStore.getState().setSelectedClassSchoolCycleName(
        selectedClassData.schoolCycle.name
      )
    }
  }

  const handleTermChange = (value: string) => {
    setFormData({ term: value})
  }

  return (
    <>
      {/* <CrudDialog
      >

      </CrudDialog> */}
    </>
  )
}