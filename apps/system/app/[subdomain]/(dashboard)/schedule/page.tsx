"use client";

import { useUser } from "@clerk/nextjs";
import { api } from "@repo/convex/convex/_generated/api";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { Button } from "@repo/ui/components/shadcn/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/shadcn/table";
import { Eye, Pencil, Plus, Trash2 } from "@repo/ui/icons";
import { useQuery } from "convex/react";
import { useCurrentSchool } from "stores/userSchoolsStore";
import { useUserWithConvex } from "stores/userStore";

export default function SchedulePage() {
    // Get current user from Clerk
    const { user: clerkUser/* , isLoaded */ } = useUser();
    const { currentUser/* , isLoading: userLoading */ } = useUserWithConvex(clerkUser?.id);

    // Get current school information using the subdomain
    const {
        currentSchool,
        // isLoading: schoolLoading,
        // error: schoolError,
    } = useCurrentSchool(currentUser?._id);

    const schedule = useQuery(api.functions.schedule.getSchedulesBySchools, currentSchool ? { schoolId: currentSchool?.school._id as Id<"school"> } : "skip");
    
    return (
        <main className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-6">Horario</h1>
            <p className="text-muted-foreground mb-6">
                Aquí puedes ver y gestionar todos los horarios disponibles en la escuela.
                Haz clic en los botones para ver información más precisa, editar o eliminarlo.
                Para crear un nuevo Horario, usa el botón Nuevo Horario.
            </p>

            <div className="flex flex-row items-center justify-between mt-6 mb-2">
                <h2 className="text-xl font-semibold">Gestión del Horario</h2>
                <Button onClick={() => { }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Horario
                </Button>
            </div>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[120px]">Nombre</TableHead>
                            <TableHead>Hora de inico</TableHead>
                            <TableHead>Hora de fin</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {schedule?.length === 0
                            ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                                        No hay horarios registrados para esta escuela.
                                    </TableCell>
                                </TableRow>
                            )
                            : (
                                schedule?.map(schedule => (
                                    <TableRow key={schedule._id}>
                                        <TableCell className="font-medium">{schedule.name}</TableCell>
                                        <TableCell>{schedule.startTime}</TableCell>
                                        <TableCell>{schedule.endTime}</TableCell>
                                        <TableCell>
                                            <span className={`${schedule.status === 'active' ? 'bg-green-600' : 'bg-red-600'} text-white rounded-2xl p-2`}>
                                                {schedule.status === 'active' ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="flex justify-end gap-2">
                                            <Button variant='outline' size='sm' onClick={() => {/* openView({ ...clase, _id: clase._id }) */ }}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button variant='outline' size='sm' onClick={() => {/* openEdit({ ...clase, _id: clase._id }) */ }}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant='destructive' size='sm' onClick={() => {/* openDelete({ ...clase, _id: clase._id }) */ }}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )
                        }
                    </TableBody>
                </Table>
            </div>
        </main>
    )
}