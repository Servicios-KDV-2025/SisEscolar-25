// app/page.tsx
"use client"

import { useState } from "react"
import { StudentDashboard } from "./student-dashboard"
import { StudentForm } from "./student-form"
import { ConfirmationModal } from "./confirmation-modal"
import { useQuery, useMutation } from "convex/react"
import { api } from "@repo/convex/convex/_generated/api"
import { Id, Doc } from "@repo/convex/convex/_generated/dataModel"
import { useCurrentSchool } from "../../../../stores/userSchoolsStore";
import { useUser } from "@clerk/nextjs";
import { useUserWithConvex } from "../../../../stores/userStore";

// El tipo de estudiante ahora se importa directamente de Convex
type Student = Doc<"student">;

// Nuevo tipo para los datos de CREACIÓN de un estudiante (campos obligatorios)
type StudentCreate = {
  name: string;
  lastName?: string; // Sigue siendo opcional si no lo requieres
  enrollment: string;
  groupId: Id<"group">;
  tutorId: Id<"user">;
  status: "active" | "inactive";
  birthDate: number;
  admissionDate: number;
  imgUrl?: string;
};

// Tipo para la ACTUALIZACIÓN de un estudiante (todos los campos opcionales)
type StudentPatch = {
  name?: string;
  lastName?: string;
  enrollment?: string;
  groupId?: Id<"group">;
  tutorId?: Id<"user">;
  status?: "active" | "inactive";
  birthDate?: number;
  admissionDate?: number;
  imgUrl?: string;
};

export default function Home() {
  const [showForm, setShowForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [studentToDeactivate, setStudentToDeactivate] = useState<Student | null>(null)

  const { user: clerkUser } = useUser();
    const { currentUser } = useUserWithConvex(clerkUser?.id);
    
    // Get current school information using the subdomain
    const {
      currentSchool,
      isLoading: schoolLoading,
    } = useCurrentSchool(currentUser?._id);

  const students = useQuery(
    api.functions.student.listStudentsBySchool,
    currentSchool ? { schoolId: currentSchool.school._id } : "skip"
  );
  
  const createStudent = useMutation(api.functions.student.createStudent);
  const updateStudent = useMutation(api.functions.student.updateStudent);
  const updateStudentStatus = useMutation(api.functions.student.updateStudentStatus);

  const handleAddStudent = () => {
    setEditingStudent(null)
    setShowForm(true)
  }

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student)
    setShowForm(true)
  }

  const handleDeactivateStudent = (student: Student) => {
    setStudentToDeactivate(student)
    setShowConfirmModal(true)
  }

  const handleSaveStudent = async (studentData: StudentCreate | StudentPatch) => {
    try {
      if (editingStudent) {
        await updateStudent({
          studentId: editingStudent._id,
          patch: studentData as StudentPatch,
        });
      } else {
        await createStudent({
          ...studentData as StudentCreate,
          schoolId: currentSchool!.school._id,
        });
      }
      setShowForm(false);
      setEditingStudent(null);
    } catch (error) {
      console.error("Error al guardar estudiante:", error);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (studentToDeactivate) {
      try {
        await updateStudentStatus({
          studentId: studentToDeactivate._id,
          status: "inactive",
        });
      } catch (error) {
        console.error("Error al desactivar estudiante:", error);
      }
    }
    setShowConfirmModal(false);
    setStudentToDeactivate(null);
  };

  // 3. Mueve la lógica de carga al final, después de todas las llamadas a los hooks.
  if (schoolLoading || students === undefined) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Sistema de Gestión de Estudiantes</h1>
          <p className="text-muted-foreground">Gestiona la información, matrícula y expedientes de los estudiantes</p>
        </div>

        {showForm ? (
          <StudentForm
            student={editingStudent}
            schoolId={currentSchool!.school._id}
            onSave={handleSaveStudent}
            onCancel={() => {
              setShowForm(false)
              setEditingStudent(null)
            }}
          />
        ) : (
          <StudentDashboard
            students={students}
            onAddStudent={handleAddStudent}
            onEditStudent={handleEditStudent}
            onDeactivateStudent={handleDeactivateStudent}
          />
        )}

        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmDeactivate}
          title="Desactivar Estudiante"
          description={`¿Estás seguro de que quieres desactivar a ${studentToDeactivate?.name} ${studentToDeactivate?.lastName}? Esto lo marcará como inactivo.`}
        />
      </div>
    </div>
  )
}