'use client';

import React, { useState } from 'react';
import { useUserSchoolsWithConvex } from '../stores/userSchoolsStore';
import { useUserWithConvex } from '../stores/userStore';
import { Button } from '@repo/ui/components/shadcn/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/shadcn/card';
import { Alert, AlertDescription } from '@repo/ui/components/shadcn/alert';
import { Badge } from '@repo/ui/components/shadcn/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/shadcn/avatar';
import { Separator } from '@repo/ui/components/shadcn/separator';
// Iconos comentados temporalmente - instalar lucide-react si se necesitan
// import { 
//   Building2Icon, 
//   MapPinIcon, 
//   PhoneIcon, 
//   MailIcon, 
//   UsersIcon,
//   ShieldIcon,
//   CalendarIcon,
//   GlobeIcon,
//   ExternalLinkIcon
// } from 'lucide-react';

interface UserSchoolsProps {
  clerkId?: string;
}

export const UserSchools: React.FC<UserSchoolsProps> = ({ clerkId }) => {
  const { currentUser } = useUserWithConvex(clerkId);
  const {
    userSchools,
    selectedSchool,
    isLoading,
    error,
    fetchUserActiveSchools,
    updateUserSchool,
    removeUserFromSchool,
    deactivateUserInSchool,
    activateUserInSchool,
    clearError,
  } = useUserSchoolsWithConvex(currentUser?._id);

  const [showInactive, setShowInactive] = useState(false);

  // Filtrar escuelas según el estado
  const filteredSchools = showInactive 
    ? userSchools 
    : userSchools.filter(school => school.status === 'active');

  const handleToggleStatus = async (userSchoolId: string, currentStatus: 'active' | 'inactive') => {
    if (currentStatus === 'active') {
      await deactivateUserInSchool(userSchoolId as any);
    } else {
      await activateUserInSchool(userSchoolId as any);
    }
  };

  const handleRemoveFromSchool = async (userSchoolId: string) => {
    if (confirm('¿Estás seguro de que quieres removerte de esta escuela?')) {
      await removeUserFromSchool(userSchoolId as any);
    }
  };

  const handleGoToDashboard = (subdomain: string) => {
    const dashboardUrl = `http://${subdomain}.localhost:3000/inicio`;
    window.open(dashboardUrl, '_blank');
  };

  const getRoleBadgeVariant = (roles: string[]) => {
    if (roles.includes('superadmin')) return 'destructive';
    if (roles.includes('admin')) return 'default';
    if (roles.includes('auditor')) return 'secondary';
    if (roles.includes('teacher')) return 'outline';
    return 'outline';
  };

  const getDepartmentIcon = (department?: string) => {
    switch (department) {
      case 'secretary': return '📋';
      case 'direction': return '👔';
      case 'schoolControl': return '📊';
      case 'technology': return '💻';
      default: return '🏢';
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Cargando escuelas...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentUser) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Usuario no encontrado</CardTitle>
          <CardDescription>
            No se pudo cargar la información del usuario.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Mensaje de error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                {/* <Building2Icon className="h-6 w-6" /> */}
                Mis Escuelas
              </CardTitle>
              <CardDescription>
                Gestiona las escuelas donde tienes acceso
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showInactive ? "default" : "outline"}
                size="sm"
                onClick={() => setShowInactive(!showInactive)}
              >
                {showInactive ? "Ocultar inactivas" : "Mostrar inactivas"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {/* <Building2Icon className="h-4 w-4 text-blue-500" /> */}
              <span className="text-sm font-medium">Total de escuelas</span>
            </div>
            <p className="text-2xl font-bold">{userSchools.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {/* <ShieldIcon className="h-4 w-4 text-green-500" /> */}
              <span className="text-sm font-medium">Escuelas activas</span>
            </div>
            <p className="text-2xl font-bold">
              {userSchools.filter(s => s.status === 'active').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {/* <UsersIcon className="h-4 w-4 text-purple-500" /> */}
              <span className="text-sm font-medium">Roles diferentes</span>
            </div>
            <p className="text-2xl font-bold">
              {new Set(userSchools.flatMap(s => s.role)).size}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de escuelas */}
      {filteredSchools.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            {/* <Building2Icon className="h-12 w-12 mx-auto text-gray-400 mb-4" /> */}
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {showInactive ? "No tienes escuelas inactivas" : "No tienes escuelas asignadas"}
            </h3>
            <p className="text-gray-600">
              {showInactive 
                ? "Todas tus escuelas están activas" 
                : "Contacta a un administrador para que te asigne a una escuela"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSchools.map((userSchool) => (
            <Card key={userSchool.userSchoolId} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={userSchool.school.imgUrl} alt={userSchool.school.name} />
                      <AvatarFallback>
                        {userSchool.school.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl">{userSchool.school.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        {/* <GlobeIcon className="h-4 w-4" /> */}
                        <span>{userSchool.school.subdomain}</span>
                        <span>•</span>
                        <span>{userSchool.school.shortName}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={userSchool.status === 'active' ? 'default' : 'secondary'}>
                      {userSchool.status === 'active' ? 'Activo' : 'Inactivo'}
                    </Badge>
                    {userSchool.department && (
                      <Badge variant="outline">
                        {getDepartmentIcon(userSchool.department)} {userSchool.department}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Información de la escuela */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wide">
                      Información de la escuela
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        {/* <MapPinIcon className="h-4 w-4 text-gray-400" /> */}
                        <span>{userSchool.school.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {/* <PhoneIcon className="h-4 w-4 text-gray-400" /> */}
                        <span>{userSchool.school.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {/* <MailIcon className="h-4 w-4 text-gray-400" /> */}
                        <span>{userSchool.school.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {/* <CalendarIcon className="h-4 w-4 text-gray-400" /> */}
                        <span>CCT: {userSchool.school.cctCode}</span>
                      </div>
                    </div>
                    {userSchool.school.description && (
                      <p className="text-sm text-gray-600 mt-3">
                        {userSchool.school.description}
                      </p>
                    )}
                  </div>

                  {/* Información del usuario en la escuela */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wide">
                      Tu rol en esta escuela
                    </h4>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {userSchool.role.map((role) => (
                          <Badge 
                            key={role} 
                            variant={getRoleBadgeVariant([role])}
                            className="text-xs bg-amber-300 text-gray-800"
                          >
                            {role}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Asignado:</span>{' '}
                        {new Date(userSchool.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Actualizado:</span>{' '}
                        {new Date(userSchool.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Acciones */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleGoToDashboard(userSchool.school.subdomain)}
                  >
                    Ir al Dashboard
                  </Button>
                  <Button
                    variant={userSchool.status === 'active' ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => handleToggleStatus(userSchool.userSchoolId, userSchool.status)}
                  >
                    {userSchool.status === 'active' ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveFromSchool(userSchool.userSchoolId)}
                  >
                    Remover de escuela
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}; 