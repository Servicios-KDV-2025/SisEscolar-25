"use client";

import React, { useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/convex/convex/_generated/api";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
import { toast } from 'sonner'
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/shadcn/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import {
  CrudDialog,
  useCrudDialog,
} from "@repo/ui/components/dialog/crud-dialog";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@repo/ui/components/shadcn/form";
import {
  Shield,
  Users,
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Filter,
  Mail,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle,
  Building2,
  BookOpen,
  Search as SearchIcon,
  X,
} from "@repo/ui/icons";
import { FolderClosed } from "lucide-react";
import { Alert, AlertDescription } from "@repo/ui/components/shadcn/alert";
import {
  unifiedUserSchema,
  unifiedUserCreateSchema,
  unifiedUserEditSchema,
} from "@/types/form/userSchemas";
import { useUserWithConvex } from "../../../../../stores/userStore";
import { useCurrentSchool } from "../../../../../stores/userSchoolsStore";
import { useUserActionsWithConvex } from "../../../../../stores/userActionsStore";
import { usePermissions } from "../../../../../hooks/usePermissions";
import NotAuth from "../../../../../components/NotAuth";


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
  status?: "active" | "inactive";
  userSchoolId: Id<"userSchool">;
  schoolRole: Array<"superadmin" | "admin" | "auditor" | "teacher" | "tutor">;
  schoolStatus: "active" | "inactive";
  department?: "secretary" | "direction" | "schoolControl" | "technology";
};

// Tipo para el resultado de búsqueda de usuarios
type SearchUserResult = {
  _id: Id<"user">;
  name: string;
  lastName?: string;
  email: string;
  clerkId: string;
  status?: "active" | "inactive";
  createdAt: number;
  updatedAt: number;
};



// Función para obtener el esquema correcto según la operación
const getSchemaForOperation = (operation: string) => {
  switch (operation) {
    case "create":
      return unifiedUserCreateSchema;
    case "edit":
      return unifiedUserEditSchema;
    default:
      return unifiedUserSchema;
  }
};

// Configuración de roles
const roleConfig = {
  superadmin: {
    label: "Super-Admin",
    color: "bg-yellow-500 text-gray-50",
    icon: Shield,
    description: "Acceso completo sin restricciones",
  },
  admin: {
    label: "Administrador",
    color: "bg-amber-400 text-gray-50",
    icon: FolderClosed,
    description: "Acceso administrativo departamental",
  },
  auditor: {
    label: "Auditor",
    color: "bg-sky-700 text-white",
    icon: SearchIcon,
    description: "Acceso de auditoría y verificación",
  },
  teacher: {
    label: "Docente",
    color: "bg-sky-600 text-white",
    icon: BookOpen,
    description: "Acceso de enseñanza y evaluación",
  },
  tutor: {
    label: "Tutor",
    color: "bg-sky-500 text-white",
    icon: Users,
    description: "Acceso a información de alumnos",
  },
};

const departmentConfig = {
  secretary: { label: "Secretaría", color: "bg-blue-100 text-blue-800" },
  direction: { label: "Dirección", color: "bg-purple-100 text-purple-800" },
  schoolControl: {
    label: "Control Escolar",
    color: "bg-green-100 text-green-800",
  },
  technology: { label: "Tecnología", color: "bg-orange-100 text-orange-800" },
};

