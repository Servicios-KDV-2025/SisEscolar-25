"use client";

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useMutation } from 'convex/react';
import { api } from '../../../../packages/convex/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Id } from '../../../../packages/convex/convex/_generated/dataModel';

// Interface basada en el schema de Convex
interface SchoolFormData {
  name: string;
  subdomain: string;
  shortName: string;
  cctCode: string;
  address: string;
  description: string; // Requerido según el schema de Convex
  imgUrl: string;
  phone: string;
  email: string;
}

interface SchoolFormProps {
  onSuccess?: (schoolData: SchoolFormData) => void;
  onNext?: () => void;
}

function SchoolForm({ onSuccess, onNext }: SchoolFormProps) {
  const { user } = useUser();
  const createSchoolWithUser = useMutation(api.functions.schools.createSchoolWithUser);
  
  const [formData, setFormData] = useState<SchoolFormData>({
    name: '',
    subdomain: '',
    shortName: '',
    cctCode: '',
    address: '',
    description: '',
    imgUrl: '',
    phone: '',
    email: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError(null);
  };

  const validateForm = (): boolean => {
    // Validar campos requeridos según el schema de Convex
    if (!formData.name.trim()) {
      setError('El nombre de la escuela es requerido');
      return false;
    }
    if (!formData.subdomain.trim()) {
      setError('El subdominio es requerido');
      return false;
    }
    if (!formData.shortName.trim()) {
      setError('El nombre corto es requerido');
      return false;
    }
    if (!formData.cctCode.trim()) {
      setError('El código CCT es requerido');
      return false;
    }
    if (!formData.address.trim()) {
      setError('La dirección es requerida');
      return false;
    }
    if (!formData.description.trim()) {
      setError('La descripción es requerida');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('El teléfono es requerido');
      return false;
    }
    if (!formData.email.trim()) {
      setError('El email es requerido');
      return false;
    }
    
    // Validar formato de subdominio (debe ser único)
    if (!/^[a-z0-9-]+$/.test(formData.subdomain.trim())) {
      setError('El subdominio solo puede contener letras minúsculas, números y guiones');
      return false;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('El formato del email no es válido');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Usuario no autenticado');
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Crear la escuela y asignar al usuario como superadmin usando Convex
      const result = await createSchoolWithUser({
        name: formData.name.trim(),
        subdomain: formData.subdomain.trim(),
        shortName: formData.shortName.trim(),
        cctCode: formData.cctCode.trim(),
        address: formData.address.trim(),
        description: formData.description.trim(),
        imgUrl: formData.imgUrl.trim() || '/default-school.jpg',
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        userId: user.id as Id<"user">,
      });
      
      console.log('Escuela creada:', result);
      setSuccess(true);
      
      // Llamar a la función de éxito si existe
      if (onSuccess) {
        onSuccess(formData);
      }
      
      // Limpiar el formulario
      setFormData({
        name: '',
        subdomain: '',
        shortName: '',
        cctCode: '',
        address: '',
        description: '',
        imgUrl: '',
        phone: '',
        email: '',
      });
      
    } catch (err: any) {
      console.error('Error creating school:', err);
      setError(err.message || 'Error al crear la escuela. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };


  if (success) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">¡Escuela creada exitosamente!</h3>
            <p className="text-muted-foreground mb-4">
              Puedes continuar con el siguiente paso.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Registro de Escuela</CardTitle>
        <CardDescription>
          Completa la información de tu escuela. Al ser el primer usuario, serás asignado como superadministrador.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la Escuela *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Nombre completo de la escuela"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortName">Nombre Corto *</Label>
              <Input
                id="shortName"
                name="shortName"
                value={formData.shortName}
                onChange={handleInputChange}
                placeholder="Abreviatura o nombre corto"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdominio *</Label>
              <Input
                id="subdomain"
                name="subdomain"
                value={formData.subdomain}
                onChange={handleInputChange}
                placeholder="subdominio.ekardex.io"
                required
              />
              <p className="text-sm text-muted-foreground">
                Solo letras minúsculas, números y guiones (debe ser único)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cctCode">Código CCT *</Label>
              <Input
                id="cctCode"
                name="cctCode"
                value={formData.cctCode}
                onChange={handleInputChange}
                placeholder="Código CCT de la escuela"
                required
              />
              <p className="text-sm text-muted-foreground">
                Debe ser único
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección *</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Dirección completa de la escuela"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Descripción de la escuela, misión, visión..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono *</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Teléfono de contacto"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email de contacto"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imgUrl">URL de Imagen</Label>
            <Input
              id="imgUrl"
              name="imgUrl"
              value={formData.imgUrl}
              onChange={handleInputChange}
              placeholder="https://ejemplo.com/imagen.jpg"
              type="url"
            />
            <p className="text-sm text-muted-foreground">
              Deja vacío para usar una imagen por defecto
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando escuela...
              </>
            ) : (
              'Registrar Escuela'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default SchoolForm;