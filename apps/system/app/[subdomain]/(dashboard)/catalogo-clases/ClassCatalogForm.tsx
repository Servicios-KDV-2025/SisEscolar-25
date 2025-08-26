import { useEffect, useState } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import {
    FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@repo/ui/components/shadcn/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select";
import { Input } from "@repo/ui/components/shadcn/input";
// import { CicloEscolar, Grupo ,Personal,  Salon } from "@/types/convex-zod-types";
// import { Switch } from "@repo/ui/components/shadcn/switch";
import { Subject } from "stores/subjectStore";
import { Group } from "stores/groupStore";
import { SchoolCycleType, TeacherType } from '@/types/temporalSchema';

interface FormularioCatalogoDeClasesProps {
    form: UseFormReturn<Record<string, unknown>>;
    operation: "create" | "edit" | "view" | "delete";
    subjects: Subject[] | undefined;
    groups: Group[] | undefined;
    schoolCycles: SchoolCycleType[] | undefined;
    salones?: unknown[] | undefined;
    teachers: TeacherType[] | undefined;
    // personal: Personal[] | undefined;
}

export function ClassCatalogForm({
    form,
    operation,
    subjects,
    groups,
    schoolCycles,
    // salones,
    teachers,
    // personal,
}: FormularioCatalogoDeClasesProps) {
    const [isNombreModificadoManualmente, setIsNombreModificadoManualmente] = useState(false);

    const subjectId = useWatch({ control: form.control, name: "materiaId" });
    const groupoId = useWatch({ control: form.control, name: "grupoId" });

    useEffect(() => {
        if (operation === 'view') return;
        const materia = subjects?.find((m) => m._id === subjectId)?.name;
        const grupo = groups?.find((g) => g._id === groupoId)?.name;
        const grado = groups?.find((g) => g._id === groupoId)?.grade;

        if (!isNombreModificadoManualmente && materia && grupo) {
            form.setValue("nombre", `${materia} - ${grado} ${grupo}`);
        }
    }, [subjectId, groupoId, form, groups, isNombreModificadoManualmente, subjects, operation]);

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
                            value={field.value as string}
                            disabled={operation === "view"}
                        >
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un Ciclo Escolar" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {schoolCycles?.map((c) => (
                                    <SelectItem key={c._id} value={c._id}>
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
            {/* <FormField
                control={form.control}
                name="salonId"
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
                                {salones?.map((s) => (
                                    <SelectItem key={s._id} value={s._id}>
                                        {s.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            /> */}

            {/* maestroId */}
            <FormField
                control={form.control}
                name="maestroId"
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
                                        {m.name}
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
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* createdBy */}
            {/* <FormField
                control={form.control}
                name="maestroId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Creado Por</FormLabel>
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
                                {personal?.map((p) => (
                                    <SelectItem key={p._id} value={p._id}>
                                        {p.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            /> 
            */}

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
