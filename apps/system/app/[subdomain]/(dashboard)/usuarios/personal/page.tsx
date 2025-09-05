"use client";

import React, { useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/convex/convex/_generated/api";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/shadcn/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/shadcn/avatar";
import { CrudDialog, useCrudDialog } from "@repo/ui/components/dialog/crud-dialog";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@repo/ui/components/shadcn/form";
import { 
  Shield, Users, Search, Plus, Eye, Edit, Trash2, Filter, 
  Mail, Phone, MapPin, Calendar, AlertCircle,
  CheckCircle, Building2, BookOpen, Search as SearchIcon
} from "@repo/ui/icons";
import { Alert, AlertDescription } from "@repo/ui/components/shadcn/alert";
import { 
  unifiedUserSchema, 
  unifiedUserCreateSchema, 
  unifiedUserEditSchema
} from "@/types/form/userSchemas";
import { useUserWithConvex } from "../../../../../stores/userStore";
import { useCurrentSchool } from "../../../../../stores/userSchoolsStore";
import { useUserActionsWithConvex } from "../../../../../stores/userActionsStore";

// Tipo para los usuarios que vienen de Convex
type UserFromConvex = {
  _id: Id<"user">;
  name: string;
  lastName?: string;
  email: string;
  phone?: string;
  address?: string;
  birthDate?: number;
  admissionDate?: number;
  imgUrl?: string;
  createdAt: number;
  updatedAt: number;
  clerkId: string;
  status?: 'active' | 'inactive';
  userSchoolId: Id<"userSchool">;
  schoolRole: Array<'superadmin' | 'admin' | 'auditor' | 'teacher' | 'tutor'>;
  schoolStatus: 'active' | 'inactive';
  department?: 'secretary' | 'direction' | 'schoolControl' | 'technology';
};

// Tipo para el resultado de búsqueda de usuarios
type SearchUserResult = {
  _id: Id<"user">;
  name: string;
  lastName?: string;
  email: string;
  clerkId: string;
  status?: 'active' | 'inactive';
  createdAt: number;
  updatedAt: number;
};

// Función para obtener el esquema correcto según la operación
const getSchemaForOperation = (operation: string) => {
  switch (operation) {
    case 'create':
      return unifiedUserCreateSchema;
    case 'edit':
      return unifiedUserEditSchema;
    default:
      return unifiedUserSchema;
  }
};

// Configuración de roles
const roleConfig = {
  superadmin: {
    label: "Super-Admin",
    color: "bg-red-100 text-red-800",
    icon: Shield,
    description: "Acceso completo sin restricciones"
  },
  admin: {
    label: "Administrador",
    color: "bg-blue-100 text-blue-800",
    icon: Building2,
    description: "Acceso administrativo departamental"
  },
  auditor: {
    label: "Auditor",
    color: "bg-green-100 text-green-800",
    icon: SearchIcon,
    description: "Acceso de auditoría y verificación"
  },
  teacher: {
    label: "Docente",
    color: "bg-purple-100 text-purple-800",
    icon: BookOpen,
    description: "Acceso de enseñanza y evaluación"
  },
  tutor: {
    label: "Tutor",
    color: "bg-orange-100 text-orange-800",
    icon: Users,
    description: "Acceso a información de alumnos"
  }
};

const departmentConfig = {
  secretary: { label: "Secretaría", color: "bg-blue-100 text-blue-800" },
  direction: { label: "Dirección", color: "bg-purple-100 text-purple-800" },
  schoolControl: { label: "Control Escolar", color: "bg-green-100 text-green-800" },
  technology: { label: "Tecnología", color: "bg-orange-100 text-orange-800" }
};

export default function PersonalPage() {
  const { user: clerkUser } = useUser();

  // Obtener usuario actual
  const { currentUser } = useUserWithConvex(clerkUser?.id);
  
  // Obtener escuela actual por subdominio
  const { currentSchool, isLoading: schoolLoading } = useCurrentSchool(currentUser?._id);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  // Obtener usuarios de la escuela actual (todos los roles)
  const allUsers = useQuery(
    api.functions.schools.getUsersBySchoolAndRoles,
    currentSchool?.school?._id ? {
      schoolId: currentSchool.school._id,
      roles: ['superadmin', 'admin', 'auditor', 'teacher'],
      status: "active"
    } : "skip"
  );

  // User Actions Store para CRUD operations
  const userActions = useUserActionsWithConvex();
  

  
  // Mutations para gestión de relaciones usuario-escuela
  const createUserSchoolRelation = useMutation(api.functions.schools.createUserSchool);
  const updateUserSchoolRelation = useMutation(api.functions.userSchool.update);
  const deactivateUserInSchool = useMutation(api.functions.schools.deactivateUserInSchool);

  // Estado para búsqueda dinámica de usuario
  const [searchEmail, setSearchEmail] = useState<string | null>(null);
  const [searchResultPromise, setSearchResultPromise] = useState<{
    resolve: (value: SearchUserResult[]) => void;
    reject: (reason?: unknown) => void;
  } | null>(null);
  
  // Query para buscar usuario por email cuando se necesite
  const searchResult = useQuery(
    api.functions.users.searchUsers,
    searchEmail ? {
      searchTerm: searchEmail,
      status: "active",
      limit: 1
    } : "skip"
  );

  // Effect para resolver la promesa cuando llegue el resultado
  React.useEffect(() => {
    if (searchResultPromise && searchResult !== undefined) {
      searchResultPromise.resolve(searchResult);
      setSearchResultPromise(null);
      setSearchEmail(null);
    }
  }, [searchResult, searchResultPromise]);

  // Función auxiliar para buscar usuario de manera asíncrona
  const searchUserByEmailAsync = (email: string): Promise<SearchUserResult[]> => {
    return new Promise((resolve, reject) => {
      setSearchResultPromise({ resolve, reject });
      setSearchEmail(email);
    });
  };

  // Hook del CRUD Dialog
  const {
    isOpen,
    operation,
    data,
    openCreate,
    openEdit,
    openView,
    openDelete,
    close,
  } = useCrudDialog(unifiedUserSchema, {
    status: "active",
    admissionDate: Date.now(),
    role: "teacher", // Valor por defecto
  });

  // Funciones wrapper para abrir diálogos con limpieza de errores
  const handleOpenCreate = () => {
    userActions.clearErrors();
    userActions.clearLastResult();
    openCreate();
  };

  const handleOpenEdit = (user: UserFromConvex) => {
    console.log("✏️ handleOpenEdit LLAMADO - User data:", user);
    console.log("✏️ handleOpenEdit - Keys disponibles:", Object.keys(user));
    console.log("✏️ handleOpenEdit - userSchoolId:", user.userSchoolId);
    userActions.clearErrors();
    userActions.clearLastResult();
    
    // Preparar datos para edición incluyendo el rol principal y userSchoolId
    const editData = {
      ...user,
      role: user.schoolRole[0], // Tomar el primer rol como principal
      userSchoolId: user.userSchoolId, // Asegurar que se incluya el userSchoolId
    };
    
    console.log("✏️ editData preparado:", editData);
    openEdit(editData);
  };

  const handleOpenView = (user: UserFromConvex) => {
    userActions.clearErrors();
    userActions.clearLastResult();
    
    // Preparar datos para vista incluyendo el rol principal y userSchoolId
    const viewData = {
      ...user,
      role: user.schoolRole[0], // Tomar el primer rol como principal
      userSchoolId: user.userSchoolId, // Asegurar que se incluya el userSchoolId
    };
    
    openView(viewData);
  };

  const handleOpenDelete = (user: UserFromConvex) => {
    userActions.clearErrors();
    userActions.clearLastResult();
    openDelete(user);
  };

  // Filtrado de datos - Excluir tutores
  const filteredUsers = useMemo(() => {
    if (!allUsers) return [];
    
    return allUsers
      .filter((user: UserFromConvex) => !user.schoolRole.includes('tutor')) // Excluir tutores
      .filter((user: UserFromConvex) => {
        const searchMatch = 
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        const statusMatch = statusFilter === "all" || (user.status || 'active') === statusFilter;
        
        const roleMatch = roleFilter === "all" || user.schoolRole.includes(roleFilter as 'superadmin' | 'admin' | 'auditor' | 'teacher' | 'tutor');
        
        const departmentMatch = departmentFilter === "all" || user.department === departmentFilter;
        
        return searchMatch && statusMatch && roleMatch && departmentMatch;
      });
  }, [allUsers, searchTerm, statusFilter, roleFilter, departmentFilter]);

  // Funciones CRUD
  const handleCreate = async (formData: Record<string, unknown>) => {
    console.log("Datos recibidos en handleCreate:", formData);
    
    if (!currentSchool?.school?._id) {
      console.error("No hay escuela actual disponible");
      throw new Error("No hay escuela actual disponible");
    }

    const email = formData.email as string;
    const selectedRole = formData.role as string;
    const selectedDepartment = formData.department as string;
    
    // IMPORTANTE: Solo los administradores pueden tener departamento
    // Para cualquier otro rol, el departamento debe ser undefined
    const departmentValue = selectedRole === "admin" 
      ? (selectedDepartment === "none" ? undefined : selectedDepartment)
      : undefined; // Forzar undefined para roles que no son admin
    
    console.log("📋 Creando usuario con rol:", selectedRole, "y departamento:", departmentValue);
    
    try {
      // PASO 1: Buscar si el usuario ya existe en Convex
      console.log("🔍 Buscando usuario existente por email:", email);
      
      const existingUsers = await searchUserByEmailAsync(email);

      if (existingUsers && existingUsers.length > 0) {
        // FLUJO A: Usuario existe, solo asignar a escuela
        const existingUser = existingUsers[0];
        
        if (!existingUser?.clerkId || !existingUser?.name || !existingUser?.email) {
          throw new Error("Error al obtener datos completos del usuario existente");
        }
        
        console.log("✅ Usuario encontrado:", existingUser.name, existingUser.email);
        console.log("📋 Asignando usuario existente a la escuela actual...");

        await createUserSchoolRelation({
          clerkId: existingUser.clerkId,
          schoolId: currentSchool.school._id,
          role: [selectedRole as 'superadmin' | 'admin' | 'auditor' | 'teacher' | 'tutor'],
          status: 'active',
          department: departmentValue as 'secretary' | 'direction' | 'schoolControl' | 'technology' | undefined,
        });

        console.log("🎉 Usuario existente asignado exitosamente!");
        return;
      }

      // FLUJO B: Usuario no existe, crear nuevo en Clerk + asignar
      console.log("👤 Usuario no existe, creando nuevo en Clerk...");
      
      const password = formData.password as string;
      
      // Validación: Si no existe el usuario, la contraseña es obligatoria
      if (!password || password.trim() === "") {
        throw new Error("La contraseña es requerida para crear un usuario nuevo. Si el usuario ya existe en el sistema, se asignará automáticamente.");
      }
      
      const createData = {
        email: email,
        password: password,
        name: formData.name as string,
        lastName: formData.lastName as string,
      };

      const result = await userActions.createUser(createData);
      
      if (result.success && result.userId) {
        console.log("✅ Usuario creado en Clerk exitosamente:", result.userId);
        
        try {
          // Esperar sincronización del webhook
          console.log("⏳ Esperando sincronización del webhook...");
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 segundos
          
          // Asignar rol en la escuela actual
          console.log("📋 Asignando nuevo usuario a la escuela actual...");
          await createUserSchoolRelation({
            clerkId: result.userId,
            schoolId: currentSchool.school._id,
            role: [selectedRole as 'superadmin' | 'admin' | 'auditor' | 'teacher' | 'tutor'],
            status: 'active',
            department: departmentValue as 'secretary' | 'direction' | 'schoolControl' | 'technology' | undefined,
          });
          
          console.log("🎉 Nuevo usuario creado y asignado exitosamente!");
          
        } catch (error) {
          console.error("❌ Error al asignar usuario a la escuela:", error);
          const errorMessage = `Usuario creado pero error al asignar a la escuela: ${error instanceof Error ? error.message : 'Error desconocido'}`;
          throw new Error(errorMessage);
        }
      } else {
        console.error("❌ Error al crear usuario en Clerk:", result.error);
        throw new Error(result.error || 'Error al crear usuario en Clerk');
      }

    } catch (error) {
      // Si el error menciona que ya está asignado, dar mensaje más amigable
      if (error instanceof Error && error.message.includes("ya está asignado")) {
        throw new Error(`El usuario ${email} ya tiene un rol asignado en esta escuela`);
      }
      throw error;
    }
  };

  const handleUpdate = async (formData: Record<string, unknown>) => {
    console.log("🔄 handleUpdate LLAMADO - Form data:", formData);
    console.log("🔄 handleUpdate - Original data:", data);

    // Combinar datos del formulario con datos originales para tener clerkId
    const combinedData = { ...data, ...formData };
    
    if (!combinedData.clerkId) {
      console.error("Clerk ID de usuario no disponible");
      throw new Error("Clerk ID de usuario no disponible");
    }

    if (!combinedData.userSchoolId) {
      console.error("UserSchool ID no disponible");
      throw new Error("UserSchool ID no disponible");
    }

    try {
      // PASO 1: Actualizar información básica del usuario en Clerk
      const userUpdateData = {
        name: combinedData.name as string,
        lastName: combinedData.lastName as string,
        email: combinedData.email as string,
      };

      const userResult = await userActions.updateUser(combinedData.clerkId as string, userUpdateData);
      
      if (!userResult.success) {
        console.error("Error al actualizar usuario en Clerk:", userResult.error);
        throw new Error(userResult.error || 'Error al actualizar información básica del usuario');
      }

      // PASO 2: Actualizar rol y departamento en la relación usuario-escuela
      const selectedRole = formData.role as string;
      const selectedDepartment = formData.department as string;
      const originalRole = data?.role as string; // Rol original antes del cambio
      
      // LÓGICA DE DEPARTAMENTO:
      // - Si el nuevo rol es admin: usar el departamento seleccionado
      // - Si el nuevo rol NO es admin Y el rol original ERA admin: limpiar departamento (undefined)
      // - Si el nuevo rol NO es admin Y el rol original NO era admin: mantener como está (undefined)
      let departmentValue: string | undefined;
      
      if (selectedRole === "admin") {
        // Rol admin: usar departamento seleccionado
        departmentValue = selectedDepartment === "none" ? undefined : selectedDepartment;
      } else if (originalRole === "admin") {
        // Cambio DE admin A otro rol: limpiar departamento
        departmentValue = undefined;
        console.log("🧹 Limpiando departamento porque cambió de ADMIN a:", selectedRole);
      } else {
        // Cambio entre roles no-admin: mantener undefined
        departmentValue = undefined;
      }

      const finalDepartmentValue = departmentValue === undefined ? null : departmentValue;
      
      console.log("📋 Actualizando rol y departamento...", {
        userSchoolId: combinedData.userSchoolId,
        originalRole,
        newRole: selectedRole,
        department: departmentValue,
        finalDepartmentForConvex: finalDepartmentValue,
        status: combinedData.status || 'active'
      });

      await updateUserSchoolRelation({
        id: combinedData.userSchoolId as Id<"userSchool">,
        role: [selectedRole as 'superadmin' | 'admin' | 'auditor' | 'teacher' | 'tutor'],
        department: departmentValue === undefined ? null : (departmentValue as 'secretary' | 'direction' | 'schoolControl' | 'technology'),
        status: (combinedData.status as 'active' | 'inactive') || 'active',
      });

      console.log("✅ Usuario y relación actualizados exitosamente");
      
    } catch (error) {
      console.error("❌ Error en handleUpdate:", error);
      throw error;
    }
  };

  const handleDelete = async (deleteData: Record<string, unknown>) => {
    console.log("🗑️ handleDelete - deleteData recibido:", deleteData);
    console.log("🗑️ handleDelete - data original:", data);
    
    // Usar los datos originales del diálogo que tienen el userSchoolId
    const targetData = data || deleteData;
    
    if (!targetData.userSchoolId) {
      console.error("UserSchool ID no disponible para eliminación");
      throw new Error("UserSchool ID no disponible para eliminación");
    }

    console.log("🔄 Realizando soft delete - desactivando usuario de la escuela actual...");
    
    try {
      // Realizar soft delete: cambiar status a 'inactive' en lugar de eliminar completamente
      await deactivateUserInSchool({
        userSchoolId: targetData.userSchoolId as Id<"userSchool">
      });
      
      console.log("✅ Usuario desactivado exitosamente de la escuela actual");
      
    } catch (error) {
      console.error("❌ Error al desactivar usuario:", error);
      throw new Error(`Error al desactivar usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  // Funciones de utilidad
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "No disponible";
    return new Date(timestamp).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  const getInitials = (name: string, lastName?: string) => {
    const first = name.charAt(0).toUpperCase();
    const last = lastName ? lastName.charAt(0).toUpperCase() : "";
    return first + last;
  };

  const getPrimaryRole = (roles: Array<string>) => {
    // Orden de prioridad para mostrar el rol principal
    const priority = ['superadmin', 'admin', 'auditor', 'teacher', 'tutor'];
    for (const role of priority) {
      if (roles.includes(role)) {
        return role;
      }
    }
    return roles[0];
  };

  // Loading y error states
  const isLoading = schoolLoading || allUsers === undefined;
  const isCrudLoading = userActions.isCreating || userActions.isUpdating || userActions.isDeleting;

  // Estadísticas por rol - Excluir tutores
  const personalUsers = allUsers?.filter((user: UserFromConvex) => !user.schoolRole.includes('tutor')) || [];
  
  const stats = [
    {
      title: "Total Personal",
      value: personalUsers.length.toString(),
      icon: Users,
      trend: "Excluyendo tutores"
    },
    {
      title: "Super-Admins",
      value: personalUsers.filter((user: UserFromConvex) => user.schoolRole.includes('superadmin')).length.toString(),
      icon: Shield,
      trend: "Acceso completo"
    },
    {
      title: "Administradores",
      value: personalUsers.filter((user: UserFromConvex) => user.schoolRole.includes('admin')).length.toString(),
      icon: Building2,
      trend: "Gestión departamental"
    },
    {
      title: "Docentes",
      value: personalUsers.filter((user: UserFromConvex) => user.schoolRole.includes('teacher')).length.toString(),
      icon: BookOpen,
      trend: "Enseñanza"
    },
  ];



  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">Gestión de Personal</h1>
                  <p className="text-lg text-muted-foreground">
                    Administra el personal administrativo y docente (tutores gestionados por separado)
                    {currentSchool?.school && (
                      <span className="block text-sm mt-1">
                        {currentSchool.school.name}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            <Button 
              size="lg" 
              className="gap-2" 
              onClick={handleOpenCreate}
              disabled={isLoading || !currentSchool || isCrudLoading}
            >
              <Plus className="w-4 h-4" />
              Agregar Personal
            </Button>
          </div>
        </div>
      </div>

      {/* Error Alerts */}
      {userActions.hasAnyError && (
        <div className="space-y-4">
          {userActions.createError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Error al crear usuario: {userActions.createError}
              </AlertDescription>
            </Alert>
          )}
          {userActions.updateError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Error al actualizar usuario: {userActions.updateError}
              </AlertDescription>
            </Alert>
          )}
          {userActions.deleteError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Error al eliminar usuario: {userActions.deleteError}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Success Alert */}
      {userActions.lastResult?.success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            {userActions.lastResult.message || "Operación completada exitosamente"}
          </AlertDescription>
        </Alert>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros y Búsqueda
              </CardTitle>
              <CardDescription>
                Encuentra personal por nombre, email, rol, estado o departamento
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, apellido o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="superadmin">Super-Admin</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="auditor">Auditor</SelectItem>
                <SelectItem value="teacher">Docente</SelectItem>

              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los departamentos</SelectItem>
                <SelectItem value="secretary">Secretaría</SelectItem>
                <SelectItem value="direction">Dirección</SelectItem>
                <SelectItem value="schoolControl">Control Escolar</SelectItem>
                <SelectItem value="technology">Tecnología</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Personal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Personal</span>
            <Badge variant="outline">{filteredUsers.length} usuarios</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando personal...</p>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No se encontró personal</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" || roleFilter !== "all" || departmentFilter !== "all"
                  ? "Intenta ajustar los filtros para ver más resultados."
                  : "Aún no hay personal registrado en esta escuela."
                }
              </p>
              <Button 
                onClick={handleOpenCreate} 
                className="gap-2"
                disabled={!currentSchool || isCrudLoading}
              >
                <Plus className="h-4 w-4" />
                Agregar Personal
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol Principal</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha de Ingreso</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: UserFromConvex) => {
                    const primaryRole = getPrimaryRole(user.schoolRole);
                    const roleInfo = roleConfig[primaryRole as keyof typeof roleConfig];
                    const departmentInfo = user.department ? departmentConfig[user.department] : null;
                    
                    return (
                      <TableRow key={user._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.imgUrl} alt={user.name} />
                              <AvatarFallback className="bg-primary/10">
                                {getInitials(user.name, user.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {user.name} {user.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={roleInfo?.color}
                          >
                            <roleInfo.icon className="h-3 w-3 mr-1" />
                            {roleInfo?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {departmentInfo ? (
                            <Badge 
                              variant="outline" 
                              className={departmentInfo.color}
                            >
                              {departmentInfo.label}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">No asignado</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {user.phone && (
                              <div className="text-sm flex items-center gap-1">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {user.phone}
                              </div>
                            )}
                            {user.address && (
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {user.address}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={(user.status || 'active') === "active" ? "default" : "secondary"}
                            className={(user.status || 'active') === "active" ? "bg-green-500 hover:bg-green-600" : ""}
                          >
                            {(user.status || 'active') === "active" ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {formatDate(user.admissionDate || user.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenView(user)}
                              className="h-8 w-8 p-0"
                              disabled={isCrudLoading}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(user)}
                              className="h-8 w-8 p-0"
                              disabled={isCrudLoading}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDelete(user)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              disabled={isCrudLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog CRUD */}
      <CrudDialog
        operation={operation}
        title={
          operation === "create" 
            ? "Agregar Personal"
            : operation === "edit"
            ? "Editar Personal"
            : operation === "view"
            ? "Ver Personal"
            : "Desactivar Personal"
        }
        description={
          operation === "create"
            ? "Completa la información para agregar nuevo personal al sistema"
            : operation === "edit"
            ? "Modifica la información del personal"
            : operation === "view"
            ? "Información detallada del personal"
            : undefined
        }
        schema={getSchemaForOperation(operation)}
        data={data}
        isOpen={isOpen}
        onOpenChange={close}
        onSubmit={operation === "create" ? handleCreate : handleUpdate}
        onDelete={() => handleDelete(data || {})}
        deleteConfirmationTitle="¿Desactivar personal?"
        deleteConfirmationDescription="Esta acción desactivará al personal de esta escuela. El usuario mantendrá su información en el sistema y podrá ser reactivado posteriormente."
        isLoading={isLoading}
        isSubmitting={userActions.isCreating || userActions.isUpdating}
        isDeleting={userActions.isDeleting}
      >
        {(form, currentOperation) => (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      value={field.value as string || ""}
                      placeholder="Nombre del personal"
                      disabled={currentOperation === "view"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellidos</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      value={field.value as string || ""}
                      placeholder="Apellidos"
                      disabled={currentOperation === "view"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      value={field.value as string || ""}
                      type="email"
                      placeholder="email@escuela.edu.mx"
                      disabled={currentOperation === "view"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol *</FormLabel>
                  <FormControl>
                    <Select 
                      value={field.value as string} 
                      onValueChange={(value) => {
                        const previousRole = form.getValues("role");
                        field.onChange(value);
                        
                        // Solo limpiar departamento si cambiamos DE admin A otro rol
                        if (previousRole === "admin" && value !== "admin") {
                          console.log("🧹 Limpiando campo departamento en formulario: admin →", value);
                          form.setValue("department", undefined);
                        }
                      }}
                      disabled={currentOperation === "view"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="superadmin">Super-Administrador</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="auditor">Auditor</SelectItem>
                        <SelectItem value="teacher">Docente</SelectItem>
        
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo de departamento solo visible para administradores */}
            {form.watch("role") === "admin" && (
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento *</FormLabel>
                    <FormControl>
                      <Select 
                        value={field.value as string || undefined} 
                        onValueChange={(value) => field.onChange(value === "none" ? undefined : value)}
                        disabled={currentOperation === "view"}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar departamento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin departamento</SelectItem>
                          <SelectItem value="secretary">Secretaría</SelectItem>
                          <SelectItem value="direction">Dirección</SelectItem>
                          <SelectItem value="schoolControl">Control Escolar</SelectItem>
                          <SelectItem value="technology">Tecnología</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      Los administradores pueden ser asignados a un departamento específico
                    </p>
                  </FormItem>
                )}
              />
            )}

            {currentOperation === "create" && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña Temporal *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value as string || ""}
                        type="password"
                        placeholder="Solo requerida para usuarios nuevos"
                        disabled={false}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      💡 Si el email ya existe en el sistema, se asignará el usuario existente (sin crear uno nuevo)
                    </p>
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      value={field.value as string || ""}
                      placeholder="+52 555 1234567"
                      disabled={currentOperation === "view"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      value={field.value as string || ""}
                      placeholder="Dirección completa"
                      disabled={currentOperation === "view"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <FormControl>
                    <Select 
                      value={field.value as string} 
                      onValueChange={field.onChange}
                      disabled={currentOperation === "view"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="inactive">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {currentOperation === "view" && data && (
              <div className="md:col-span-2 space-y-4 pt-4 border-t">
                <h3 className="font-medium text-sm text-muted-foreground">Información adicional</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">ID de Usuario:</span>
                    <p className="font-mono">{data._id as string}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fecha de Creación:</span>
                    <p>{formatDate(data.createdAt as number)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Última Actualización:</span>
                    <p>{formatDate(data.updatedAt as number)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Clerk ID:</span>
                    <p className="font-mono">{data.clerkId as string}</p>
                  </div>
                  {data.schoolRole && Array.isArray(data.schoolRole) ? (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Roles asignados:</span>
                      <p className="text-sm">{(data.schoolRole as string[]).join(", ")}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        )}
      </CrudDialog>
    </div>
  );
}
