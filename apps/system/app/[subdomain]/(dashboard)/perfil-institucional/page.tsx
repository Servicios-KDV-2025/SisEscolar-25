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
import { Edit, GraduationCap, Loader2, Save, School, X } from "@repo/ui/icons";
import { useUser } from "@clerk/nextjs";
import { useCurrentSchool } from "stores/userSchoolsStore";
import { useMutation } from "convex/react";
import { api } from "@repo/convex/convex/_generated/api";
import { toast } from "sonner";
import { useForm, UseFormRegister, FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import {
  schoolValidationSchema,
  SchoolValidationSchema,
} from "schema/perfilIns";
import { useUserWithConvex } from "stores/userStore";
import { usePermissions } from "hooks/usePermissions";

export default function ConfiguracionPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user: clerkUser } = useUser();

  const { currentUser } = useUserWithConvex(clerkUser?.id);

  const { currentSchool, isLoading, error } = useCurrentSchool(
    currentUser?._id as Id<"user">
  );
  const updateSchool = useMutation(api.functions.schools.updateSchoolDetails);

  const {
    canUpdatePerfilInstitucional,
    isLoading: permissionsLoading
  } = usePermissions(currentSchool?.school._id);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<SchoolValidationSchema>({
    resolver: zodResolver(schoolValidationSchema),
  });

  const imgUrlValue = watch("imgUrl");

  useEffect(() => {
    if (currentSchool) {
      reset(currentSchool.school);
    }
  }, [currentSchool, reset]);

  const handleSave = async (data: SchoolValidationSchema) => {
    if (!currentSchool || !clerkUser) return;
    setIsSaving(true);
    try {
      await updateSchool({
        clerkId: clerkUser.id,
        schoolId: currentSchool.school._id,
        ...data,
      });
      setIsEditing(false);
      toast.success("Perfil de la institución actualizado con éxito.");
    } catch (err) {
      toast.error("Error al guardar los cambios." + err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (currentSchool) {
      reset(currentSchool.school);
    }
    setIsEditing(false);
  };


  if (isLoading || permissionsLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return <div>Error al cargar los datos: {error}</div>;
  }

  if (!currentSchool) {
    return <div>No se encontró la escuela o no tienes acceso.</div>;
  }

  return (
    <div className="space-y-8 p-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-500/10 via-gray-500/5 to-background border">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,gray)]" />
        <div className="relative max-md:p-6 lg:p-8">
          <div className="flex items-center lg:flex-row lg:items-center lg:justify-between  justify-between max-md:flex-col gap-6 max-md:h-full">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-500/10 rounded-xl border">
                <GraduationCap className="h-8 w-8 text-gray-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Perfil Institucional
                </h1>
                <p className="text-muted-foreground">
                  Gestión de la información principal de la escuela.
                </p>
              </div>
            </div>
        
              {isEditing ? (
                <>
                <div className="flex max-md:flex-col gap-3 max-md:h-24 max-md:w-full">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 gap-2 max-md:text-base "
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    <X className="w-4 h-4" /> Cancelar
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1 gap-2 max-md:text-base"
                    onClick={handleSubmit(handleSave)}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}{" "}
                    Guardar Cambios
                  </Button>
                  </div>
                </>
              ) : (
                canUpdatePerfilInstitucional && (
                  <div className="flex max-md:w-full">
                  <Button
                    size="lg"
                    className="gap-2 flex-1"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="w-4 h-4" /> Editar Información
                  </Button>
                  </div>
                )
              )}
            
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información General</CardTitle>
        </CardHeader>
        <CardContent className="p-6 grid md:grid-cols-3 gap-8">
          <div className="col-span-1 space-y-2">
            <Label>Logo Institucional</Label>
            <div className="relative aspect-square max-w-[220px] rounded-2xl shadow-lg overflow-hidden">
              {imgUrlValue != " " && imgUrlValue ? (
                <Image
                  src={imgUrlValue!}
                  alt="Logo de la escuela"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="relative aspect-square max-w-[220px] rounded-2xl shadow-lg overflow-hidden flex items-center justify-center">
                  <School className="h-20 w-20" />
                </div>
              )}
            </div>
            {isEditing && (
              <FormField
                label="URL del Logo"
                name="imgUrl"
                isEditing={isEditing}
                register={register}
                error={errors.imgUrl}
                readOnlyValue={currentSchool?.school?.name ?? ""}
              />
            )}
          </div>
          <div className="col-span-1 space-y-4">
            <FormField
              label="Nombre"
              name="name"
              isEditing={isEditing}
              register={register}
              error={errors.name}
              readOnlyValue={currentSchool.school.name}
            />
            <FormField
              label="Nombre Corto"
              name="shortName"
              isEditing={isEditing}
              register={register}
              error={errors.shortName}
              readOnlyValue={currentSchool.school.shortName}
            />
            <FormField
              label="Código CCT"
              name="cctCode"
              isEditing={isEditing}
              register={register}
              error={errors.cctCode}
              readOnlyValue={currentSchool.school.cctCode}
            />
            <FormField
              label="Dirección"
              name="address"
              isEditing={isEditing}
              register={register}
              error={errors.address}
              readOnlyValue={currentSchool.school.address}
            />
          </div>
          <div className="col-span-1 space-y-4">
            <FormField
              label="Teléfono"
              name="phone"
              isEditing={isEditing}
              register={register}
              error={errors.phone}
              readOnlyValue={currentSchool.school.phone}
            />
            <FormField
              label="Email"
              name="email"
              isEditing={isEditing}
              register={register}
              error={errors.email}
              readOnlyValue={currentSchool.school.email}
            />
            <FormField
              label="Descripción"
              name="description"
              isEditing={isEditing}
              register={register}
              error={errors.description}
              readOnlyValue={currentSchool.school.description}
              type="textarea"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// El componente FormField permanece igual
function FormField({
  label,
  name,
  isEditing,
  register,
  error,
  readOnlyValue,
  type = "input",
}: {
  label: string;
  name: keyof SchoolValidationSchema;
  isEditing: boolean;
  register: UseFormRegister<SchoolValidationSchema>;
  error?: FieldError;
  readOnlyValue: string;
  type?: "input" | "textarea";
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
      </Label>
      {isEditing ? (
        type === "textarea" ? (
          <Textarea id={name} {...register(name)} rows={4} />
        ) : (
          <Input id={name} {...register(name)} />
        )
      ) : (
        <p
          className={`text-base text-muted-foreground min-h-10 flex items-center ${type === "textarea" && "whitespace-pre-wrap"}`}
        >
          {readOnlyValue}
        </p>
      )}
      {error && <p className="text-sm text-red-500 mt-1">{error.message}</p>}
    </div>
  );
}