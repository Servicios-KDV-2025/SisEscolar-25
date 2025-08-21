import { Badge } from "@repo/ui/components/shadcn/badge"
import { Input } from "@repo/ui/components/shadcn/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select"
import { useState, useEffect } from "react"
import { GroupCard } from "./GroupCard"
import { Button } from "@repo/ui/components/shadcn/button"
import { Plus } from "@repo/ui/icons"
import { Id } from "@repo/convex/convex/_generated/dataModel"
import { User } from "stores/userStore"
import { Group, useGroup } from "stores/groupStore"
import { CrudDialog, useCrudDialog } from "@repo/ui/components/dialog/crud-dialog"
import { groupSchema } from "@/types/form/groupSchema"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/shadcn/form"

type GroupsGridProps = {
    currentSchool: {
        userSchoolId: Id<"userSchool">;
        school: {
            _id: Id<"school">;
            _creationTime: number;
            address: string;
            name: string;
            status: "active" | "inactive";
            email: string;
            phone: string;
            imgUrl: string;
            createdAt: number;
            updatedAt: number;
            subdomain: string;
            shortName: string;
            cctCode: string;
            description: string;
        };
        role: ("superadmin" | "admin" | "auditor" | "teacher" | "tutor")[];
        status: "active" | "inactive";
        department: "direction" | "secretary" | "schoolControl" | "technology" | undefined;
        createdAt: number;
        updatedAt: number;
    } | null;
    currentUser: User | null
}

export function GroupsGrid({ currentSchool, currentUser }: GroupsGridProps) {
    const [groups, setGroups] = useState<Group[]>([])
    const [filteredGroups, setFilteredGroups] = useState<Group[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
    const [gradeFilter, setGradeFilter] = useState<string>("all")

    const {
        groups: groupsFromDb,
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
    } = useGroup(currentSchool?.school._id);

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

    useEffect(() => {
        setGroups(groupsFromDb)
        setFilteredGroups(groupsFromDb)
    }, [groupsFromDb]);

    useEffect(() => {
        let filtered = groups

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(
                (group) =>
                    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    group.grade.toLowerCase().includes(searchTerm.toLowerCase()),
            )
        }

        // Filter by status
        if (statusFilter !== "all") {
            filtered = filtered.filter((group) => group.status === statusFilter)
        }

        // Filter by grade
        if (gradeFilter !== "all") {
            filtered = filtered.filter((group) => group.grade === gradeFilter)
        }

        setFilteredGroups(filtered)
    }, [groups, searchTerm, statusFilter, gradeFilter]);

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
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <Input
                        placeholder="Buscar grupos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-sm"
                    />
                </div>
                <div className="flex justify-end items-center">
                    <Button
                        onClick={openCreate}
                        disabled={isCreatingGroup}
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo Grupo
                    </Button>
                </div>
                <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}>
                        <SelectTrigger className="w-28">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="active">Activo</SelectItem>
                            <SelectItem value="inactive">Inactivo</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={gradeFilter} onValueChange={setGradeFilter}>
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

            {/* Results count */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Mostrando {filteredGroups.length} de {groups.length} grupos
                </p>
                <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                        Active: {groups.filter((g) => g.status === "active").length}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                        Inactive: {groups.filter((g) => g.status === "inactive").length}
                    </Badge>
                </div>
            </div>

            {/* Mostrar errores del store de materias */}
            {(createErrorGroup || updateErrorGroup || deleteErrorGroup) && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="text-sm text-red-600">
                        {createErrorGroup && (
                            <div>Error al crear el grupo: {createErrorGroup}</div>
                        )}
                        {updateErrorGroup && (
                            <div>Error al actualizar el grupo: {updateErrorGroup}</div>
                        )}
                        {deleteErrorGroup && (
                            <div>Error al eliminar el grupo: {deleteErrorGroup}</div>
                        )}
                    </div>
                    <button
                        onClick={clearErrorsGroup}
                        className="text-xs text-blue-500 underline mt-1"
                    >
                        Limpiar errores
                    </button>
                </div>
            )}

            {/* Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

            {/* Empty state */}
            {filteredGroups.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Grupos no encontrados con los criterios de búsqueda.</p>
                </div>
            )}

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
