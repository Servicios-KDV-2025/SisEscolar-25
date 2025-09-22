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
  GraduationCap,
} from "@repo/ui/icons";
import { Alert, AlertDescription } from "@repo/ui/components/shadcn/alert";
import {
  tutorSchema,
  tutorCreateSchema,
  tutorEditSchema,
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
      return tutorCreateSchema;
    case "edit":
      return tutorEditSchema;
    default:
      return tutorSchema;
  }
};

export default function TutorPage() {
  const { user: clerkUser } = useUser();

  // Obtener usuario actual
  const { currentUser } = useUserWithConvex(clerkUser?.id);

  // Obtener escuela actual por subdominio
  const { currentSchool, isLoading: schoolLoading } = useCurrentSchool(
    currentUser?._id
  );

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Obtener usuarios de la escuela actual (solo tutores)
  const activeUsers = useQuery(
    api.functions.schools.getUsersBySchoolAndRoles,
    currentSchool?.school?._id
      ? {
          schoolId: currentSchool.school._id,
          roles: ["tutor"],
          status: "active",
        }
      : "skip"
  );

  const inactiveUsers = useQuery(
    api.functions.schools.getUsersBySchoolAndRoles,
    currentSchool?.school?._id
      ? {
          schoolId: currentSchool.school._id,
          roles: ["tutor"],
          status: "inactive",
        }
      : "skip"
  );

  const allUsers = activeUsers?.concat(inactiveUsers || []);

  // const allUsers = activeUsers?.concat(inactiveUsers || []);

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
  } = useCrudDialog(tutorSchema, {
    status: "active",
    admissionDate: Date.now(),
  });

  // Funciones wrapper para abrir diálogos con limpieza de errores
  const handleOpenCreate = () => {
    userActions.clearErrors();
    userActions.clearLastResult();
    openCreate();
  };

  const handleOpenEdit = (user: UserFromConvex) => {
    userActions.clearErrors();
    userActions.clearLastResult();

    // Preparar datos para edición incluyendo userSchoolId
    // Mapear schoolStatus a status para que el formulario muestre el estado correcto
    const editData = {
      ...user,
      userSchoolId: user.userSchoolId,
      status: user.schoolStatus, // Usar schoolStatus en lugar del status general
    };

    openEdit(editData);
  };

  const handleOpenView = (user: UserFromConvex) => {
    userActions.clearErrors();
    userActions.clearLastResult();

    // Preparar datos para vista incluyendo userSchoolId
    // Mapear schoolStatus a status para que el formulario muestre el estado correcto
    const viewData = {
      ...user,
      userSchoolId: user.userSchoolId,
      status: user.schoolStatus, // Usar schoolStatus en lugar del status general
    };

    openView(viewData);
  };

  const handleOpenDelete = (user: UserFromConvex) => {
    userActions.clearErrors();
    userActions.clearLastResult();
    openDelete(user);
  };

  // Filtrado de datos - Solo tutores
  const filteredUsers = useMemo(() => {
    if (!allUsers) return [];

    return allUsers
      .filter((user: UserFromConvex) => user.schoolRole.includes("tutor")) // Solo tutores
      .filter((user: UserFromConvex) => {
        const searchMatch =
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase());

        const statusMatch =
          statusFilter === "all" ||
          (user.schoolStatus || "active") === statusFilter;

        return searchMatch && statusMatch;
      });
  }, [allUsers, searchTerm, statusFilter]);

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
        // FLUJO A: Usuario existe, solo asignar a escuela
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


        await createUserSchoolRelation({
          clerkId: existingUser.clerkId,
          schoolId: currentSchool.school._id,
          role: ["tutor"], // Solo rol de tutor
          status: "active",
          department: undefined, // Los tutores no tienen departamento
        });

        return;
      }

      // FLUJO B: Usuario no existe, crear nuevo en Clerk + asignar

      const password = formData.password as string;

      // Validación: Si no existe el usuario, la contraseña es obligatoria
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
      };

      const result = await userActions.createUser(createData);

      if (result.success && result.userId) {

        try {
          // Esperar sincronización del webhook
          await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 segundos

          // Asignar rol de tutor en la escuela actual
          await createUserSchoolRelation({
            clerkId: result.userId,
            schoolId: currentSchool.school._id,
            role: ["tutor"], // Solo rol de tutor
            status: "active",
            department: undefined, // Los tutores no tienen departamento
          });

        } catch (error) {
          console.error("❌ Error al asignar usuario como tutor:", error);
          const errorMessage = `Usuario creado pero error al asignar como tutor: ${error instanceof Error ? error.message : "Error desconocido"}`;
          throw new Error(errorMessage);
        }
      } else {
        console.error("❌ Error al crear usuario en Clerk:", result.error);
        throw new Error(result.error || "Error al crear usuario en Clerk");
      }
    } catch (error) {
      // Si el error menciona que ya está asignado, dar mensaje más amigable
      if (
        error instanceof Error &&
        error.message.includes("ya está asignado")
      ) {
        throw new Error(
          `El usuario ${email} ya tiene un rol asignado en esta escuela`
        );
      }
      throw error;
    }
  };

  const handleUpdate = async (formData: Record<string, unknown>) => {
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

      const userResult = await userActions.updateUser(
        combinedData.clerkId as string,
        userUpdateData
      );

      if (!userResult.success) {
        console.error(
          "Error al actualizar usuario en Clerk:",
          userResult.error
        );
        throw new Error(
          userResult.error ||
            "Error al actualizar información básica del usuario"
        );
      }

      // PASO 2: Actualizar estado en la relación usuario-escuela (mantener rol de tutor)

      await updateUserSchoolRelation({
        id: combinedData.userSchoolId as Id<"userSchool">,
        role: ["tutor"], // Mantener siempre rol de tutor
        department: null, // Los tutores no tienen departamento
        status: (combinedData.status as "active" | "inactive") || "active",
      });

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
      console.error("❌ Error al desactivar tutor:", error);
      throw new Error(
        `Error al desactivar tutor: ${error instanceof Error ? error.message : "Error desconocido"}`
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

  // Estadísticas para tutores
  const stats = [
    {
      title: "Total Tutores",
      value: filteredUsers.length.toString(),
      icon: Users,
      trend: "Tutores activos",
    },
    {
      title: "Tutores Activos",
      value: filteredUsers
        .filter((user) => (user.schoolStatus || "active") === "active")
        .length.toString(),
      icon: CheckCircle,
      trend: "En servicio",
    },
    {
      title: "Tutores Inactivos",
      value: filteredUsers
        .filter((user) => user.schoolStatus === "inactive")
        .length.toString(),
      icon: AlertCircle,
      trend: "Suspendidos",
    },
    {
      title: "Nuevos este mes",
      value: filteredUsers
        .filter((user) => {
          const createdThisMonth =
            new Date(user.createdAt).getMonth() === new Date().getMonth();
          return createdThisMonth;
        })
        .length.toString(),
      icon: GraduationCap,
      trend: "Incorporaciones",
    },
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-background border">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-500/10 rounded-xl">
                  <GraduationCap className="h-8 w-8 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">
                    Tutores
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Administra los tutores que tienen acceso a información de
                    alumnos
                  </p>
                </div>
              </div>
            </div>
            <Button
              size="lg"
              className="gap-2 bg-orange-600 hover:bg-orange-700"
              onClick={handleOpenCreate}
              disabled={isLoading || !currentSchool || isCrudLoading}
            >
              <Plus className="w-4 h-4" />
              Agregar Tutor
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
                Error al crear tutor: {userActions.createError}
              </AlertDescription>
            </Alert>
          )}
          {userActions.updateError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Error al actualizar tutor: {userActions.updateError}
              </AlertDescription>
            </Alert>
          )}
          {userActions.deleteError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Error al eliminar tutor: {userActions.deleteError}
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
              <div className="p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
                <stat.icon className="h-4 w-4 text-orange-600" />
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
                Encuentra tutores por nombre, email o estado
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
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Tutores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Tutores</span>
            <Badge
              variant="outline"
              className="bg-orange-50 text-orange-700 border-orange-200"
            >
              {filteredUsers.length} tutores
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando tutores...</p>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                No se encontraron tutores
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Intenta ajustar los filtros para ver más resultados."
                  : "Aún no hay tutores registrados en esta escuela."}
              </p>
              <Button
                onClick={handleOpenCreate}
                className="gap-2 bg-orange-600 hover:bg-orange-700"
                disabled={!currentSchool || isCrudLoading}
              >
                <Plus className="h-4 w-4" />
                Agregar Tutor
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[110px] px-4">Tutor</TableHead>
                    <TableHead className="text-center">Contacto</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-center">Fecha de Ingreso</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: UserFromConvex) => (
                    <TableRow key={user._id}>
                      <TableCell >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.imgUrl} alt={user.name} />
                            <AvatarFallback className="bg-orange-100 text-orange-700">
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
                      <TableCell className="text-center">
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
                      <TableCell className="text-center">
                        <Badge
                          variant={(user.schoolStatus || "active") === "active" ? "default" : "secondary"}
                          className={(user.schoolStatus || "active") === "active"
                            ? "bg-green-600 text-white flex-shrink-0 ml-2"
                            : "flex-shrink-0 ml-2 bg-gray-600/70 text-white"}
                        >
                          {(user.schoolStatus || "active") === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDate(user.admissionDate || user.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenView(user)}
                            className="hover:scale-105 transition-transform cursor-pointer"
                            disabled={isCrudLoading}
                          >
                            <Eye className="h-8 w-8 p-0" />
                          </Button>
                          <Button
                            className= "hover:scale-105 transition-transform cursor-pointer h-8 w-8 p-0"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(user)}
                            
                            disabled={isCrudLoading}
                          >
                            <Pencil className="h-4 w-4"/>
                          </Button>
                          {user.schoolStatus === "active" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDelete(user)}
                              className="text-destructive hover:text-destructive hover:scale-105 transition-transform cursor-pointer"
                              disabled={isCrudLoading}
                            >
                              <Trash2 className="h-8 w-8 p-0" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
            ? "Agregar Tutor"
            : operation === "edit"
              ? "Editar Tutor"
              : operation === "view"
                ? "Ver Tutor"
                : "Desactivar Tutor"
        }
        description={
          operation === "create"
            ? "Completa la información para agregar un nuevo tutor al sistema"
            : operation === "edit"
              ? "Modifica la información del tutor"
              : operation === "view"
                ? "Información detallada del tutor"
                : undefined
        }
        schema={getSchemaForOperation(operation)}
        data={data}
        isOpen={isOpen}
        onOpenChange={close}
        onSubmit={operation === "create" ? handleCreate : handleUpdate}
        onDelete={() => handleDelete(data || {})}
        deleteConfirmationTitle="¿Desactivar tutor?"
        deleteConfirmationDescription="Esta acción desactivará al tutor de esta escuela. El usuario mantendrá su información en el sistema y podrá ser reactivado posteriormente."
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
                      placeholder="Nombre del tutor"
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
                      disabled={currentOperation === "view" || currentOperation === "edit"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {currentOperation === "create" && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña Temporal (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={(field.value as string) || ""}
                        type="password"
                        placeholder="Dejar vacío si el usuario ya existe"
                        disabled={false}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      💡 Si el email ya existe en el sistema, se asignará el
                      usuario existente automáticamente
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
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Rol:</span>
                    <p className="text-sm">
                      Tutor - Acceso a información de alumnos
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CrudDialog>
    </div>
  );
}
