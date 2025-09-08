"use client";

import { classCatalogSchema } from "@/types/form/classCatalogSchema";
import { useUser } from "@clerk/nextjs";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { CrudDialog, useCrudDialog } from "@repo/ui/components/dialog/crud-dialog";
import { Button } from "@repo/ui/components/shadcn/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/shadcn/table";
import { Eye, Pencil, Plus, Trash2 } from "@repo/ui/icons";
import { useClassCatalog } from "stores/classCatalogStore";
import { useGroup } from "stores/groupStore";
import { useSubject } from "stores/subjectStore";
import { useCurrentSchool } from "stores/userSchoolsStore";
import { useUserWithConvex } from "stores/userStore";
import { ClassCatalogForm } from "./ClassCatalogForm";
import { useQuery } from 'convex/react';
import { api } from '@repo/convex/convex/_generated/api';
import { toast } from 'sonner';

export default function ClassCatalogPage() {
    // Get current user from Clerk
    const { user: clerkUser, isLoaded } = useUser();
    const { currentUser, isLoading: userLoading } = useUserWithConvex(clerkUser?.id);

    // Get current school information using the subdomain
    const {
        currentSchool,
        isLoading: schoolLoading,
        error: schoolError,
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

    if (isLoading || (currentUser && !currentSchool && !schoolError)) {
        return (
            <div className="space-y-8 p-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="space-y-4 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="text-muted-foreground">Cargando información de catálogo de clases...</p>
                    </div>
                </div>
            </div>
        )
    };

    return (
        <div className="w-[90%] mx-auto">
            <h1 className="text-3xl font-bold mb-6">Catalogo de Clases</h1>
            <p className="text-muted-foreground mb-6">
                Esta página muestra el listado de las clases registradas en {currentSchool?.school?.name}.
                Cada fila representa una clase con su nombre, ciclo escolar, materia, etc. Desde aquí puedes
                visualizar, editar o eliminar materias existentes, así como agregar
                nuevas según sea necesario para el plan de estudios.
            </p>

            <div className="flex flex-row items-center justify-between mt-6 mb-2">
                <h2 className="text-xl font-semibold">Gestión de Catálogo por Clase</h2>
                <Button
                    onClick={openCreate}
                    disabled={isCreatingClassCat}
                    className="flex items-center gap-2"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Clase
                </Button>
            </div>

            {/* Mostrar errores del store de materias */}
            {(createClassCatError || updateClassCatError || deleteClassCatError) && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="text-sm text-red-600">
                        {createClassCatError && (
                            <div>Error al crear materia: {createClassCatError}</div>
                        )}
                        {updateClassCatError && (
                            <div>Error al actualizar materia: {updateClassCatError}</div>
                        )}
                        {deleteClassCatError && (
                            <div>Error al eliminar materia: {deleteClassCatError}</div>
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

            <div className="overflow-x-auto">
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
                        {classCatalogs?.length === 0
                            ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center text-muted-foreground p-3">
                                        No hay salones registrados para esta escuela.
                                    </TableCell>
                                </TableRow>
                            )
                            : (
                                classCatalogs?.map(classCat => (
                                    <TableRow key={classCat._id}>
                                        <TableCell className="font-medium">{classCat.name}</TableCell>
                                        <TableCell>{classCat.schoolCycle?.name}</TableCell>
                                        <TableCell>{classCat.subject?.name}</TableCell>
                                        <TableCell>{classCat.classroom?.name}</TableCell>
                                        <TableCell>{classCat.teacher?.name} {classCat.teacher?.lastName}</TableCell>
                                        <TableCell>{classCat.group?.grade} {classCat.group?.name}</TableCell>
                                        <TableCell>
                                            <span className={`${classCat.status === 'active' ? 'bg-green-600' : 'bg-red-600'} text-white rounded-2xl p-2`}>
                                                {classCat.status === 'active' ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </TableCell>
                                        <TableCell>{classCat.createData?.name} {classCat.createData?.lastName}</TableCell>
                                        <TableCell className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    openView(classCat);
                                                }}
                                                disabled={isUpdatingClassCat || isDeletingClassCat}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    openEdit(classCat);
                                                }}
                                                disabled={isUpdatingClassCat || isDeletingClassCat}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    openDelete(classCat)
                                                }}
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

            {/* CrudDialog */}
            <CrudDialog
                operation={operation}
                title={operation === 'create'
                    ? 'Crear Nuevo Catálogo de Clase'
                    : operation === 'edit'
                        ? 'Editar Catálogo de Clase'
                        : 'Ver Catálogo de Clase'
                }
                description={operation === 'create'
                    ? 'Completa la información del Catálogo de Clase'
                    : operation === 'edit'
                        ? 'Modifica la información del Catálogo de Clase'
                        : 'Información del Catálogo de Clase'
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
        </div>
    );
}