export default function PersonalPage() {
  const { user: clerkUser } = useUser();

  // Obtener usuario actual
  const { currentUser } = useUserWithConvex(clerkUser?.id);

  // Obtener escuela actual por subdominio
  const { currentSchool, isLoading: schoolLoading } = useCurrentSchool(
    currentUser?._id
  );

  // Obtener permisos del usuario
  const {
    canCreateUsersPersonal,
    canReadUsersPersonal,
    canUpdateUsersPersonal,
    canDeleteUsersPersonal,
    isLoading: permissionsLoading,
    error: permissionsError,

  } = usePermissions(currentSchool?.school?._id);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  // Obtener usuarios de la escuela actual (todos los roles)
  const activeUsers = useQuery(
    api.functions.schools.getUsersBySchoolAndRoles,
    currentSchool?.school?._id
      ? {
        schoolId: currentSchool.school._id,
        roles: ["superadmin", "admin", "auditor", "teacher", "tutor"],
        status: "active",
      }
      : "skip"
  );

  const inactiveUsers = useQuery(
    api.functions.schools.getUsersBySchoolAndRoles,
    currentSchool?.school?._id
      ? {
        schoolId: currentSchool.school._id,
        roles: ["superadmin", "admin", "auditor", "teacher", "tutor"],
        status: "inactive",
      }
      : "skip"
  );

  const allUsers: UserFromConvex[] = (activeUsers || []).concat(inactiveUsers || []);

  // User Actions Store para CRUD operations
  const userActions = useUserActionsWithConvex();

  // Mutations para gestión de relaciones usuario-escuela
  const createUserSchoolRelation = useMutation(
    api.functions.schools.createUserSchool
  );
  const updateUserSchoolRelation = useMutation(api.functions.userSchool.update);
  const deactivateUserInSchool = useMutation(
    api.functions.schools.deactivateUserInSchool
  );

  // Estado para búsqueda dinámica de usuario
  const [searchEmail, setSearchEmail] = useState<string | null>(null);
  const [searchResultPromise, setSearchResultPromise] = useState<{
    resolve: (value: SearchUserResult[]) => void;
    reject: (reason?: unknown) => void;
  } | null>(null);

  // Query para buscar usuario por email cuando se necesite
  const searchResult = useQuery(
    api.functions.users.searchUsers,
    searchEmail
      ? {
        searchTerm: searchEmail,
        status: "active",
        limit: 1,
      }
      : "skip"
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
  const searchUserByEmailAsync = (
    email: string
  ): Promise<SearchUserResult[]> => {
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
    console.log("✏️ departamento que tiene puesto: " + user.department);
    userActions.clearErrors();
    userActions.clearLastResult();

    // Separar roles editables de tutor
    const editableRoles = user.schoolRole;

    const editData = {
      ...user,
      role: editableRoles, // Solo roles editables en el formulario
      originalRoles: user.schoolRole, // Guardar roles originales para preservar tutor
      userSchoolId: user.userSchoolId,
      status: user.schoolStatus,
    };

    openEdit(editData);
  };

  const handleOpenView = (user: UserFromConvex) => {
    userActions.clearErrors();
    userActions.clearLastResult();

    const viewData = {
      ...user,
      role: user.schoolRole, // Mostrar TODOS los roles incluyendo tutor
      userSchoolId: user.userSchoolId,
      status: user.schoolStatus,
    };

    openView(viewData);
  };

  const handleOpenDelete = (user: UserFromConvex) => {
    userActions.clearErrors();
    userActions.clearLastResult();
    openDelete(user);
  };

  // Filtrado de datos - Excluir tutores
  // Reemplaza el useMemo actual:
  const filteredUsers = useMemo(() => {
    if (!allUsers) return [];

    return allUsers
      .filter((user: UserFromConvex) => {
        // ✅ Excluir usuarios que SOLO tienen rol de tutor
        const hasOnlyTutorRole =
          user.schoolRole.length === 1 &&
          user.schoolRole[0] === "tutor";

        if (hasOnlyTutorRole) return false;

        const searchMatch =
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase());

        const statusMatch =
          statusFilter === "all" ||
          (user.schoolStatus || "active") === statusFilter;

        const roleMatch =
          roleFilter === "all" ||
          user.schoolRole.includes(
            roleFilter as
            | "superadmin"
            | "admin"
            | "auditor"
            | "teacher"
            | "tutor"
          );

        const departmentMatch =
          departmentFilter === "all" || user.department === departmentFilter;

        return searchMatch && statusMatch && roleMatch && departmentMatch;
      });
  }, [allUsers, searchTerm, statusFilter, roleFilter, departmentFilter]);

  // Funciones CRUD
  const handleCreate = async (formData: Record<string, unknown>) => {
    if (!currentSchool?.school?._id) {
      console.error("No hay escuela actual disponible");
      throw new Error("No hay escuela actual disponible");
    }

    const email = formData.email as string;

    try {
      // PASO 1: Buscar si el usuario ya existe en Convex
      const existingUsers = await searchUserByEmailAsync(email);

      if (existingUsers && existingUsers.length > 0) {
        // FLUJO A: Usuario existe en la base de datos de usuarios
        const existingUser = existingUsers[0];

        if (
          !existingUser?.clerkId ||
          !existingUser?.name ||
          !existingUser?.email
        ) {
          throw new Error(
            "Error al obtener datos completos del usuario existente"
          );
        }

        // Buscar si ya tiene relación en esta escuela (con cualquier rol)
        const userInCurrentSchool = allUsers?.find(
          (user: UserFromConvex) => user.clerkId === existingUser.clerkId
        );

        if (userInCurrentSchool) {
          // Usuario YA tiene una relación en esta escuela
          const existingRoles = userInCurrentSchool.schoolRole;

          // Verificar si el rol de tutor ya existe
          if (existingRoles.includes("tutor")) {
            throw new Error(
              `El usuario ${email} ya tiene asignado el rol de tutor. No se realizó ningún cambio.`
            );
          }

          // Logging para debugging
          console.log(
            `⚠️ Agregando rol de tutor al usuario existente. Roles anteriores: ${existingRoles.join(", ")}`
          );
        }

        // Crear o actualizar la relación (createUserSchool maneja ambos casos)
        await createUserSchoolRelation({
          clerkId: existingUser.clerkId,
          schoolId: currentSchool.school._id,
          role: ["tutor"],
          status: "active",
          department: undefined,
        });

        return;
      }

      // FLUJO B: Usuario no existe, crear nuevo en Clerk + asignar
      const password = formData.password as string;

      if (!password || password.trim() === "") {
        throw new Error(
          "La contraseña es requerida para crear un usuario nuevo. Si el usuario ya existe en el sistema, se asignará automáticamente."
        );
      }

      const createData = {
        email: email,
        password: password,
        name: formData.name as string,
        lastName: formData.lastName as string,
        phone: formData.phone as string,
        address: formData.address as string,
      };


      const result = await userActions.createUser(createData);

      if (result.success && result.userId) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 2000));

          await createUserSchoolRelation({
            clerkId: result.userId,
            schoolId: currentSchool.school._id,
            role: ["tutor"],
            status: "active",
            department: undefined,
          });

          
        } catch (error) {
          console.error("Error al asignar usuario como tutor:", error);
          throw new Error(
            `Usuario creado pero error al asignar como tutor: ${error instanceof Error ? error.message : "Error desconocido"}`
          );
        }
        toast.success("Usuario creado y asignado como tutor exitosamente");
      } else {
        console.error("Error al crear usuario en Clerk:", result.error);
        throw new Error(result.error || "Error al crear usuario en Clerk");
      }
    } catch (error) {
      console.error("❌ Error en handleCreate:", error);
      throw error;
    }
  };

  const handleUpdate = async (formData: Record<string, unknown>) => {
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
      const userUpdateData = {
        name: combinedData.name as string,
        lastName: combinedData.lastName as string,
        email: combinedData.email as string,
        phone: combinedData.phone as string,
        address: combinedData.address as string,
      };



      const userResult = await userActions.updateUser(
        combinedData.clerkId as string,
        userUpdateData
      );

      if (!userResult.success) {
        console.error("Error al actualizar usuario en Clerk:", userResult.error);
        throw new Error(
          userResult.error || "Error al actualizar información básica del usuario"
        );
      }

      const selectedRoleData = formData.role;
      const selectedDepartment = formData.department as string | undefined;

      let finalRoles: Array<"superadmin" | "admin" | "auditor" | "teacher" | "tutor">;

      if (Array.isArray(selectedRoleData)) {
        finalRoles = selectedRoleData as Array<"superadmin" | "admin" | "auditor" | "teacher" | "tutor">;
      } else if (typeof selectedRoleData === "string") {
        finalRoles = [selectedRoleData as "superadmin" | "admin" | "auditor" | "teacher" | "tutor"];
      } else {
        finalRoles = Array.isArray(data?.schoolRole)
          ? data.schoolRole
          : [data?.role as "superadmin" | "admin" | "auditor" | "teacher" | "tutor"];
      }

      console.log("🔍 Roles finales seleccionados:", finalRoles);
      console.log("🔍 Departamento seleccionado:", selectedDepartment);

      const hasAdminRole = finalRoles.includes("admin");

      // Determinar el valor del departamento
      let departmentValue: string | undefined | null;
      if (hasAdminRole) {
        // Si tiene rol admin, usar el departamento seleccionado
        if (selectedDepartment === "none" || selectedDepartment === undefined) {
          departmentValue = null; // Sin departamento
        } else {
          departmentValue = selectedDepartment;
        }
      } else {
        // Si NO tiene rol admin, siempre limpia departamento
        departmentValue = null;
      }

      console.log("🔍 Departamento final a guardar:", departmentValue);

      await updateUserSchoolRelation({
        id: combinedData.userSchoolId as Id<"userSchool">,
        role: finalRoles,
        department: departmentValue === null
          ? null
          : (departmentValue as "secretary" | "direction" | "schoolControl" | "technology"),
        status: (combinedData.status as "active" | "inactive") || "active",
      });

      console.log("✅ Actualización completada exitosamente");
      toast.success("Usuario actualizado exitosamente");

    } catch (error) {
      console.error("❌ Error en handleUpdate:", error);
      throw error;
    }
  };

  const handleDelete = async (deleteData: Record<string, unknown>) => {


    // Usar los datos originales del diálogo que tienen el userSchoolId
    const targetData = data || deleteData;

    if (!targetData.userSchoolId) {
      console.error("UserSchool ID no disponible para eliminación");
      throw new Error("UserSchool ID no disponible para eliminación");
    }



    try {
      // Realizar soft delete: cambiar status a 'inactive' en lugar de eliminar completamente
      await deactivateUserInSchool({
        userSchoolId: targetData.userSchoolId as Id<"userSchool">,
      });

    } catch (error) {
      console.error("❌ Error al desactivar usuario:", error);
      throw new Error(
        `Error al desactivar usuario: ${error instanceof Error ? error.message : "Error desconocido"}`
      );
    }
  };

  // Funciones de utilidad
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "No disponible";
    return new Date(timestamp).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (name: string, lastName?: string) => {
    const first = name.charAt(0).toUpperCase();
    const last = lastName ? lastName.charAt(0).toUpperCase() : "";
    return first + last;
  };



  // Loading y error states
  const isLoading = schoolLoading || allUsers === undefined;
  const isCrudLoading =
    userActions.isCreating || userActions.isUpdating || userActions.isDeleting;

  // Verificar error de permisos o falta de permiso de lectura
  if ((permissionsError || !canReadUsersPersonal) && !permissionsLoading && !isLoading) {
    return (
      <NotAuth
        pageName="Personal"
        pageDetails="Administra el personal "
        icon={Users}
      />
    );
  }

  // Estadísticas por rol - Excluir tutores
  const personalUsers: UserFromConvex[] = allUsers || [];

  const stats = [
    {
      title: "Total Personal",
      value: personalUsers.length.toString(),
      icon: Users,
      trend: "Incluyendo tutores",
    },
    {
      title: "Super-Admins",
      value: personalUsers
        .filter((user: UserFromConvex) =>
          user.schoolRole.includes("superadmin")
        )
        .length.toString(),
      icon: Shield,
      trend: "Acceso completo",
    },
    {
      title: "Administradores",
      value: personalUsers
        .filter((user: UserFromConvex) => user.schoolRole.includes("admin"))
        .length.toString(),
      icon: Building2,
      trend: "Gestión departamental",
    },
    {
      title: "Docentes",
      value: personalUsers
        .filter((user: UserFromConvex) => user.schoolRole.includes("teacher"))
        .length.toString(),
      icon: BookOpen,
      trend: "Enseñanza",
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
                <div className="p-3 bg-primary/10 rounded-xl" >
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">
                    Personal
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Administra el personal administrativo y docente (tutores
                    gestionados por separado)
                  </p>
                </div>
              </div>
            </div>
            {canCreateUsersPersonal && (
              <Button
                size="lg"
                className="gap-2"
                onClick={handleOpenCreate}
                disabled={isLoading || !currentSchool || isCrudLoading}
              >
                <Plus className="w-4 h-4" />
                Agregar Personal
              </Button>
            )}

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
            {userActions.lastResult.message ||
              "Operación completada exitosamente"}
          </AlertDescription>
        </Alert>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="relative overflow-hidden group hover:shadow-lg transition-all duration-300"
          >
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
            <Select
              value={departmentFilter}
              onValueChange={setDepartmentFilter}
            >
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
            <div className="flex flex-wrap gap-2">
              {Object.entries(roleConfig).map(([roleKey, roleInfo]) => (
                <Badge
                  key={roleKey}
                  variant="outline"
                  className={`${roleInfo.color} text-xs m-x-2 space-x-2`}
                >
                  <roleInfo.icon className="h-4 w-4 mr-1" />
                  {roleInfo.label}
                </Badge>
              ))}
            </div>
            <Badge variant="outline">{filteredUsers.length} usuarios</Badge>
          </CardTitle>

          <CardDescription className="space-x-1">


          </CardDescription>
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
                  : "Aún no hay personal registrado en esta escuela."}
              </p>
              <Button onClick={handleOpenCreate} className="gap-2" disabled={!currentSchool || isCrudLoading}>
                <Plus className="h-4 w-4" />
                Agregar Personal
              </Button>
            </div>
          ) : (
            <>
              {/* Vista de tabla para pantallas medianas y grandes */}
              <div className="hidden md:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Usuario</TableHead>
                      <TableHead className="text-center">Roles</TableHead>
                      <TableHead className="text-center hidden lg:table-cell">Departamento</TableHead>
                      <TableHead className="text-center hidden xl:table-cell">Contacto</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead className="text-center hidden lg:table-cell">Fecha de Ingreso</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: UserFromConvex) => {
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
                                <div className="font-medium">{user.name} {user.lastName}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="text-center">
                            <div className="flex flex-wrap gap-1 justify-center">
                              {user.schoolRole.map((role) => {
                                const roleInfo = roleConfig[role as keyof typeof roleConfig];
                                return (
                                  <Badge key={role} variant="outline" className={`${roleInfo?.color} text-xs`}>
                                    <roleInfo.icon className="h-4 w-4" />
                                  </Badge>
                                );
                              })}
                            </div>
                          </TableCell>

                          <TableCell className="text-center hidden lg:table-cell">
                            {departmentInfo ? (
                              <Badge variant="outline" className={departmentInfo.color}>
                                {departmentInfo.label}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">No asignado</span>
                            )}
                          </TableCell>

                          <TableCell className="text-center hidden xl:table-cell">
                            <div className="space-y-1">
                              {user.phone && (
                                <div className="text-sm flex items-center gap-1 justify-center">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  {user.phone}
                                </div>
                              )}
                              {user.address && (
                                <div className="text-sm text-muted-foreground flex items-center gap-1 justify-center">
                                  <MapPin className="h-3 w-3" />
                                  <span className="truncate max-w-[150px]">{user.address}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="text-center">
                            <Badge
                              variant={(user.schoolStatus || "active") === "active" ? "default" : "secondary"}
                              className={(user.schoolStatus || "active") === "active"
                                ? "bg-green-600 text-white"
                                : "bg-gray-600/70 text-white"}
                            >
                              {(user.schoolStatus || "active") === "active" ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-center hidden lg:table-cell">
                            <div className="flex items-center gap-1 text-sm justify-center">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {formatDate(user.admissionDate || user.createdAt)}
                            </div>
                          </TableCell>

                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenView(user)}
                                className="h-8 w-8 p-0"
                                disabled={isCrudLoading}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canUpdateUsersPersonal && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenEdit(user)}
                                  className="h-8 w-8 p-0"
                                  disabled={isCrudLoading}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                              {canDeleteUsersPersonal && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenDelete(user)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  disabled={isCrudLoading}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Vista de tarjetas para pantallas pequeñas */}
              <div className="md:hidden space-y-4">
                {filteredUsers.map((user: UserFromConvex) => {
                  const departmentInfo = user.department ? departmentConfig[user.department] : null;

                  return (
                    <Card key={user._id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={user.imgUrl} alt={user.name} />
                              <AvatarFallback className="bg-primary/10">
                                {getInitials(user.name, user.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name} {user.lastName}</div>
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                          <Badge
                            variant={(user.schoolStatus || "active") === "active" ? "default" : "secondary"}
                            className={(user.schoolStatus || "active") === "active"
                              ? "bg-green-600 text-white"
                              : "bg-gray-600/70 text-white"}
                          >
                            {(user.schoolStatus || "active") === "active" ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground font-medium">Roles:</span>
                            <div className="flex flex-wrap gap-1">
                              {user.schoolRole.map((role) => {
                                const roleInfo = roleConfig[role as keyof typeof roleConfig];
                                return (
                                  <Badge key={role} variant="outline" className={`${roleInfo?.color} text-xs`}>
                                    <roleInfo.icon className="h-3 w-3 mr-1" />
                                    {roleInfo?.label}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>

                          {departmentInfo && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground font-medium">Departamento:</span>
                              <Badge variant="outline" className={departmentInfo.color}>
                                {departmentInfo.label}
                              </Badge>
                            </div>
                          )}

                          {user.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span>{user.phone}</span>
                            </div>
                          )}

                          {user.address && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="truncate">{user.address}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span>{formatDate(user.admissionDate || user.createdAt)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenView(user)}
                            disabled={isCrudLoading}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          {canUpdateUsersPersonal && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEdit(user)}
                              disabled={isCrudLoading}
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                          )}
                          {canDeleteUsersPersonal && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDelete(user)}
                              className="text-destructive hover:text-destructive"
                              disabled={isCrudLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
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
                      value={(field.value as string) || ""}
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
                      value={(field.value as string) || ""}
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
                      value={(field.value as string) || ""}
                      type="email"
                      placeholder="email@escuela.edu.mx"
                      disabled={
                        currentOperation === "view" ||
                        currentOperation === "edit"
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => {
                // Obtener roles seleccionados (puede ser string o array)
                let selectedRoles: string[];
                if (currentOperation === "view" && data?.schoolRole) {
                  selectedRoles = Array.isArray(data.schoolRole) ? data.schoolRole : [data.schoolRole];
                } else if (Array.isArray(field.value)) {
                  selectedRoles = field.value as string[];
                } else {
                  selectedRoles = field.value ? [field.value as string] : [];
                }

                const handleAddRole = (roleToAdd: string) => {
                  if (!selectedRoles.includes(roleToAdd)) {
                    const newRoles = [...selectedRoles, roleToAdd];
                    field.onChange(newRoles.length === 1 ? newRoles[0] : newRoles);
                  }
                };

                const handleRemoveRole = (roleToRemove: string) => {
                  const newRoles = selectedRoles.filter(r => r !== roleToRemove);
                  if (newRoles.length === 0) {
                    field.onChange(undefined);
                  } else {
                    field.onChange(newRoles.length === 1 ? newRoles[0] : newRoles);
                  }

                  // Limpiar departamento si se elimina el rol admin
                  if (roleToRemove === "admin" && !newRoles.includes("admin")) {
                    form.setValue("department", undefined);
                  }
                };

                const availableRoles = ["superadmin", "admin", "auditor", "teacher"].filter(
                  role => !selectedRoles.includes(role)
                );

                return (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Roles *</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        {/* Roles seleccionados */}
                        <div className="flex flex-wrap gap-2 min-h-[42px] p-2 border rounded-md bg-background">
                          {selectedRoles.length === 0 ? (
                            <span className="text-sm text-muted-foreground">
                              No hay roles seleccionados
                            </span>
                          ) : (
                            selectedRoles.map((role) => {
                              const roleInfo = roleConfig[role as keyof typeof roleConfig];
                              return (
                                <Badge
                                  key={role}
                                  variant="outline"
                                  className={`${roleInfo?.color} flex items-center gap-1 pr-1`}
                                >
                                  <roleInfo.icon className="h-3 w-3" />
                                  {roleInfo?.label}
                                  {currentOperation !== "view" && selectedRoles.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveRole(role)}
                                      className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  )}
                                </Badge>
                              );
                            })
                          )}
                        </div>

                        {/* Selector para agregar roles */}
                        {currentOperation !== "view" && availableRoles.length > 0 && (
                          <Select
                            value=""
                            onValueChange={(value) => {
                              handleAddRole(value);
                              // Solo limpiar departamento si después de agregar el rol, ya no tiene admin
                              const newRoles = selectedRoles.includes(value)
                                ? selectedRoles
                                : [...selectedRoles, value];
                              const stillHasAdmin = newRoles.includes("admin");

                              if (!stillHasAdmin) {
                                form.setValue("department", undefined);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="+ Agregar rol" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableRoles.map((role) => {
                                const roleInfo = roleConfig[role as keyof typeof roleConfig];
                                return (
                                  <SelectItem key={role} value={role}>
                                    <div className="flex items-center gap-2">
                                      <roleInfo.icon className="h-4 w-4" />
                                      {roleInfo.label}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      {currentOperation === "view"
                        ? "Roles asignados al usuario en esta escuela"
                        : "Puedes asignar múltiples roles. Haz clic en la X para eliminar un rol."}
                    </p>
                  </FormItem>
                );
              }}
            />


            {/* Campo de departamento solo visible si tiene rol de administrador */}
            {(() => {
              const currentRole = form.watch("role");
              const hasAdminRole = Array.isArray(currentRole)
                ? currentRole.includes("admin")
                : currentRole === "admin";
              return hasAdminRole;
            })() && (
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departamento *</FormLabel>
                      <FormControl>
                        <Select
                          value={(field.value as string) || undefined}
                          onValueChange={(value) =>
                            field.onChange(value === "none" ? undefined : value)
                          }
                          disabled={currentOperation === "view"}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar departamento" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin departamento</SelectItem>
                            <SelectItem value="secretary">Secretaría</SelectItem>
                            <SelectItem value="direction">Dirección</SelectItem>
                            <SelectItem value="schoolControl">
                              Control Escolar
                            </SelectItem>
                            <SelectItem value="technology">Tecnología</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Los administradores pueden ser asignados a un departamento
                        específico
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
                        value={(field.value as string) || ""}
                        type="password"
                        placeholder="Solo requerida para usuarios nuevos"
                        disabled={false}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      💡 Si el email ya existe en el sistema, se asignará el
                      usuario existente (sin crear uno nuevo)
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
                      value={(field.value as string) || ""}
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
                      value={(field.value as string) || ""}
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
                <h3 className="font-medium text-sm text-muted-foreground">
                  Información adicional
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      ID de Usuario:
                    </span>
                    <p className="font-mono">{data._id as string}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Fecha de Creación:
                    </span>
                    <p>{formatDate(data.createdAt as number)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Última Actualización:
                    </span>
                    <p>{formatDate(data.updatedAt as number)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Clerk ID:</span>
                    <p className="font-mono">{data.clerkId as string}</p>
                  </div>
                  {data.schoolRole && Array.isArray(data.schoolRole) ? (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">
                        Roles asignados:
                      </span>
                      <p className="text-sm">
                        {(data.schoolRole as string[]).join(", ")}
                      </p>
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
