'use client';

import { useUser } from '@clerk/nextjs';
import { UserSchools } from '../../../../components/UserSchools';

export default function SchoolsPage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            No autenticado
          </h1>
          <p className="text-gray-600">
            Debes iniciar sesión para ver tus escuelas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Mis Escuelas
        </h1>
        <p className="text-gray-600">
          Gestiona las escuelas donde tienes acceso y tus roles
        </p>
      </div>

      <UserSchools clerkId={user.id} />
    </div>
  );
} 