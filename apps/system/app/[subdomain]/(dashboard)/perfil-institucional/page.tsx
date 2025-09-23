"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Edit, GraduationCap, Loader2, Save, X } from "@repo/ui/icons";

// CAMBIO: Importamos el nuevo hook del store y la api de Clerk para el usuario
import { useCurrentSchool } from "stores/userSchoolsStore";
import { useUser } from "@clerk/nextjs";
import { useUserWithConvex } from "stores/userStore";

// CAMBIO: Importamos la mutación y la api desde la nueva ruta
import { useMutation } from "convex/react";
import { api } from "@repo/convex/convex/_generated/api";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { toast } from "sonner";

// Tipo para los datos del formulario
type SchoolFormData = {
  name: string;
  shortName: string;
  cctCode: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  imgUrl: string;
};

export default function ConfiguracionPage() {
  const [isEditing, setIsEditing] = useState(false);

  const { user: clerkUser } = useUser();
  // Obtenemos el usuario de Clerk para pasarlo al hook
  const { currentUser } = useUserWithConvex(clerkUser?.id);

  // CAMBIO: Usamos el hook centralizado del store para obtener los datos
  const { currentSchool, isLoading, error } = useCurrentSchool(
    currentUser?._id as Id<"user">
  );

  const [isSaving, setIsSaving] = useState(false);

  // CAMBIO: Usamos la ruta correcta para la mutación
  const updateSchool = useMutation(api.functions.schools.updateSchoolDetails);

  // Estado para manejar los datos del formulario
  const [editData, setEditData] = useState<Partial<SchoolFormData>>({});

  // Cuando los datos del store cargan, actualizamos el estado del formulario
  useEffect(() => {
    if (currentSchool) {
      setEditData(currentSchool.school);
    }
  }, [currentSchool]);

  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSave = async () => {
    if (!currentSchool || !clerkUser) return;

    setIsSaving(true);

    try {
      await updateSchool({
        clerkId: clerkUser.id,
        schoolId: currentSchool.school._id,
        name: editData.name,
        shortName: editData.shortName,
        cctCode: editData.cctCode,
        address: editData.address,
        phone: editData.phone,
        email: editData.email,
        description: editData.description,
        imgUrl: editData.imgUrl,
      });
      setIsEditing(false);
    } catch (err) {
      toast.error("Error al guardar: " + err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (currentSchool) {
      setEditData(currentSchool.school);
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Manejo de error centralizado desde el hook
  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!currentSchool) {
    return <div>No se encontró la escuela.</div>;
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-500/10 via-gray-500/5 to-background border">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,gray)]" />
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-500/10 rounded-xl border">
                <GraduationCap className="h-8 w-8 text-gray-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Configuración de la Institución
                </h1>
                <p className="text-muted-foreground">
                  Gestión de la información principal de la escuela.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    <X className="w-4 h-4" /> Cancelar
                  </Button>
                  <Button
                    size="lg"
                    className="gap-2"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}{" "}
                    Guardar Cambios
                  </Button>
                </>
              ) : (
                <Button
                  size="lg"
                  className="gap-2"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="w-4 h-4" /> Editar Información
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card con la información */}
      <Card>
        <CardHeader>
          <CardTitle>Información General</CardTitle>
        </CardHeader>

        <CardContent className="p-6 grid md:grid-cols-3 gap-10">
          {/* Columna 1: Imagen */}
          <div className="col-span-1 space-y-4">
            <FormField
              label="URL del Logo"
              name="imgUrl"
              value={editData.imgUrl || ""}
              isEditing={isEditing}
              onChange={handleTextChange}
            />
            <div className="w-full flex">
              <div className="relative aspect-square max-w-full w-full  rounded-2xl shadow-lg overflow-hidden">
                {editData.imgUrl && (
                  <Image
                    src={editData.imgUrl}
                    alt="Logo de la escuela" 
                    fill
                    className="object-cover"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Columna 2 */}
          <div className="col-span-1 space-y-4 ">
            <FormField
              label="Nombre"
              name="name"
              value={editData.name || ""}
              isEditing={isEditing}
              onChange={handleTextChange}
            />
            <FormField
              label="Nombre Corto"
              name="shortName"
              value={editData.shortName || ""}
              isEditing={isEditing}
              onChange={handleTextChange}
            />
            <FormField
              label="Código CCT"
              name="cctCode"
              value={editData.cctCode || ""}
              isEditing={isEditing}
              onChange={handleTextChange}
            />
            <FormField
              label="Dirección"
              name="address"
              value={editData.address || ""}
              isEditing={isEditing}
              onChange={handleTextChange}
            />
          </div>

          {/* Columna 3 */}
          <div className="col-span-1 space-y-4">
            <FormField
              label="Teléfono"
              name="phone"
              value={editData.phone || ""}
              isEditing={isEditing}
              onChange={handleTextChange}
            />
            <FormField
              label="Email"
              name="email"
              value={editData.email || ""}
              isEditing={isEditing}
              onChange={handleTextChange}
            />
            <FormField
              label="Descripción"
              name="description"
              value={editData.description || ""}
              isEditing={isEditing}
              onChange={handleTextChange}
              type="textarea"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FormField({
  label,
  name,
  value,
  isEditing,
  onChange,
  type = "input",
}: {
  label: string;
  name: string;
  value: string;
  isEditing: boolean;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  type?: "input" | "textarea";
}) {
  const commonProps = {
    id: name,
    name,
    value,
    onChange,
    className: "text-base",
  };
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
      </Label>
      {isEditing ? (
        type === "textarea" ? (
          <Textarea {...commonProps} rows={4} />
        ) : (
          <Input {...commonProps} />
        )
      ) : (
        <p
          className={`text-base text-muted-foreground min-h-10 flex items-center ${type === "textarea" && "whitespace-pre-wrap"}`}
        >
          {value}
        </p>
      )}
    </div>
  );
}
