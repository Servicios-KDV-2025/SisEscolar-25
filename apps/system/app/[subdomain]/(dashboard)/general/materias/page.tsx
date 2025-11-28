"use client";

import { useUser } from "@clerk/nextjs";
import { SubjectCard } from "../../../../../components/SubjectCard";
import { useUserWithConvex } from "stores/userStore";
import { useCurrentSchool } from "stores/userSchoolsStore";
import { useSubject } from "stores/subjectStore";
import {
  CrudDialog,
  useCrudDialog,
} from "@repo/ui/components/dialog/crud-dialog";
import { subjectSchema } from "types/form/subjectSchema";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  AlertCircle,
  BookOpen,
  CheckCircle,
  Filter,
  Plus,
  XCircle,
} from "@repo/ui/icons";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/shadcn/form";
import { Input } from "@repo/ui/components/shadcn/input";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import { useState } from "react";
import { Alert, AlertDescription } from "@repo/ui/components/shadcn/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
import { Search } from "lucide-react";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { usePermissions } from "../../../../../hooks/usePermissions";
import NotAuth from "../../../../../components/NotAuth";
import { useCrudToastMessages } from "../../../../../hooks/useCrudToastMessages";
import { GeneralDashboardSkeleton } from "../../../../../components/skeletons/GeneralDashboardSkeleton";

export default function SubjectPage() {
  const { user: clerkUser, isLoaded } = useUser();
  const { currentUser, isLoading: userLoading } = useUserWithConvex(
    clerkUser?.id
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { currentSchool, isLoading: schoolLoading } = useCurrentSchool(
    currentUser?._id
  );

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

  //   Mensajes de toast personalizados
  const toastMessages = useCrudToastMessages("Materia");

  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch = subject.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || subject.status === statusFilter;
    return matchesStatus && matchesSearch;
  });

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!currentSchool?.school._id || !currentUser?._id) {
      return;
    }

    const baseData = {
      schoolId: currentSchool.school._id,
      name: values.name as string,
      description: values.description as string | undefined,
      credits: values.credits as number | undefined,
      status: values.status as "active" | "inactive",

    };

    if (operation === "create") {
      await createSubject({
        ...baseData,
        updatedAt: new Date().getTime(),
        updatedBy: currentUser._id,
      }
      );
    } else if (operation === "edit" && data?._id) {
      await updateSubject({
        ...baseData,
        _id: data._id as Id<"subject">,
        updatedAt: new Date().getTime(),
        updatedBy: currentUser._id,
      });
    }
  };

  const handleDelete = async (id: string) => {
    await deleteSubject(id);
    //   Los toasts ahora los maneja el CrudDialog automáticamente
  };

  const {
    canCreateSubject,
    canReadSubject,
  } = usePermissions(currentSchool?.school._id);

  if (isLoading) {
    return <GeneralDashboardSkeleton nc={3} />;
  }
  return (
    <>
      {canReadSubject ? (
        <div className="space-y-8 p-6">
          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
            <div className="relative p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <BookOpen className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold tracking-tight">
                        Materias
                      </h1>
                      <p className="text-lg text-muted-foreground">
                        Administra las materias académicas registradas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Alerts */}
          {(createSubjectError || updateSubjectError || deleteSubjectError) && (
            <div className="space-y-4">
              {createSubjectError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Error al crear materia: {createSubjectError}
                  </AlertDescription>
                </Alert>
              )}
              {updateSubjectError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Error al actualizar materia: {updateSubjectError}
                  </AlertDescription>
                </Alert>
              )}
              {deleteSubjectError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Error al eliminar materia: {deleteSubjectError}
                  </AlertDescription>
                </Alert>
              )}
              <button
                onClick={clearSubjectErrors}
                className="text-xs text-blue-500 underline mt-1"
              >
                Limpiar errores
              </button>
            </div>
          )}

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total
                </CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-bold">{subjects.length}</div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Activas
                </CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <CheckCircle className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-bold">
                  {subjects.filter((s) => s.status === "active").length}
                </div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Inactivas
                </CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <XCircle className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-bold">
                  {subjects.filter((s) => s.status === "inactive").length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros y búsqueda */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filtros y Búsqueda
                  </CardTitle>
                  <CardDescription>
                    Encuentra las materias por nombre, activas o inactivas
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select
                    onValueChange={(v) =>
                      setStatusFilter(v === "all" ? null : v)
                    }
                    value={statusFilter || ""}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Filtrar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="active">Activas</SelectItem>
                      <SelectItem value="inactive">Inactivas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de Materias */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle>
                  <div className="flex flex-col gap-2">
                    <span>Lista de Materias</span>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 w-fit">
                      {filteredSubjects.length} materias
                    </Badge>
                  </div>
                </CardTitle>
                {canCreateSubject && (<Button
                  size="lg"
                  className="gap-2"
                  onClick={openCreate}
                  disabled={isCreatingSubject}
                >
                  <Plus className="h-4 w-4" />
                  Agregar Materia
                </Button>)}
              </div>
            </CardHeader>
            <CardContent>
              {filteredSubjects.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No se encontraron materias
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Intenta ajustar los filtros o no hay materias registradas.
                  </p>
                  {canCreateSubject && (<Button
                    size="lg"
                    className="gap-2"
                    onClick={openCreate}
                    disabled={isCreatingSubject}
                  >
                    <Plus className="h-4 w-4" />
                    Nueva Materia
                  </Button>)}
                </div>
              ) : (
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
                      canUpdateSubject={canCreateSubject}
                      canDeleteSubject={canCreateSubject}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

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
            toastMessages={toastMessages}
            disableDefaultToasts={false}
          >
            {(form, operation) => {
              const nameValue = (form.watch("name") as string) || "";
              const descriptionValue =
                (form.watch("description") as string) || "";

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
                      const inputValue =
                        field.value === null || field.value === undefined
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
                                const numValue =
                                  value === "" ? undefined : Number(value);
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
                            <SelectItem value="active">
                              Materia activa
                            </SelectItem>
                            <SelectItem value="inactive">
                              Materia inactiva
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              );
            }}
          </CrudDialog>
        </div>
      ) : (
        <NotAuth
          pageName="Materias"
          pageDetails="Aquí puedes gestionar las materias académicas de tu institución."
          icon={BookOpen}
        />
      )}
    </>
  );
}
