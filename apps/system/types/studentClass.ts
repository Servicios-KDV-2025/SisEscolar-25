import { Id } from "@repo/convex/convex/_generated/dataModel";
import { Student } from "./student";
import { ClassCatalog } from "stores/classCatalogStore";
import { SchoolCycleType } from "./temporalSchema";

export type Status = "active" | "inactive";

export interface StudentClasses {
    _id: Id<"studentClass">
    schoolId: Id<"school">
    student: Student;
    classCatalog: ClassCatalog
    schoolCycle: SchoolCycleType
    enrollmentDate: number;
    status: Status;
    averageScore: number
}

export interface EstadisticasInscripciones {
    totalInscripciones: number
    inscripcionesActivas: number
    totalAlumnos: number
    totalClases: number
    promedioClasesPorAlumno: string
}