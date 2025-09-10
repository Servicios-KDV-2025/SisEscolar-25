import { useUser } from "@clerk/nextjs"
import { api } from "@repo/convex/convex/_generated/api"
import { Id } from "@repo/convex/convex/_generated/dataModel"
import { useQuery } from "convex/react"
import { useCurrentSchool } from "stores/userSchoolsStore"
import { useUserWithConvex } from "stores/userStore"

export default function AttendanceManager() {
  const { user: clerkUser } = useUser()
  const { currentUser } = useUserWithConvex(clerkUser?.id)
  const {currentSchool, isLoading} = useCurrentSchool(currentUser?._id)

  const studentClasses = useQuery(
    api.functions.studentsClasses.getStudentClassesBySchool,
    currentSchool ? { schoolId: currentSchool.school._id as Id<'school'> } : 'skip'
  )

  const classCatalog = studentClasses?.[0]?.classCatalog

  if(isLoading) {
    return <div className="text-center py-10">Cargando escuela...</div>
  }

  return(
    <div className="space-y-6">
      <div className="flex flex-col sm:fle-row gap-4 justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Registro de asistencia</h3>
          <p className="text-muted-foreground">{classCatalog?.name}</p>
        </div>
      </div>
      {studentClasses ? (
        studentClasses.map((sc) => (
          <div key={sc._id} className="p-4 mb-4 border rounded">
            <h2 className="text-xl font-semibold mb-2">
              {sc.student.name} {sc.student.lastName} ({sc.student.enrollment})
            </h2>
          </div>
        ))         
      ) : (
        <div>Loading Student Classes...</div>
      )}
    </div>
  )
}