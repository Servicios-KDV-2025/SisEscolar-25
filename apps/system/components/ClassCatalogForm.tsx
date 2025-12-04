import { useEffect, useState } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/shadcn/form";
import { Input } from "@repo/ui/components/shadcn/input";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Subject } from "stores/subjectStore";
import { Group } from "stores/groupStore";
import { ClassroomType, SchoolCycleType, TeacherType } from '@/types/temporalSchema';
import { z } from "zod";
import { FullClassSchema } from "@/types/fullClassSchema";
import CrudFields, { TypeFields } from "@repo/ui/components/dialog/crud-fields";

interface FormularioCatalogoDeClasesProps {
    form: UseFormReturn<z.infer<typeof FullClassSchema>>;
    operation: "create" | "edit" | "view" | "delete";
    subjects: Subject[] | undefined;
    groups: Group[] | undefined;
    schoolCycles: SchoolCycleType[] | undefined;
    classrooms?: ClassroomType[] | undefined;
    teachers: TeacherType[] | undefined;
    activeSchoolCycleId?: string;
    existingClassWarning?: { _id: string; name: string; status: "active" | "inactive" } | null; 
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
    existingClassWarning,
}: FormularioCatalogoDeClasesProps) {
    const [isNombreModificadoManualmente, setIsNombreModificadoManualmente] = useState(false);

    const subjectId = useWatch({ control: form.control, name: "subjectId" });
    const groupId = useWatch({ control: form.control, name: "groupId" });
    const schoolCycleId = useWatch({ control: form.control, name: "schoolCycleId" });

    const selectedCycle = schoolCycles?.find(c => c._id === schoolCycleId);

    useEffect(() => {
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

    // Preparar las opciones para CrudFields
    const subjectOptions = subjects?.map(subject => ({
        value: subject._id,
        label: subject.name
    })) || [];

    const classroomOptions = classrooms?.map(classroom => ({
        value: classroom.id,
        label: classroom.name
    })) || [];

    const teacherOptions = teachers?.map(teacher => ({
        value: teacher._id,
        label: `${teacher.name} ${teacher.lastName}`
    })) || [];

    const groupOptions = groups?.map(group => ({
        value: group._id,
        label: `${group.grade} ${group.name}`
    })) || [];

    // Definir campos para CrudFields
    const crudFields: TypeFields = [
        {
            name: 'subjectId',
            label: 'Materia',
            type: 'select',
            required: true,
            options: subjectOptions,
            placeholder: 'Selecciona una Materia'
        },
        {
            name: 'classroomId',
            label: 'Salón',
            type: 'select',
            required: true,
            options: classroomOptions,
            placeholder: 'Selecciona un Salón'
        },
        {
            name: 'teacherId',
            label: 'Maestro',
            type: 'select',
            required: true,
            options: teacherOptions,
            placeholder: 'Selecciona un Maestro'
        },
        {
            name: 'groupId',
            label: 'Grupo',
            type: 'select',
            required: true,
            options: groupOptions,
            placeholder: 'Selecciona un Grupo'
        },
        {
            name: 'status',
            label: 'Estado',
            type: 'select',
            required: true,
            options: [
                { value: 'active', label: 'Materia activo' },
                { value: 'inactive', label: 'Materia inactivo' }
            ],
            placeholder: 'Selecciona un estado'
        }
    ];

    return (
        <div className="space-y-4">
            {existingClassWarning && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-blue-800">
                                Clase existente detectada
                            </p>
                            <p className="text-sm text-blue-700 mt-1">
                                Ya existe una clase con estas características: <strong>{existingClassWarning.name}</strong>
                            </p>
                            <p className="text-xs text-blue-600 mt-2">
                                Al guardar, esta clase se combinará con la existente y sus horarios se fusionarán.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="space-y-4">
                {/* Ciclo Escolar - Mantener manual porque es solo lectura */}
                <div className="space-y-2">
                    <FormLabel>Ciclo Escolar</FormLabel>
                    <div className="flex h-10 w-full items-center">
                        <Badge variant="secondary" className="text-sm font-normal px-3 py-1">
                            {selectedCycle?.name || "No seleccionado"}
                        </Badge>
                    </div>
                </div>

                {/* Usar CrudFields para los 5 campos de select */}
                <CrudFields 
                    fields={crudFields} 
                    operation={operation} 
                    form={form as unknown as UseFormReturn<Record<string, unknown>>}
                />

                {/* Nombre - Mantener manual por la lógica especial */}
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
                                    disabled={operation === "view" || operation === "edit" || operation === "create"}
                                    minLength={1}
                                    maxLength={40}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
}