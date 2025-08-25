"use client"

import type React from "react"
import { useState } from "react"
import { useUser } from "@clerk/nextjs";
import { useUserWithConvex } from "stores/userStore";
import { useCurrentSchool } from "stores/userSchoolsStore";
import { useCicloEscolarWithConvex } from "stores/useSchoolCiclesStore";
import { CrudDialog, useCrudDialog, WithId } from "@repo/ui/components/dialog/crud-dialog";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { Button } from "@repo/ui/components/shadcn/button";
import { Plus, Search, GraduationCap, CalendarDays, MoreHorizontal } from "@repo/ui/icons";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/shadcn/form";
import { Input } from "@repo/ui/components/shadcn/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { cicloEscolarSchema } from "@/types/shoolCycles";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@repo/ui/components/shadcn/dropdown-menu";


const getStatusColor = (status: string) => {
    switch (status) {
        case "active":
            return "bg-green-100 text-green-800 hover:bg-green-200"
        case "archived":
            return "bg-gray-100 text-gray-800 hover:bg-gray-200"
        case "inactive":
            return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
        default:
            return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
}

const getStatusText = (status: string) => {
    switch (status) {
        case "active":
            return "Activo"
        case "archived":
            return "Archivado"
        case "inactive":
            return "Inactivo"
        default:
            return status
    }
}

const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })
}

