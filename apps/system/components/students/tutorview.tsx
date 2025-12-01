import { GraduationCap, Users, Award } from "lucide-react"
import { Card, CardContent } from "@repo/ui/components/shadcn/card"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/shadcn/avatar"
import { Id } from "@repo/convex/convex/_generated/dataModel"

// Tipos para los datos - usando tipos más flexibles para coincidir con los datos reales
interface Group {
  _id: string | Id<"group">;
  name: string;
  grade: string;
}

interface Tutor {
  _id: string | Id<"user">;
  name: string;
  lastName?: string;
  email?: string;
}

interface SchoolCycle {
  _id: string | Id<"schoolCycle">;
  name: string;
  startDate?: number;
  endDate?: number;
  status?: string;
}

interface Student {
  _id: Id<"student"> | string;
  _creationTime?: number;
  name: string;
  lastName?: string;
  enrollment: string;
  groupId: Id<"group"> | string;
  schoolCycleId?: Id<"schoolCycle"> | string;
  tutorId: Id<"user"> | string;
  status: "active" | "inactive";
  scholarshipType: "active" | "inactive";
  scholarshipPercentage?: number;
  imgUrl?: string;
  birthDate?: number;
  admissionDate?: number;
  createdAt?: number;
  updatedAt?: number;
  credit?: number;
}

interface TutorViewProps {
  students: Student[];
  groups: Group[];
  schoolCycles: SchoolCycle[];
  tutors: Tutor[];
}

export default function TutorView({ students, groups, schoolCycles, tutors }: TutorViewProps) {

  // Función para obtener información del grupo
  const getGroupInfo = (groupId: string) => {
    const group = groups.find((g) => g._id === groupId);
    return group ? `${group.grade} - ${group.name}` : "No asignado";
  };

  // Función para obtener información del ciclo escolar
  const getSchoolCycleInfo = (schoolCycleId?: string) => {
    if (!schoolCycleId) return "No asignado";
    const cycle = schoolCycles.find((c) => c._id === schoolCycleId);
    return cycle ? cycle.name : "No asignado";
  };

  // Función para obtener información del tutor
  const getTutorInfo = (tutorId: string) => {
    const tutor = tutors.find((t) => t._id === tutorId);
    return tutor ? `${tutor.name} ${tutor.lastName || ''}`.trim() : "No asignado";
  };

  // Función para obtener información de la beca
  const getScholarshipInfo = (scholarshipType: string, scholarshipPercentage?: number) => {
    if (scholarshipType === "inactive") {
      return "Sin Beca";
    } else if (scholarshipType === "active" && scholarshipPercentage) {
      return `Beca con ${scholarshipPercentage}%`;
    } else {
      return "Beca sin porcentaje";
    }
  };

  // Función para obtener las iniciales
  const getInitials = (name: string, lastName?: string) => {
    const first = name.charAt(0).toUpperCase();
    const last = lastName ? lastName.charAt(0).toUpperCase() : "";
    return first + last;
  };

  // Mapear los estudiantes al formato que necesita el componente
  const hijos = students.map((student) => ({
    nombre: student.name,
    apellidos: student.lastName || "",
    matricula: student.enrollment,
    grupo: getGroupInfo(student.groupId),
    cicloEscolar: getSchoolCycleInfo(student.schoolCycleId),
    estado: student.status === "active" ? "Activo" : "Inactivo",
    tutor: getTutorInfo(student.tutorId),
    beca: getScholarshipInfo(student.scholarshipType, student.scholarshipPercentage),
    iniciales: getInitials(student.name, student.lastName),
    imgUrl: student.imgUrl,
  }))

  return (
    <div>
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hijos.map((hijo) => (
            <Card
              key={hijo.matricula}
              className="overflow-hidden bg-white border border-gray-200 hover:shadow-md transition-all duration-300 p-0"
            >
              <CardContent className="p-0">
                <div className=" bg-gradient-to-br from-indigo-500/50 via-indigo-500/20 to-background border-b border-gray-200 p-6">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-20 w-20 border-4 border-gray-200 mb-4">
                      <AvatarImage src={hijo.imgUrl} alt={`${hijo.nombre} ${hijo.apellidos}`} />
                      <AvatarFallback className="bg-gray-300 text-gray-800 text-2xl font-bold">
                        {hijo.iniciales}
                      </AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      {hijo.nombre} {hijo.apellidos}
                    </h2>
                    <div className="flex items-center gap-2 text-gray-600">
                      <GraduationCap className="h-4 w-4" />
                      <span className="text-sm">{hijo.matricula}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex gap-2 justify-center">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {hijo.estado}
                    </Badge>
                    <Badge
                      variant={hijo.beca.includes("con") ? "default" : "secondary"}
                      className={hijo.beca.includes("con") ? "bg-amber-500" : "bg-gray-100 text-gray-700"}
                    >
                      {hijo.beca}
                    </Badge>
                  </div>

                  <div className="space-y-3  p-4 ">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-200 rounded-md mt-0.5">
                        <Users className="h-4 w-4 text-gray-700" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-0.5">Grupo</p>
                        <p className="font-semibold text-gray-900">{hijo.grupo}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-200 rounded-md mt-0.5">
                        <Award className="h-4 w-4 text-gray-700" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-0.5">Ciclo Escolar</p>
                        <p className="font-semibold text-gray-900">{hijo.cicloEscolar}</p>
                      </div>
                    </div>

                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {hijos.length === 0 ? (
          <div className="mt-8 text-center bg-white rounded-lg p-6 border border-gray-200">
            <p className="text-sm text-gray-600">
              No tienes hijos asignados actualmente.
            </p>
          </div>
        ) : (
          <div className="mt-8 text-center p-6 ">
            <p className="text-sm text-gray-600">
              ¿Necesitas actualizar información de tus hijos? Contacta con la administración escolar
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
