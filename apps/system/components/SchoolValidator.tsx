'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { useUserWithConvex } from '../stores/userStore';
import { useCurrentSchool } from '../stores/userSchoolsStore';
import { Button } from "@repo/ui/components/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface SchoolValidatorProps {
  children: React.ReactNode;
}

export const SchoolValidator: React.FC<SchoolValidatorProps> = ({ children }) => {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const { currentUser, isLoading: userLoading } = useUserWithConvex(clerkUser?.id);
  const { currentSchool, isLoading: schoolLoading, error: schoolError } = useCurrentSchool(currentUser?._id);
  
  const [showErrorDialog, setShowErrorDialog] = React.useState(false);

  // Detectar errores y mostrar dialog
  React.useEffect(() => {
    if (schoolError) {
      setShowErrorDialog(true);
    } else if (currentSchool && currentSchool.school.status === 'inactive') {
      // También verificar si la escuela está inactiva
      setShowErrorDialog(true);
    } else {
      setShowErrorDialog(false);
    }
  }, [schoolError, currentSchool]);

  const handleGoBack = () => {
    router.push('/');
  };

  const handleRetry = () => {
    setShowErrorDialog(false);
    // Recargar la página para reintentar
    window.location.reload();
  };

  // Si hay error, mostrar la página de error en lugar de los children
  if (showErrorDialog) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Error al acceder a la escuela</CardTitle>
            <CardDescription className="text-base leading-relaxed">
              No se pudo acceder a la escuela solicitada. Por favor comunícate con tu institución para verificar el estado de tu acceso.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Sección de ayuda */}
            <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">
                    ¿Qué puedes hacer?
                  </h3>
                  <div className="text-sm text-yellow-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Verifica que estás usando el enlace correcto</li>
                      <li>Contacta al administrador de tu escuela</li>
                      <li>Comunícate con soporte técnico si el problema persiste</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="flex gap-3">
              <Button 
                onClick={handleRetry}
                variant="outline"
                className="flex-1"
              >
                Reintentar
              </Button>
              <Button 
                onClick={handleGoBack}
                className="flex-1"
                variant="default"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a mis escuelas
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si no hay error, renderizar los children normalmente
  return children;
};
