// components/student-form.tsx
"use client";

import { useState } from "react";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
import { Label } from "@repo/ui/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import { useQuery } from "convex/react";
import { api } from "@repo/convex/convex/_generated/api";
import { Id, Doc } from "@repo/convex/convex/_generated/dataModel";
// import { Upload, X } from "@repo/ui/icons"

// Tipos de datos
type Student = Doc<"student">;

// Nuevo tipo para los datos de CREACIÓN de un estudiante (campos obligatorios)
type StudentCreate = {
  name: string;
  lastName?: string;
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

// **NUEVO TIPO para el estado interno del formulario**
// Permite que los campos de ID sean `null` o `undefined`
type FormState = {
  name: string;
  lastName?: string | null;
  enrollment: string;
  groupId: Id<"group"> | null;
  tutorId: Id<"user"> | null;
  status: "active" | "inactive" | string;
  birthDate: number | null;
  admissionDate: number | null;
  imgUrl?: string | null;
};

// Datos de prueba temporales para tutores
const mockTutors = [
  { _id: "66e77b6326e06b97b0a7b454" as Id<"user">, name: "Ms. Smith" },
  { _id: "66e77b6326e06b97b0a7b455" as Id<"user">, name: "Mr. Davis" },
  { _id: "66e77b6326e06b97b0a7b456" as Id<"user">, name: "Ms. Wilson" },
];

interface StudentFormProps {
  student: Student | null;
  schoolId: Id<"school">;
  onSave: (data: StudentCreate | StudentPatch) => void;
  onCancel: () => void;
}

// Función auxiliar para inicializar el estado del formulario
const initialFormData = (student: Student | null): FormState => {
  if (student) {
    // Caso de edición: devuelve los datos existentes del estudiante.
    const { ...patchData } = student;
    return {
      ...patchData,
      // `null` para los campos que no existen
      lastName: patchData.lastName || null,
      birthDate: patchData.birthDate || null,
      admissionDate: patchData.admissionDate || null,
      imgUrl: patchData.imgUrl || null,
    };
  }
  // Caso de creación: devuelve valores por defecto.
  return {
    name: "",
    lastName: null,
    enrollment: "",
    groupId: null,
    tutorId: null,
    status: "active",
    birthDate: null,
    admissionDate: null,
    imgUrl: null,
  };
};

export function StudentForm({
  student,
  schoolId,
  onSave,
  onCancel,
}: StudentFormProps) {
  // Inicializamos el estado usando el nuevo tipo `FormState`.
  const [formData, setFormData] = useState<FormState>(() =>
    initialFormData(student)
  );

  // Obtener los datos de grupos desde Convex
  const groups = useQuery(api.functions.group.getAllGroupsBySchool, {
    schoolId,
  });

  // Usamos los datos de prueba de tutores
  const tutors = mockTutors;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    // Convertimos de string a Id de Convex
    const convexId = value as Id<"group"> | Id<"user">;
    setFormData((prevData) => ({ ...prevData, [id]: convexId }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (student) {
      // Caso de edición: convertimos a StudentPatch
      const patchData: StudentPatch = {};

      // Asignamos solo los campos que tienen un valor
      if (formData.name) patchData.name = formData.name;
      if (formData.lastName) patchData.lastName = formData.lastName;
      if (formData.enrollment) patchData.enrollment = formData.enrollment;
      if (formData.groupId) patchData.groupId = formData.groupId;
      if (formData.tutorId) patchData.tutorId = formData.tutorId;
      if (formData.status === "active" || formData.status === "inactive") {
        patchData.status = formData.status;
      }
      if (formData.birthDate) patchData.birthDate = formData.birthDate;
      if (formData.admissionDate)
        patchData.admissionDate = formData.admissionDate;
      if (formData.imgUrl) patchData.imgUrl = formData.imgUrl;

      onSave(patchData);
    } else {
      // Caso de creación: convertimos a StudentCreate
      // Validamos que los campos obligatorios no sean null antes de enviar
      if (formData.groupId && formData.tutorId) {
        const createData: StudentCreate = {
          name: formData.name,
          enrollment: formData.enrollment,
          groupId: formData.groupId,
          tutorId: formData.tutorId,
          status: formData.status as "active" | "inactive",
          birthDate: formData.birthDate || 0,
          admissionDate: formData.admissionDate || 0,
          lastName: formData.lastName || undefined,
          imgUrl: formData.imgUrl || undefined,
        };
        onSave(createData);
      } else {
        console.error(
          "Los campos de grupo y tutor son obligatorios para crear un estudiante."
        );
      }
    }
  };

  if (groups === undefined || tutors === undefined) {
    return <div>Cargando formulario...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {student ? "Editar Estudiante" : "Agregar Estudiante"}
        </CardTitle>
        <CardDescription>
          {student
            ? "Actualizar información del estudiante."
            : "Complete los datos del nuevo estudiante"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input
                id="lastName"
                value={formData.lastName || ""}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enrollment">Matricula</Label>
              <Input
                id="enrollment"
                value={formData.enrollment || ""}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Fecha Nacimiento</Label>
              <Input
                id="birthDate"
                type="date"
                value={
                  formData.birthDate
                    ? new Date(formData.birthDate).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    birthDate: new Date(e.target.value).getTime(),
                  }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="groupId">Grupo</Label>
              <Select
                value={formData.groupId || ""}
                onValueChange={(value) => handleSelectChange("groupId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Asignar Grupo" />
                </SelectTrigger>
                <SelectContent>
                  {groups?.map((group) => (
                    <SelectItem key={group._id} value={group._id}>
                      {group.grade} {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tutorId">Tutor</Label>
              <Select
                value={formData.tutorId || ""}
                onValueChange={(value) => handleSelectChange("tutorId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Asignar Tutor" />
                </SelectTrigger>
                <SelectContent>
                  {tutors.map((tutor) => (
                    <SelectItem key={tutor._id} value={tutor._id}>
                      {tutor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Estatus</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: value as "active" | "inactive",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar Estatus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* foto
          <div className="space-y-2">
            <Label>Profile Photo (Optional)</Label>
            <div className="flex items-center gap-4">
               (
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
              )
              <div>
                <Input type="file" accept="image/*"  className="hidden" id="photo-upload" />
                <Label htmlFor="photo-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" asChild>
                    <span>Choose Photo</span>
                  </Button>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">Upload a profile photo (optional)</p>
              </div>
            </div>
          </div>
          */}

          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {student ? "Guardar Cambios" : "Agregar Estudiante"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