export default function SchoolCyclesPage() {
    const { user: clerkUser, isLoaded } = useUser();
    const { currentUser, isLoading: userLoading } = useUserWithConvex(clerkUser?.id);
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")

    const {
        currentSchool,
        isLoading: schoolLoading,
        error: schoolError,
    } = useCurrentSchool(currentUser?._id);

    const {
        ciclosEscolares,
        isLoading: ciclosLoading,
        isCreating,
        isUpdating,
        isDeleting,
        createError,
        updateError,
        deleteError,
        createCicloEscolar,
        updateCicloEscolar,
        deleteCicloEscolar,
        clearErrors,
    } = useCicloEscolarWithConvex();

    const {
        isOpen,
        operation,
        data,
        openCreate,
        openEdit,
        openView,
        openDelete,
        close,
    } = useCrudDialog(cicloEscolarSchema, {
        name: "",
        startDate: "",
        endDate: "",
        status: "inactive",
    });

    const isLoading = !isLoaded || userLoading || schoolLoading || ciclosLoading;

    const handleSubmit = async (values: Record<string, unknown>) => {
        if (!currentSchool?.school._id || !currentUser?._id) {
            return;
        }

        const baseData = {
            schoolId: currentSchool.school._id,
            name: values.name as string,
            startDate: new Date(values.startDate as string).getTime(),
            endDate: new Date(values.endDate as string).getTime(),
            status: values.status as "active" | "inactive" | "archived"
        };

        try {
            if (operation === "create") {
                await createCicloEscolar(baseData);
            } else if (operation === "edit" && data?._id) {
                await updateCicloEscolar({
                    cicloEscolarID: data._id as Id<"schoolCycle">,
                    schoolId: currentSchool.school._id,
                    name: baseData.name,
                    startDate: baseData.startDate,
                    endDate: baseData.endDate,
                    status: baseData.status,
                });
            }
            close();
        } catch (error) {
            console.error("Error al procesar ciclo escolar:", error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteCicloEscolar(id as Id<"schoolCycle">);
            close();
        } catch (error) {
            console.error("Error al eliminar ciclo escolar:", error);
        }
    };

    const filteredCycles = ciclosEscolares.filter((cycle) => {
        const matchesSearch = cycle.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === "all" || cycle.status === statusFilter
        return matchesSearch && matchesStatus
    });

    if (isLoading || (currentUser && !currentSchool && !schoolError)) {
        return (
            <div className="space-y-8 p-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="space-y-4 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="text-muted-foreground">Cargando información de los ciclos escolares...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <GraduationCap className="h-8 w-8 text-primary" />
                            Ciclos Escolares
                        </h1>
                        <p className="text-muted-foreground">Gestiona los períodos académicos de tu institución</p>
                    </div>
                    <Button
                        onClick={openCreate}
                        disabled={isCreating}
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo Ciclo
                    </Button>
                </div>

                {/* Show errors */}
                {(createError || updateError || deleteError) && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <div className="text-sm text-red-600">
                            {createError && <div>Error al crear ciclo: {createError}</div>}
                            {updateError && <div>Error al actualizar ciclo: {updateError}</div>}
                            {deleteError && <div>Error al eliminar ciclo: {deleteError}</div>}
                        </div>
                        <button
                            onClick={clearErrors}
                            className="text-xs text-blue-500 underline mt-1"
                        >
                            Limpiar errores
                        </button>
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Buscar ciclos escolares..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={statusFilter === "all" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter("all")}
                        >
                            Todos
                        </Button>
                        <Button
                            variant={statusFilter === "active" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter("active")}
                        >
                            Activos
                        </Button>
                        <Button
                            variant={statusFilter === "archived" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter("archived")}
                        >
                            Archivados
                        </Button>
                        <Button
                            variant={statusFilter === "inactive" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter("inactive")}
                        >
                            Inactivos
                        </Button>
                    </div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCycles.map((cycle) => (
                        <Card key={cycle._id} className="hover:shadow-lg transition-shadow duration-200">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1 flex-1">
                                        <CardTitle className="text-lg leading-tight">{cycle.name}</CardTitle>
                                        <CardDescription className="text-sm">ID: {cycle.schoolId}</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className={getStatusColor(cycle.status)}>{getStatusText(cycle.status)}</Badge>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openView(cycle as unknown as Record<string, unknown> & Partial<WithId>)}>
                                                    Ver Detalles
                                                </DropdownMenuItem>

                                                <DropdownMenuItem onClick={() => openEdit(cycle as unknown as Record<string, unknown> & Partial<WithId>)}>
                                                    Editar
                                                </DropdownMenuItem>

                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => openDelete(cycle as unknown as Record<string, unknown> & Partial<WithId>)}
                                                >
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Dates */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Inicio:</span>
                                        <span className="font-medium">{formatDate(cycle.startDate)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Fin:</span>
                                        <span className="font-medium">{formatDate(cycle.endDate)}</span>
                                    </div>
                                </div>

                                {/* Duration */}
                                <div className="pt-2 border-t">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Duración:</span>
                                        <span className="font-medium">
                                            {Math.ceil((cycle.endDate - cycle.startDate) / (1000 * 60 * 60 * 24 * 30))} meses
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm mt-1">
                                        <span className="text-muted-foreground">Creado:</span>
                                        <span className="font-medium">{formatDate(cycle.createdAt)}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 bg-transparent"
                                        onClick={() => openView(cycle as unknown as Record<string, unknown> & Partial<WithId>)}
                                    >
                                        Ver Detalles
                                    </Button>
                                    {cycle.status === "active" && (
                                        <Button size="sm" className="flex-1">
                                            Gestionar
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Empty State */}
                {filteredCycles.length === 0 && (
                    <div className="text-center py-12">
                        <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No se encontraron ciclos escolares</h3>
                        <p className="text-muted-foreground mb-4">
                            {searchTerm || statusFilter !== "all"
                                ? "Intenta ajustar los filtros de búsqueda"
                                : "Comienza creando tu primer ciclo escolar"}
                        </p>
                        {!searchTerm && statusFilter === "all" && (
                            <Button onClick={openCreate}>
                                <Plus className="h-4 w-4 mr-2" />
                                Crear Primer Ciclo
                            </Button>
                        )}
                    </div>
                )}

                {/* CRUD Dialog */}
                <CrudDialog
                    operation={operation}
                    title={
                        operation === "create"
                            ? "Crear Nuevo Ciclo Escolar"
                            : operation === "edit"
                                ? "Editar Ciclo Escolar"
                                : "Ver Ciclo Escolar"
                    }
                    description={
                        operation === "create"
                            ? "Completa la información del nuevo ciclo escolar"
                            : operation === "edit"
                                ? "Modifica la información del ciclo escolar"
                                : "Información del ciclo escolar"
                    }
                    schema={cicloEscolarSchema}
                    defaultValues={{
                        name: "",
                        startDate: "",
                        endDate: "",
                        status: "inactive",
                    }}
                    data={data ? {
                        ...data,
                        startDate: data.startDate ? new Date(Number(data.startDate)).toISOString().split('T')[0] : "",
                        endDate: data.endDate ? new Date(Number(data.endDate)).toISOString().split('T')[0] : "",
                    } : undefined}
                    isOpen={isOpen}
                    onOpenChange={close}
                    onSubmit={handleSubmit}
                    onDelete={handleDelete}
                    isSubmitting={isCreating || isUpdating}
                    isDeleting={isDeleting}
                >
                    {(form, operation) => {
                        const nameValue = form.watch("name") as string || "";

                        return (
                            <div className="grid gap-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre del Ciclo</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        {...field}
                                                        placeholder="Ej: Ciclo Escolar 2024-2025"
                                                        value={field.value as string}
                                                        disabled={operation === "view"}
                                                        maxLength={50}
                                                    />
                                                    <div className="absolute right-2 top-2 text-xs text-muted-foreground">
                                                        {nameValue.length}/50
                                                    </div>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="startDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Fecha de Inicio</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="date"
                                                        value={field.value as string}
                                                        disabled={operation === "view"}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="endDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Fecha de Fin</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="date"
                                                        value={field.value as string}
                                                        disabled={operation === "view"}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
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
                                                    <SelectItem value="inactive">Inactivo</SelectItem>
                                                    <SelectItem value="active">Activo</SelectItem>
                                                    <SelectItem value="archived">Archivado</SelectItem>
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
        </div>
    )
}