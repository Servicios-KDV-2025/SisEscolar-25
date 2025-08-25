"use client"

import { useUser } from "@clerk/nextjs"
import { useCurrentSchool } from "stores/userSchoolsStore"
import { useUserWithConvex } from "stores/userStore"
import { SchoolCyclesGrid } from "./SchoolCyclesGrid"

export default function SchoolCyclesPage() {
    const { user: clerkUser, isLoaded } = useUser();
    const { currentUser, isLoading: userLoading } = useUserWithConvex(clerkUser?.id);

    const {
        currentSchool,
        isLoading: schoolLoading,
        error: schoolError,
    } = useCurrentSchool(currentUser?._id);

    const isLoading = !isLoaded || userLoading || schoolLoading;

    // Agrega una verificación adicional para currentSchool
    if (isLoading || !currentSchool || (currentUser && !currentSchool && !schoolError)) return (
        <div className="space-y-8 p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="space-y-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground">Cargando información de ciclos escolares...</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-[90%] mx-auto">
            <h1 className="text-3xl font-bold mb-6">Ciclos Escolares</h1>
            <p className="text-muted-foreground mb-6">
                Esta página muestra el listado de los ciclos escolares registrados en {currentSchool?.school?.name}.
                Cada tarjeta representa un ciclo escolar con su nombre, fechas de inicio y fin, y estado actual (activo, archivado o inactivo).
                Desde aquí puedes visualizar, editar o eliminar ciclos existentes, así como agregar nuevos según sea necesario.
            </p>
            <SchoolCyclesGrid
                currentSchool={currentSchool}
                currentUser={currentUser}
            />
        </div>
    )
}