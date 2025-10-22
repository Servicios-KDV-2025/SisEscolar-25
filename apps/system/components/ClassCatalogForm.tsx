import { useEffect, useState } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/shadcn/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select";
import { Input } from "@repo/ui/components/shadcn/input";
import { Subject } from "stores/subjectStore";
import { Group } from "stores/groupStore";
import { ClassroomType, SchoolCycleType, TeacherType } from '@/types/temporalSchema';
import { z } from "zod";
import { FullClassSchema } from "@/types/fullClassSchema";

interface FormularioCatalogoDeClasesProps {
    form: UseFormReturn<z.infer<typeof FullClassSchema>>;
    operation: "create" | "edit" | "view" | "delete";
    subjects: Subject[] | undefined;
    groups: Group[] | undefined;
    schoolCycles: SchoolCycleType[] | undefined;
    classrooms?: ClassroomType[] | undefined;
    teachers: TeacherType[] | undefined;
     activeSchoolCycleId?: string; 
}

export function ClassCatalogForm({
    form,
    operation,
    subjects,
    groups,
    schoolCycles,
    classrooms,
    teachers,
    activeSchoolCycleId,
}: FormularioCatalogoDeClasesProps) {
    const [isNombreModificadoManualmente, setIsNombreModificadoManualmente] = useState(false);

    const subjectId = useWatch({ control: form.control, name: "subjectId" });
    const groupId = useWatch({ control: form.control, name: "groupId" });

    useEffect(() => {
        // Se ejecuta solo al crear y si el campo aún no tiene un valor.
        if (operation === 'create' && activeSchoolCycleId && !form.getValues("schoolCycleId")) {
            form.setValue("schoolCycleId", activeSchoolCycleId, { shouldValidate: true });
        }
    }, [operation, activeSchoolCycleId, form]);

    useEffect(() => {
        if (operation === 'view') return;
        const materia = subjects?.find((m) => m._id === subjectId)?.name;
        const grupo = groups?.find((g) => g._id === groupId)?.name;
        const grado = groups?.find((g) => g._id === groupId)?.grade;

        if (!isNombreModificadoManualmente && materia && grupo) {
            form.setValue("name", `${materia} - ${grado} ${grupo}`);
        }
    }, [subjectId, groupId, form, groups, isNombreModificadoManualmente, subjects, operation]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="schoolCycleId"
                render={({ field }) => ( 
                    <FormItem>
                        <FormLabel>Ciclo Escolar</FormLabel>
                        <Select
                            onValueChange={field.onChange}
                            value={field.value ?? ""}
                            disabled={operation === "view"}
                        >
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un Ciclo Escolar" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {schoolCycles?.map((c) => (
                                    <SelectItem disabled={true} key={c._id} value={c._id}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* materiaId */}
            <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Materia</FormLabel>
                        <Select
                            onValueChange={field.onChange}
                            value={field.value as string}
                            disabled={operation === "view"}
                        >
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una Materia" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {subjects?.map((m) => (
                                    <SelectItem key={m._id} value={m._id}>
                                        {m.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* salonId */}
            <FormField
                control={form.control}
                name="classroomId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Salón</FormLabel>
                        <Select
                            onValueChange={field.onChange}
                            value={field.value as string}
                            disabled={operation === "view"}
                        >
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un Salón" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {classrooms?.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* maestroId */}
            <FormField
                control={form.control}
                name="teacherId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Maestro</FormLabel>
                        <Select
                            onValueChange={field.onChange}
                            value={field.value as string}
                            disabled={operation === "view"}
                        >
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un Maestro" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {teachers?.map((m) => (
                                    <SelectItem key={m._id} value={m._id}>
                                        {m.name} {m.lastName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* grupoId */}
            <FormField
                control={form.control}
                name="groupId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Grupo</FormLabel>
                        <Select
                            onValueChange={field.onChange}
                            value={field.value as string}
                            disabled={operation === "view"}
                        >
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un Grupo" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {groups?.map((g) => (
                                    <SelectItem key={g._id} value={g._id}>
                                        {g.grade} {g.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* nombre */}
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                            <Input
                                type="text"
                                {...field}
                                value={field.value as string || ""}
                                onChange={(e) => {
                                    field.onChange(e);
                                    setIsNombreModificadoManualmente(true);
                                }}
                                placeholder="Ej: Matemáticas - Grupo A"
                                disabled={operation === "view"}
                                minLength={1}
                                maxLength={40}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
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
                                <SelectItem value="active">Materia activo</SelectItem>
                                <SelectItem value="inactive">Materia inactivo</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div >
    );
}
