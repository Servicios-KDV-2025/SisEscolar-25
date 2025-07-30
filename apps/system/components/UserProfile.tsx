'use client';

import React, { useState } from 'react';
import { useUserWithConvex } from '../stores/userStore';
import { Button } from '@repo/ui/components/shadcn/button';
import { Input } from '@repo/ui/components/shadcn/input';
import { Label } from '@repo/ui/components/shadcn/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/shadcn/card';
import { Alert, AlertDescription } from '@repo/ui/components/shadcn/alert';
import { Separator } from '@repo/ui/components/shadcn/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/shadcn/avatar';
import { Badge } from '@repo/ui/components/shadcn/badge';
// import { CalendarIcon, MailIcon, PhoneIcon, MapPinIcon, UserIcon } from 'lucide-react';

interface UserProfileProps {
  clerkId?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({ clerkId }) => {
  const {
    currentUser,
    isLoading,
    error,
    updateUserData,
    deactivateUser,
    deleteUser,
    clearError,
  } = useUserWithConvex(clerkId);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    birthDate: '',
    admissionDate: '',
  });

  // Inicializar datos de edición cuando el usuario cambie
  React.useEffect(() => {
    if (currentUser) {
      setEditData({
        name: currentUser.name || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        address: currentUser.address || '',
        birthDate: currentUser.birthDate || '',
        admissionDate: currentUser.admissionDate || '',
      });
    }
  }, [currentUser]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Restaurar datos originales
    if (currentUser) {
      setEditData({
        name: currentUser.name || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        address: currentUser.address || '',
        birthDate: currentUser.birthDate || '',
        admissionDate: currentUser.admissionDate || '',
      });
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;

    const result = await updateUserData(editData);
    if (result) {
      setIsEditing(false);
      clearError();
    }
  };

  const handleDeactivate = async () => {
    if (confirm('¿Estás seguro de que quieres desactivar tu cuenta?')) {
      const result = await deactivateUser();
      if (result) {
        clearError();
      }
    }
  };

  const handleDelete = async () => {
    if (confirm('¿Estás seguro de que quieres eliminar tu cuenta permanentemente? Esta acción no se puede deshacer.')) {
      const result = await deleteUser();
      if (result) {
        clearError();
      }
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Cargando perfil...</CardTitle>
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
      <Card className="w-full max-w-2xl mx-auto">
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
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Mensaje de error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Información del perfil */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={currentUser.imgUrl} alt={currentUser.name} />
              <AvatarFallback>
                {currentUser.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">
                {currentUser.name} {currentUser.lastName}
              </CardTitle>
              <CardDescription className="flex items-center space-x-2">
                {/* <MailIcon className="h-4 w-4" /> */}
                <span>{currentUser.email}</span>
              </CardDescription>
            </div>
          </div>
          <div className="ml-auto">
            <Badge variant={currentUser.status === 'active' ? 'default' : 'secondary'}>
              {currentUser.status === 'active' ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Información personal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                {/* <UserIcon className="h-4 w-4" /> */}
                <span>Nombre</span>
              </Label>
              {isEditing ? (
                <Input
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  placeholder="Nombre"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{currentUser.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                {/* <UserIcon className="h-4 w-4" /> */}
                <span>Apellido</span>
              </Label>
              {isEditing ? (
                <Input
                  value={editData.lastName}
                  onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                  placeholder="Apellido"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{currentUser.lastName || 'No especificado'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                {/* <MailIcon className="h-4 w-4" /> */}
                <span>Email</span>
              </Label>
              {isEditing ? (
                <Input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  placeholder="Email"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{currentUser.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                {/* <PhoneIcon className="h-4 w-4" /> */}
                <span>Teléfono</span>
              </Label>
              {isEditing ? (
                <Input
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  placeholder="Teléfono"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{currentUser.phone || 'No especificado'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                {/* <CalendarIcon className="h-4 w-4" /> */}
                <span>Fecha de nacimiento</span>
              </Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={editData.birthDate}
                  onChange={(e) => setEditData({ ...editData, birthDate: e.target.value })}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {currentUser.birthDate ? new Date(currentUser.birthDate).toLocaleDateString() : 'No especificado'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                {/* <CalendarIcon className="h-4 w-4" /> */}
                <span>Fecha de admisión</span>
              </Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={editData.admissionDate}
                  onChange={(e) => setEditData({ ...editData, admissionDate: e.target.value })}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {currentUser.admissionDate ? new Date(currentUser.admissionDate).toLocaleDateString() : 'No especificado'}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              {/* <MapPinIcon className="h-4 w-4" /> */}
              <span>Dirección</span>
            </Label>
            {isEditing ? (
              <Input
                value={editData.address}
                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                placeholder="Dirección"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{currentUser.address || 'No especificado'}</p>
            )}
          </div>

          <Separator />

          {/* Información del sistema */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Creado:</span>{' '}
              {new Date(currentUser.createdAt).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Actualizado:</span>{' '}
              {new Date(currentUser.updatedAt).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones</CardTitle>
          <CardDescription>
            Gestiona tu cuenta y datos personales
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} disabled={isLoading}>
                Guardar cambios
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleEdit} disabled={isLoading}>
                Editar perfil
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDeactivate} 
                disabled={isLoading || currentUser.status === 'inactive'}
              >
                Desactivar cuenta
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete} 
                disabled={isLoading}
              >
                Eliminar cuenta
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 