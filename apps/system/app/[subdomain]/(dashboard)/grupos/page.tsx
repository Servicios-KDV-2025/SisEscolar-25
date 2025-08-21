"use client";

import { useUser } from "@clerk/nextjs";
import { useCurrentSchool } from "stores/userSchoolsStore";
import { useUserWithConvex } from "stores/userStore";
import { GroupsGrid } from "./GroupGrid";

export default function GroupPage() {
    const { user: clerkUser, isLoaded } = useUser();
    const { currentUser, isLoading: userLoading } = useUserWithConvex(clerkUser?.id);

    const {
        currentSchool,
        isLoading: schoolLoading,
        error: schoolError,
    } = useCurrentSchool(currentUser?._id);

    const isLoading = !isLoaded || userLoading || schoolLoading;

    if (isLoading || (currentUser && !currentSchool && !schoolError)) return (
        <div className="space-y-8 p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="space-y-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground">Cargando información de las materias...</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-[90%] mx-auto">
            <h1 className="text-3xl font-bold mb-6">Grupo</h1>
            <p className="text-muted-foreground mb-6">
                Esta página muestra el listado de los grupos registradas en {currentSchool?.school?.name}.
                Cada tarjeta representa una materia con su nombre, descripción, número de
                créditos y estado actual (activa o inactiva). Desde aquí puedes
                visualizar, editar o eliminar materias existentes, así como agregar
                nuevas según sea necesario para el plan de estudios.
            </p>
            <GroupsGrid
                currentSchool={currentSchool}
                currentUser={currentUser}
            />
        </div>
    )
}
