'use client';

import React from 'react';
import { Button } from "@repo/ui/components/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface SchoolErrorBoundaryProps {
  children: React.ReactNode;
}

interface SchoolErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class SchoolErrorBoundary extends React.Component<SchoolErrorBoundaryProps, SchoolErrorBoundaryState> {
  constructor(props: SchoolErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): SchoolErrorBoundaryState {
    // Verificar si el error es relacionado con escuela no encontrada
    const isSchoolError = error.message.includes('Escuela no encontrada') || 
                         error.message.includes('inactiva') ||
                         error.message.includes('El usuario no tiene acceso');
    
    if (isSchoolError) {
      return { hasError: true, error };
    }
    
    // Si no es un error de escuela, no lo manejamos aquí
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('SchoolErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <SchoolErrorDialog onRetry={() => this.setState({ hasError: false, error: null })} />;
    }

    return this.props.children;
  }
}

interface SchoolErrorDialogProps {
  onRetry: () => void;
}

function SchoolErrorDialog({ onRetry }: SchoolErrorDialogProps) {
  const router = useRouter();

  const handleGoBack = () => {
    router.push('/');
  };

  const handleRetry = () => {
    onRetry();
  };

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
