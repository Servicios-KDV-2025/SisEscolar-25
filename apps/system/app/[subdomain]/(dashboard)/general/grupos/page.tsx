"use client";

import { useUser } from "@clerk/nextjs";
import { useCurrentSchool } from "stores/userSchoolsStore";
import { useUserWithConvex } from "stores/userStore";
import { AlertCircle, CheckCircle, Filter, Search, Users, XCircle } from '@repo/ui/icons';
import { Badge } from "@repo/ui/components/shadcn/badge"
import { Input } from "@repo/ui/components/shadcn/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select"
import { useState } from "react"
import { Button } from "@repo/ui/components/shadcn/button"
import { Plus } from "@repo/ui/icons"
import { Id } from "@repo/convex/convex/_generated/dataModel"
import { useGroup } from "stores/groupStore"
import { CrudDialog, useCrudDialog } from "@repo/ui/components/dialog/crud-dialog"
import { groupSchema } from "@/types/form/groupSchema"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/shadcn/form"
import { Alert, AlertDescription } from '@repo/ui/components/shadcn/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/shadcn/card';
import { GroupCard } from '../../../../../components/GroupCard';

export default function GroupPage() {
    const { user: clerkUser, isLoaded } = useUser();
    const { currentUser, isLoading: userLoading } = useUserWithConvex(clerkUser?.id);
    const [searchTerm, setSearchTerm] = useState("");
    const [gradeFilter, setGradeFilter] = useState<string | null>(null)
    const [statusFilter, setStatusFilter] = useState<string | null>(null)

    const {
        currentSchool,
        isLoading: schoolLoading,
    } = useCurrentSchool(currentUser?._id);


    const {
        groups,
        isCreating: isCreatingGroup, 
        isUpdating: isUpdatingGroup,
        isDeleting: isDeletingGroup,
        createError: createErrorGroup,
        updateError: updateErrorGroup,
        deleteError: deleteErrorGroup,
        createGroup,
        updateGroup,
        deleteGroup,
        clearErrors: clearErrorsGroup,
        isLoading: isLoadingGroup,
    } = useGroup(currentSchool?.school._id);

    const isLoading = !isLoaded || userLoading || schoolLoading || isLoadingGroup;

    console.log(isLoading);
    const {
        isOpen,
        operation,
        data,
        openCreate,
        openEdit,
        openView,
        openDelete,
        close,
    } = useCrudDialog(groupSchema, {
        grade: "",
        name: "",
        status: ""
    });

    const filteredGroups = groups.filter((group) => {
        const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) || group.grade.includes(searchTerm);
        const matchesStatus = !statusFilter || group.status === statusFilter;
        const matchesGroup = !gradeFilter || group.grade === gradeFilter;
        return matchesStatus && matchesSearch && matchesGroup;
    });

    const handleSubmit = async (values: Record<string, unknown>) => {
        if (!currentSchool?.school._id || !currentUser?._id) {
            return;
        }

        if (operation === "create") {
            await createGroup({
                schoolId: currentSchool.school._id as Id<"school">,
                name: values.name as string,
                grade: values.grade as string,
                status: values.status as "active" | "inactive"
            });
        } else if (operation === "edit" && data?._id) {
            await updateGroup({
                _id: data._id as Id<"subject">,
                schoolId: currentSchool.school._id as Id<"school">,
                name: values.name as string,
                grade: values.grade as string,
                status: values.status as "active" | "inactive",
                updatedAt: new Date().getTime(),
                updatedBy: currentUser._id
            });
        }
    };

    const handleDelete = async (id: string) => {
        await deleteGroup(id, currentSchool?.school._id);
    };


   

    return (
        <div className="space-y-8 p-6">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
                <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
                <div className="relative p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-primary/10 rounded-xl">
                                    <Users className="h-8 w-8 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold tracking-tight">Grupos</h1>
                                    <p className="text-lg text-muted-foreground">
                                        Administra los grupos registrados.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Button
                            size="lg"
                            className="gap-2"
                            onClick={openCreate}
                            disabled={isCreatingGroup}
                        >
                            <Plus className="h-4 w-4" />
                            Agregar Grupo
                        </Button>
                    </div>
                </div>
            </div>

            {/* Error Alerts */}
            {(createErrorGroup || updateErrorGroup || deleteErrorGroup) && (
                <div className="space-y-4">
                    {createErrorGroup && (
                        <Alert variant="destructive">
                            <AlertCircle className='h-4 w-4' />
                            <AlertDescription>
                                Error al crear el grupo: {createErrorGroup}
                            </AlertDescription>
                        </Alert>
                    )}
                    {updateErrorGroup && (
                        <Alert variant="destructive">
                            <AlertCircle className='h-4 w-4' />
                            <AlertDescription>
                                Error al actualizar el grupo: {updateErrorGroup}
                            </AlertDescription>
                        </Alert>
                    )}
                    {deleteErrorGroup && (
                        <Alert variant="destructive">
                            <AlertCircle className='h-4 w-4' />
                            <AlertDescription>
                                Error al eliminar el grupo: {deleteErrorGroup}
                            </AlertDescription>
                        </Alert>
                    )}
                    <button
                        onClick={clearErrorsGroup}
                        className="text-xs text-blue-500 underline mt-1"
                    >
                        Limpiar errores
                    </button>
                </div>
            )}

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card
                    className="relative overflow-hidden group hover:shadow-lg transition-all duration-300"
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total de Grupos
                        </CardTitle>
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                            <Users className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="text-3xl font-bold">
                            {groups.length || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card
                    className="relative overflow-hidden group hover:shadow-lg transition-all duration-300"
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Activos
                        </CardTitle>
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                            <CheckCircle className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="text-3xl font-bold">
                            {groups?.filter(g => g.status === "active").length || 0}
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className="relative overflow-hidden group hover:shadow-lg transition-all duration-300"
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Inactivos
                        </CardTitle>
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                            <XCircle className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="text-3xl font-bold">
                            {groups?.filter(g => g.status === "inactive").length || 0}
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
                                <Filter className='h-5 w-5' />
                                Filtros y Búsqueda
                            </CardTitle>
                            <CardDescription>
                                Encuentra los grupos por nombre, activos o inactivos
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
                                    placeholder="Buscar grupo..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Select
                                onValueChange={(v) => setStatusFilter(v === "all" ? null : v)}
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
                        <div className="flex gap-2">
                            <Select
                                onValueChange={(v) => setGradeFilter(v === 'all' ? null : v)}
                                value={gradeFilter || ""}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Grado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los grados</SelectItem>
                                    <SelectItem value="1°">1°</SelectItem>
                                    <SelectItem value="2°">2°</SelectItem>
                                    <SelectItem value="3°">3°</SelectItem>
                                    <SelectItem value="4°">4°</SelectItem>
                                    <SelectItem value="5°">5°</SelectItem>
                                    <SelectItem value="6°">6°</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabla de Personal */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Lista de los grupos</span>
                        <Badge variant="outline">{filteredGroups.length} grupos</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                                <p className="text-muted-foreground">Cargando grupos...</p>
                            </div>
                        </div>
                    ) : filteredGroups.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">
                                No se encontraron grupos
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                Intenta ajustar los filtros o no hay grupos registradas.
                            </p>
                            <Button
                                size="lg"
                                className="gap-2"
                                onClick={openCreate}
                                disabled={isCreatingGroup}
                            >
                                <Plus className="h-4 w-4" />
                                Nuevo Grupo
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-9">
                            {filteredGroups.map((group) => (
                                <GroupCard
                                    key={group._id}
                                    group={group}
                                    isUpdatingGroup={isUpdatingGroup}
                                    isDeletingGroup={isDeletingGroup}
                                    openEdit={openEdit}
                                    openView={openView}
                                    openDelete={openDelete}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* CrudDialog */}
            <CrudDialog
                operation={operation}
                title={
                    operation === "create"
                        ? "Crear Nuevo Grupo"
                        : operation === "edit"
                            ? "Editar Grupo"
                            : "Ver Grupo"
                }
                description={
                    operation === "create"
                        ? "Completa la información del nuevo grupo"
                        : operation === "edit"
                            ? "Modifica la información del grupo"
                            : "Información del grupo"
                }
                schema={groupSchema}
                defaultValues={{
                    grade: "1°",
                    name: "",
                    status: "active"
                }}
                data={data}
                isOpen={isOpen}
                onOpenChange={close}
                onSubmit={handleSubmit}
                onDelete={handleDelete}
            >
                {(form, operation) => (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="grade"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Grado</FormLabel>
                                    <FormControl>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value as string}
                                            disabled={operation === "view"}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar grado" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1°">1°</SelectItem>
                                                <SelectItem value="2°">2°</SelectItem>
                                                <SelectItem value="3°">3°</SelectItem>
                                                <SelectItem value="4°">4°</SelectItem>
                                                <SelectItem value="5°">5°</SelectItem>
                                                <SelectItem value="6°">6°</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => {
                                return (
                                    <FormItem>
                                        <FormLabel>Nombre</FormLabel>
                                        <FormControl>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value as string}
                                                disabled={operation === "view"}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar Nombre" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="A">A</SelectItem>
                                                    <SelectItem value="B">B</SelectItem>
                                                    <SelectItem value="C">C</SelectItem>
                                                    <SelectItem value="D">D</SelectItem>
                                                </SelectContent>
                                            </Select>
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
                                            <SelectItem value="active">Grupo activo</SelectItem>
                                            <SelectItem value="inactive">Grupo inactivo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}
            </CrudDialog>
        </div>
    )
}
