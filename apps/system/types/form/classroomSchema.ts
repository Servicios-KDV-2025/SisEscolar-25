import { z } from "@repo/zod-config/index"

// esta validacion es solo para el front-end(formulario) -->
export const classroomFormSchema = z.object({
    name: z.string().min(1).max(50),
    capacity: z.number().min(1, "La capacidad debe ser mayor a 0").max(100, "Máximo 100 alumnos"),
    location: z.string().min(1, "Ubicación requerida").max(50, "Máximo 50 caracteres"),
    status: z.enum(["active", "inactive"]).default("active")
})

// este es para DB (como debe quedar guardado el dato en la DB)

export const classroomSchema = classroomFormSchema.extend({
    schoolId: z.string(),
    createdAt: z.number(),
    updatedAt: z.number(),
})


export type ClassroomFormValues = z.input<typeof classroomFormSchema>  //es lo que se recibe del formulario 
export type ClassroomValues = z.infer<typeof classroomSchema> //es lo que se guarda en la DB


/*
1. classroomFormSchema --> valida lo que entra del formulario 
2. classroomSchema --> extiende con los campos obligatorios que vienen de la DB
3. ClassroomFormValues --> se usa en react, con los useState/ react-hook-form, etc
4. ClassroomValues --> se usa cuando se preparen datos para guardar en Convex
*/