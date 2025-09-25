"use client";

import { classCatalogSchema } from "@/types/form/classCatalogSchema";
import { useUser } from "@clerk/nextjs";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { CrudDialog, useCrudDialog } from "@repo/ui/components/dialog/crud-dialog";
import { Button } from "@repo/ui/components/shadcn/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/shadcn/table";
import { AlertCircle, CheckCircle, ClipboardList, Eye, Filter, Pencil, Plus, Search, Trash2, XCircle } from "@repo/ui/icons";
import { useClassCatalog } from "stores/classCatalogStore";
import { useGroup } from "stores/groupStore";
import { useSubject } from "stores/subjectStore";
import { useCurrentSchool } from "stores/userSchoolsStore";
import { useUserWithConvex } from "stores/userStore";
import { ClassCatalogForm } from "../../../../../components/ClassCatalogForm";
import { useQuery } from 'convex/react';
import { api } from '@repo/convex/convex/_generated/api';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@repo/ui/components/shadcn/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/shadcn/card';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/shadcn/select';
import { Input } from '@repo/ui/components/shadcn/input';
import { Badge } from '@repo/ui/components/shadcn/badge';

export default function ClassCatalogPage() {
    // Get current user from Clerk
    const { user: clerkUser, isLoaded } = useUser();
    const { currentUser, isLoading: userLoading } = useUserWithConvex(clerkUser?.id);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [cycleFilter, setCycleFilter] = useState<string | null>(null);

    // Get current school information using the subdomain
    const {
        currentSchool,
        isLoading: schoolLoading,
    } = useCurrentSchool(currentUser?._id);

    const isLoading = !isLoaded || userLoading || schoolLoading;

    const { subjects } = useSubject(currentSchool?.school._id);
    const { groups } = useGroup(currentSchool?.school._id);
    const schoolCycles = useQuery(
        api.functions.schoolCycles.ObtenerCiclosEscolares,
        currentSchool?.school._id ? { escuelaID: currentSchool?.school._id } : 'skip',
    );

    // En tu componente principal
    const teachers = useQuery(
        api.functions.userSchool.getByRole,
        { role: 'teacher' }
    );

    // Obtener los IDs de usuarios
    const teacherUserIds = teachers?.map(relation => relation.userId) || [];

    // Obtener la información de cada usuario
    const teachersData = useQuery(
        api.functions.users.getUsersByIds,
        teacherUserIds.length > 0
            ? {
                userIds: teacherUserIds,
                status: 'active'
            }
            : 'skip'
    );

    const classrooms = useQuery(
        api.functions.classroom.viewAllClassrooms,
        currentSchool?.school._id ? { schoolId: currentSchool?.school._id } : 'skip',
    );

    const {
        classCatalogsWithDetails: classCatalogs,
        isCreating: isCreatingClassCat,
        isUpdating: isUpdatingClassCat,
        isDeleting: isDeletingClassCat,
        createError: createClassCatError,
        updateError: updateClassCatError,
        deleteError: deleteClassCatError,
        createClassCatalog,
        updateClassCatalog,
        deleteClassCatalog,
        clearErrors: clearSubjectErrors,
    } = useClassCatalog(currentSchool?.school._id);

    const {
        isOpen,
        operation,
        data,
        openCreate,
        openEdit,
        openView,
        openDelete,
        close,
    } = useCrudDialog(classCatalogSchema);

    const filteredClasses = classCatalogs?.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = !statusFilter || c.status === statusFilter;
        const matchesCycle = !cycleFilter || c.schoolCycle?._id === cycleFilter;
        return matchesSearch && matchesStatus && matchesCycle;
    });

    const handleSubmit = async (values: Record<string, unknown>) => {
        if (!currentSchool?.school._id || !currentUser?._id) {
            console.error('Missing required IDs');
            toast.error('Error', { description: 'No se pudo identificar la escuela o usuario' });
            return;
        }

        try {
            console.log('Preparing data for submission...');

            const submissionData = {
                schoolId: currentSchool.school._id,
                schoolCycleId: values.schoolCycleId,
                subjectId: values.subjectId,
                classroomId: values.classroomId,
                teacherId: values.teacherId,
                groupId: values.groupId,
                name: values.name,
                status: values.status,
                createdBy: currentUser._id
            };

            console.log('Submission data:', submissionData);

            if (operation === 'create') {
                console.log('Calling createClassCatalog...');
                const result = await createClassCatalog({
                    schoolId: submissionData.schoolId as Id<"school">,
                    schoolCycleId: submissionData.schoolCycleId as Id<'schoolCycle'>,
                    subjectId: submissionData.subjectId as Id<'subject'>,
                    classroomId: submissionData.classroomId as Id<'classroom'>,
                    teacherId: submissionData.teacherId as Id<'user'>,
                    groupId: submissionData.groupId as Id<'group'>,
                    name: submissionData.name as string,
                    status: submissionData.status as "active" | "inactive",
                    createdBy: submissionData.createdBy as Id<'user'>
                });

                console.log('Create operation completed successfully:', result);
                toast.success('Clase creada correctamente');
 
            } else if (operation === 'edit' && data?._id) {
                console.log('Calling updateClassCatalog...');
                await updateClassCatalog({
                    _id: data._id as Id<"classCatalog">,
                    schoolId: submissionData.schoolId as Id<"school">,
                    schoolCycleId: submissionData.schoolCycleId as Id<'schoolCycle'>,
                    subjectId: submissionData.subjectId as Id<'subject'>,
                    classroomId: submissionData.classroomId as Id<'classroom'>,
                    teacherId: submissionData.teacherId as Id<'user'>,
                    groupId: submissionData.groupId as Id<'group'>,
                    name: submissionData.name as string,
                    status: submissionData.status as "active" | "inactive",
                    updatedAt: Date.now()
                });

                console.log('Update operation completed successfully');
                toast.success('Clase actualizada correctamente');
            }

            // Cerrar el diálogo después de éxito
            close();

        } catch (error) {
            // Mostrar mensaje de error específico
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            toast.error('Error', {
                description: `No se pudo ${operation === 'create' ? 'crear' : 'actualizar'} la clase: ${errorMessage}`
            });
        }
    }

    const handleDelete = async (id: string) => {
        if (!currentSchool?.school?._id) {
            toast.error('Error', { description: 'No se pudo identificar la escuela' })
            return
        }
        try {
            await deleteClassCatalog(id, currentSchool?.school._id)
            toast.success('Eliminado correctamente')
        } catch (error) {
            console.error('Error al eliminar evento:', error);
            throw error;
        }
    }

    return (
        <div className="space-y-8 p-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
                <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
                <div className="relative p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-primary/10 rounded-xl">
                                    <ClipboardList className="h-8 w-8 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold tracking-tight">Clases</h1>
                                    <p className="text-lg text-muted-foreground">
                                        Administra el listado de las clases registradas.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Button
                            size="lg"
                            className="gap-2"
                            onClick={openCreate}
                            disabled={isCreatingClassCat}
                        >
                            <Plus className="h-4 w-4" />
                            Agregar Clase
                        </Button>
                    </div>
                </div>
            </div>

            {/* Error Alerts */}
            {(createClassCatError || updateClassCatError || deleteClassCatError) && (
                <div className="space-y-4">
                    {createClassCatError && (
                        <Alert variant="destructive">
                            <AlertCircle className='h-4 w-4' />
                            <AlertDescription>
                                Error al crear materia: {createClassCatError}
                            </AlertDescription>
                        </Alert>
                    )}
                    {updateClassCatError && (
                        <Alert variant="destructive">
                            <AlertCircle className='h-4 w-4' />
                            <AlertDescription>
                                Error al actualizar materia: {updateClassCatError}
                            </AlertDescription>
                        </Alert>
                    )}
                    {deleteClassCatError && (
                        <Alert variant="destructive">
                            <AlertCircle className='h-4 w-4' />
                            <AlertDescription>
                                Error al eliminar materia: {deleteClassCatError}
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
                <Card
                    className="relative overflow-hidden group hover:shadow-lg transition-all duration-300"
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total de Clases
                        </CardTitle>
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                            <ClipboardList className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="text-3xl font-bold">{classCatalogs?.length || 0}</div>
                    </CardContent>
                </Card>

                <Card
                    className="relative overflow-hidden group hover:shadow-lg transition-all duration-300"
                >
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
                            {classCatalogs?.filter(c => c.status === "active").length || 0}
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className="relative overflow-hidden group hover:shadow-lg transition-all duration-300"
                >
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
                            {classCatalogs?.filter(c => c.status === "inactive").length || 0}
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
                                Encuentra las clases por nombre, activas o inactivas
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
                                    placeholder="Buscar clase..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
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

                            <Select onValueChange={(v) => setCycleFilter(v)} value={cycleFilter || ""}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Filtrar ciclo escolar" />
                                </SelectTrigger>
                                <SelectContent>
                                    {schoolCycles?.map(cycle => (
                                        <SelectItem key={cycle._id} value={cycle._id}>{cycle.name}</SelectItem>
                                    ))}
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
                        <span>Lista de Clases</span>
                        <Badge variant="outline">{filteredClasses.length} clases</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                                <p className="text-muted-foreground">Cargando clases...</p>
                            </div>
                        </div>
                    ) : filteredClasses.length === 0 ? (
                        <div className="text-center py-12">
                            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">
                                No se encontraron clases
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                Intenta ajustar los filtros o no hay clases registradas.
                            </p>
                            <Button
                                size="lg"
                                className="gap-2"
                                onClick={openCreate}
                                disabled={isCreatingClassCat}
                            >
                                <Plus className="h-4 w-4" />
                                Nueva Clase
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[120px]">Nombre</TableHead>
                                        <TableHead>Ciclo Escolar</TableHead>
                                        <TableHead>Materia</TableHead>
                                        <TableHead>Salón</TableHead>
                                        <TableHead>Maestro</TableHead>
                                        <TableHead>Grupo</TableHead>
                                        <TableHead>Activo</TableHead>
                                        <TableHead>Creado Por</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredClasses?.length === 0
                                        ? (
                                            <TableRow>
                                                <TableCell colSpan={9} className="text-center text-muted-foreground p-3">
                                                    No hay salones registrados para esta escuela.
                                                </TableCell>
                                            </TableRow>
                                        )
                                        : (
                                            filteredClasses?.map(classCat => (
                                                <TableRow key={classCat._id}>
                                                    <TableCell className="font-medium">{classCat.name}</TableCell>
                                                    <TableCell>{classCat.schoolCycle?.name}</TableCell>
                                                    <TableCell>{classCat.subject?.name}</TableCell>
                                                    <TableCell>{classCat.classroom?.name}</TableCell>
                                                    <TableCell>{classCat.teacher?.name} {classCat.teacher?.lastName}</TableCell>
                                                    <TableCell>{classCat.group?.grade} {classCat.group?.name}</TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={classCat.status === "active" ? "default" : "secondary"}
                                                            className={classCat.status === "active" ? "bg-green-600 text-white flex-shrink-0 ml-2" : "flex-shrink-0 ml-2 bg-gray-600/70 text-white"}
                                                        >
                                                            {classCat.status === 'active' ? 'Activa' : 'Inactiva'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{classCat.createData?.name} {classCat.createData?.lastName}</TableCell>
                                                    <TableCell className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                openView(classCat);
                                                            }}
                                                            className="hover:scale-105 transition-transform cursor-pointer"
                                                            disabled={isUpdatingClassCat || isDeletingClassCat}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                openEdit(classCat);
                                                            }}
                                                            className="hover:scale-105 transition-transform cursor-pointer"
                                                            disabled={isUpdatingClassCat || isDeletingClassCat}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                openDelete(classCat)
                                                            }}
                                                            className="hover:scale-105 transition-transform cursor-pointer text-destructive hover:text-destructive"
                                                            disabled={isUpdatingClassCat || isDeletingClassCat}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )
                                    }
                                </TableBody>
                            </Table>
                        </div >
                    )}
                </CardContent>
            </Card>



            {/* CrudDialog */}
            <CrudDialog
                operation={operation}
                title={operation === 'create'
                    ? 'Crear Nueva Clase'
                    : operation === 'edit'
                        ? 'Editar Clase'
                        : 'Ver Clase'
                }
                description={operation === 'create'
                    ? 'Completa la información de la Clase'
                    : operation === 'edit'
                        ? 'Modifica la información de la Clase'
                        : 'Información de la Clase'
                }
                schema={classCatalogSchema}
                defaultValues={{
                    schoolCycleId: '',
                    subjectId: '',
                    classroomId: '',
                    teacherId: '',
                    groupId: '',
                    name: '',
                    status: 'active',
                }}
                data={data}
                isOpen={isOpen}
                onOpenChange={close}
                onSubmit={handleSubmit} // ← Esta es la clave: tu función se pasa aquí
                onDelete={handleDelete}
            >
                {(form, operation) => (
                    <ClassCatalogForm
                        form={form}
                        operation={operation}
                        subjects={subjects}
                        groups={groups || []}
                        schoolCycles={schoolCycles || []}
                        classrooms={classrooms || []}
                        teachers={teachersData || []}
                    />
                )}
            </CrudDialog>
        </div >
    );
}
