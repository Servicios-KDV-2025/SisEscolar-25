// ruta: (por ejemplo) /app/evaluacion/asignaciones/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@repo/ui/components/shadcn/tabs';
import { BookCheck } from '@repo/ui/icons'; // Icono actualizado
import { useUser } from '@clerk/nextjs';
import { useUserWithConvex } from 'stores/userStore';
import { useCurrentSchool } from 'stores/userSchoolsStore';
import { usePermissions } from 'hooks/usePermissions';

import { AssignmentListTab } from 'components/assignment/AssignmentListTab';
import { GradeMatrixTab } from 'components/assignment/GradeMatrixTab';

export default function AssignmentsAndGradesPage() {
  const { user: clerkUser } = useUser();
  const { currentUser } = useUserWithConvex(clerkUser?.id);
  const { currentSchool, isLoading: loadingSchool } = useCurrentSchool(currentUser?._id);

  // Obtenemos los permisos en el contenedor padre
  const permissionsObject = usePermissions(currentSchool?.school._id);

  // Lógica de la pestaña
  const [activeTab, setActiveTab] = useState('assignments');

  const isLoading = loadingSchool || permissionsObject.isLoading;

  useEffect(() => {
    // Si es tutor o auditor, mandar directo a calificaciones
    if (permissionsObject.currentRole === 'tutor' || permissionsObject.currentRole === 'auditor') {
      setActiveTab('grades');
    }
  }, [permissionsObject.currentRole]);
  

  return (
    <div className="container mx-auto p-6">
      {/* Cabecera Principal de la Página */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border mb-6">
        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3 sm:flex-row flex-col  ">
                <div className="p-3 bg-primary/10 rounded-xl">
                  {/* Icono actualizado */}
                  <BookCheck className="h-8 w-8 text-primary" />
                </div>
                <div>
                  {/* Título actualizado */}
                  <h1 className="text-4xl font-bold tracking-tight">Asignaciones y Calificaciones</h1>
                  <p className="text-lg text-muted-foreground">
                    Administra, crea y califica las asignaciones del curso.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        {(permissionsObject.canReadAssignance) ? (
          <>
            <TabsList className="w-full bg-muted/50 p-1 rounded-xl border">
              <TabsTrigger value="assignments">
                <span className="font-semibold">Asignaciones</span>
              </TabsTrigger>
              <TabsTrigger value="grades">
                <span className="font-semibold">Calificaciones</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="assignments">
              {/* PASO 2: Renderizar el componente de Asignaciones.
                Le pasamos los datos comunes. Este componente
                usa 'useTask' que maneja sus propios permisos internos.
              */}
              <AssignmentListTab
                currentUser={currentUser}
                currentSchool={currentSchool}
              />
            </TabsContent>

            <TabsContent value="grades">
              {/* PASO 3: Renderizar el componente de Calificaciones.
                Le pasamos los datos comunes + el objeto de permisos.
              */}
              <GradeMatrixTab
                currentUser={currentUser}
                currentSchool={currentSchool}
                permissions={permissionsObject} // Le pasamos todos los permisos
                isLoading={isLoading}
              />
            </TabsContent>
          </>
        ) : (
          // Si no puede crear, solo mostramos calificaciones (ej. Tutor)
          <TabsContent value="grades">
            <GradeMatrixTab
              currentUser={currentUser}
              currentSchool={currentSchool}
              permissions={permissionsObject}
              isLoading={isLoading}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};