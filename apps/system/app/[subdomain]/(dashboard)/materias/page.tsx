"use client";

import { useUser } from "@clerk/nextjs";
import { SubjectCard } from "./SubjectCard"
import { useUserWithConvex } from "stores/userStore";
import { useCurrentSchool } from "stores/userSchoolsStore";
import { useSubject } from "stores/subjectStore";
import { CrudDialog, useCrudDialog } from "@repo/ui/components/dialog/crud-dialog";
import { subjectSchema } from "types/form/subjectSchema";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { Button } from "@repo/ui/components/shadcn/button";
import { Plus } from "@repo/ui/icons";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/shadcn/form";
import { Input } from "@repo/ui/components/shadcn/input";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select";
import { useState } from "react";

export default function SubjectPage() {
    const { user: clerkUser, isLoaded } = useUser();
    const { currentUser, isLoading: userLoading } = useUserWithConvex(clerkUser?.id);
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

    const {
        currentSchool,
        isLoading: schoolLoading,
        error: schoolError,
    } = useCurrentSchool(currentUser?._id);

    const isLoading = !isLoaded || userLoading || schoolLoading;

    const {
        subjects,
        isCreating: isCreatingSubject,
        isUpdating: isUpdatingSubject,
        isDeleting: isDeletingSubject,
        createError: createSubjectError,
        updateError: updateSubjectError,
        deleteError: deleteSubjectError,
        createSubject,
        updateSubject,
        deleteSubject,
        clearErrors: clearSubjectErrors,
    } = useSubject(currentSchool?.school._id);

    const {
        isOpen,
        operation,
        data,
        openCreate,
        openEdit,
        openView,
        openDelete,
        close,
    } = useCrudDialog(subjectSchema, {
        name: "",
        description: "",
        credits: 0,
        status: "",
    });

    const filteredSubjects = subjects.filter((subject) => {
        if (statusFilter === "all") return true
        return subject.status === statusFilter
    });

    const hasSubjects = filteredSubjects.length > 0

    const handleSubmit = async (values: Record<string, unknown>) => {
        if (!currentSchool?.school._id || !currentUser?._id) {
            return;
        }

        const baseData = {
            schoolId: currentSchool.school._id,
            name: values.name as string,
            description: values.description as string | undefined,
            credits: values.credits as number | undefined,
            status: values.status as "active" | "inactive"
        };

        if (operation === "create") {
            await createSubject(baseData);
        } else if (operation === "edit" && data?._id) {
            await updateSubject({
                ...baseData,
                _id: data._id as Id<"subject">,
                updatedAt: new Date().getTime(),
                updatedBy: currentUser._id
            });
        }
    };

    const handleDelete = async (id: string) => {
        await deleteSubject(id);
        // try {
        // toast.success("Eliminado correctamente");
        // } catch (error) {
        // toast.error("Error al eliminar materia", {
        //     description: (error as Error).message,
        // });
        //     throw error;
        // }
    };

    if (isLoading || (currentUser && !currentSchool && !schoolError)) return (
        <div className="space-y-8 p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="space-y-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground">Cargando información de las materias...</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-[90%] mx-auto">
            <h1 className="text-3xl font-bold mb-6">Materias</h1>
            <p className="text-muted-foreground">
                Esta página muestra el listado de materias académicas registradas en{" "}
                {currentSchool?.school?.name}. Cada tarjeta representa una materia con su nombre, descripción, número de
                créditos y estado actual (activa o inactiva). Desde aquí puedes
                visualizar, editar o eliminar materias existentes, así como agregar
                nuevas según sea necesario para el plan de estudios.
            </p>
            <div className="flex justify-end items-center mb-6 w-[98%]">
                <Button
                    onClick={openCreate}
                    disabled={isCreatingSubject}
                    className="flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Nueva Materia
                </Button>
            </div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Lista de Materias</h2>
                <div className="flex gap-2">
                    <Button
                        variant={statusFilter === "all" ? "default" : "outline"}
                        onClick={() => setStatusFilter("all")}
                        className="text-sm font-bold"
                    >
                        Todas las materias ({subjects.length})
                    </Button>
                    <Button
                        variant={statusFilter === "active" ? "default" : "outline"}
                        onClick={() => setStatusFilter("active")}
                        className={`text-sm font-bold ${statusFilter === "active" ? "bg-green-100 text-green-800 hover:bg-green-300" : ""}`}
                    >
                        Activas ({subjects.filter((s) => s.status === "active").length})
                    </Button>
                    <Button
                        variant={statusFilter === "inactive" ? "default" : "outline"}
                        onClick={() => setStatusFilter("inactive")}
                        className={`text-sm font-bold ${statusFilter === "inactive" ? "bg-red-100 text-red-800 hover:bg-red-300" : ""}`}
                    >
                        Inactivas ({subjects.filter((s) => s.status === "inactive").length})
                    </Button>
                </div>
            </div>

            {/* Mostrar errores del store de materias */}
            {(createSubjectError || updateSubjectError || deleteSubjectError) && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="text-sm text-red-600">
                        {createSubjectError && (
                            <div>Error al crear materia: {createSubjectError}</div>
                        )}
                        {updateSubjectError && (
                            <div>Error al actualizar materia: {updateSubjectError}</div>
                        )}
                        {deleteSubjectError && (
                            <div>Error al eliminar materia: {deleteSubjectError}</div>
                        )}
                    </div>
                    <button
                        onClick={clearSubjectErrors}
                        className="text-xs text-blue-500 underline mt-1"
                    >
                        Limpiar errores
                    </button>
                </div>
            )}
            {hasSubjects
                ?
                (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-9">
                        {filteredSubjects.map((subject) => (
                            <SubjectCard
                                key={subject._id}
                                subject={subject}
                                openEdit={openEdit}
                                openView={openView}
                                openDelete={openDelete}
                                isUpdatingSubject={isUpdatingSubject}
                                isDeletingSubject={isDeletingSubject}
                            />
                        ))}
                    </div>
                )
                : <p></p>
            }
            <CrudDialog
                operation={operation}
                title={
                    operation === "create"
                        ? "Crear Nueva Materia"
                        : operation === "edit"
                            ? "Editar Materia"
                            : "Ver Materia"
                }
                description={
                    operation === "create"
                        ? "Completa la información de la nueva materia"
                        : operation === "edit"
                            ? "Modifica la información de la materia"
                            : "Información de la materia"
                }
                schema={subjectSchema}
                defaultValues={{
                    name: "",
                    description: "",
                    credits: 0,
                    status: "active",
                }}
                data={data}
                isOpen={isOpen}
                onOpenChange={close}
                onSubmit={handleSubmit}
                onDelete={handleDelete}
                isSubmitting={isCreatingSubject || isUpdatingSubject}
                isDeleting={isDeletingSubject}
            >
                {(form, operation) => {
                    const nameValue = form.watch("name") as string || "";
                    const descriptionValue = form.watch("description") as string || "";

                    return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Nombre</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    {...field}
                                                    placeholder="Nombre de la materia"
                                                    value={field.value as string}
                                                    disabled={operation === "view"}
                                                    maxLength={25}
                                                />
                                                <div className="absolute right-2 top-2 text-xs text-muted-foreground">
                                                    {nameValue.length}/25
                                                </div>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Descripción</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Textarea
                                                    {...field}
                                                    placeholder="Descripción de la materia"
                                                    value={field.value as string}
                                                    disabled={operation === "view"}
                                                    maxLength={150}
                                                    className="pr-12"
                                                />
                                                <div className="absolute right-2 top-2 text-xs text-muted-foreground">
                                                    {descriptionValue.length}/150
                                                </div>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="credits"
                                render={({ field }) => {
                                    // Convertimos explícitamente el valor a string para el input
                                    const inputValue = field.value === null || field.value === undefined
                                        ? ""
                                        : String(field.value);

                                    return (
                                        <FormItem>
                                            <FormLabel>Créditos</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    placeholder="Número de créditos"
                                                    value={inputValue}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        // Convertimos a número o undefined
                                                        const numValue = value === ""
                                                            ? undefined
                                                            : Number(value);
                                                        field.onChange(numValue);
                                                    }}
                                                    disabled={operation === "view"}
                                                    max={10}
                                                    min={1}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }}
                            />

                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel>Estado</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value?.toString()}
                                            disabled={operation === "view"}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona un estado" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="active">Materia activa</SelectItem>
                                                <SelectItem value="inactive">Materia inactiva</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )
                }}
            </CrudDialog>
        </div>
    )
};
