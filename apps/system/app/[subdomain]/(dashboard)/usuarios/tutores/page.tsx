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
  FileText,
} from "@repo/ui/icons";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Alert, AlertDescription } from "@repo/ui/components/shadcn/alert";
import { z } from "@repo/zod-config/index";
import { toast } from "@repo/ui/sonner";
import {
  tutorSchema,
  tutorCreateSchema,
  tutorEditSchema,
  fiscalDataSchema,
} from "@/types/form/userSchemas";
import { useUserWithConvex } from "../../../../../stores/userStore";
import { useCurrentSchool } from "../../../../../stores/userSchoolsStore";
import { useUserActionsWithConvex } from "../../../../../stores/userActionsStore";
import { usePermissions } from "../../../../../hooks/usePermissions";
import NotAuth from "../../../../../components/NotAuth";
import { useCrudToastMessages } from "../../../../../hooks/useCrudToastMessages";
import { GeneralDashboardSkeleton } from "../../../../../components/skeletons/GeneralDashboardSkeleton";

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

  // Obtener permisos del usuario
  const {
    canCreateUsersTutores,
    canReadUsersTutores,
    canUpdateUsersTutores,
    canDeleteUsersTutores,
    isLoading: permissionsLoading,
    error: permissionsError,
  } = usePermissions(currentSchool?.school?._id);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  // Obtener datos fiscales para todos los tutores
  const fiscalDataList = useQuery(
    api.functions.fiscalData.getAllFiscalData,
    currentSchool?.school?._id ? {} : "skip"
  );

  const allUsers = activeUsers?.concat(inactiveUsers || []);

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

  // Mutations para datos fiscales
  const createFiscalData = useMutation(api.functions.fiscalData.createFiscalData);
  const updateFiscalData = useMutation(api.functions.fiscalData.updateFiscalData);
  const deleteFiscalData = useMutation(api.functions.fiscalData.deleteFiscalData);

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

  // Hook del CRUD Dialog para tutores
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

  //   Mensajes de toast personalizados
  const toastMessages = useCrudToastMessages("Tutor");
  const toastMessagesFiscal = useCrudToastMessages("Datos Fiscales");

  // Hook del CRUD Dialog para datos fiscales
  const {
    isOpen: isFiscalOpen,
    operation: fiscalOperation,
    data: fiscalData,
    openCreate: openFiscalCreate,
    openEdit: openFiscalEdit,
    close: closeFiscal,
  } = useCrudDialog(fiscalDataSchema, {});

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
    const editData = {
      ...user,
      userSchoolId: user.userSchoolId,
      status: user.schoolStatus,
    };

    openEdit(editData);
  };

  const handleOpenView = (user: UserFromConvex) => {
    userActions.clearErrors();
    userActions.clearLastResult();

    // Preparar datos para vista incluyendo userSchoolId
    const viewData = {
      ...user,
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

  // Funciones para manejar datos fiscales
  const handleOpenFiscalCreate = (user: UserFromConvex) => {
    setSelectedTutorForFiscal(user);
    openFiscalCreate();
  };

  const handleOpenFiscalEdit = (user: UserFromConvex) => {
    setSelectedTutorForFiscal(user);
    const userFiscalData = fiscalDataList?.find(fd => fd.userId === user._id);
    if (userFiscalData) {
      openFiscalEdit(userFiscalData);
    } else {
      // Si no tiene datos fiscales, abrir en modo crear
      handleOpenFiscalCreate(user);
    }
  };

  // Filtrado de datos - Solo tutores
  const filteredUsers = useMemo(() => {
    if (!allUsers) return [];

    return allUsers
      .filter((user: UserFromConvex) => user.schoolRole.includes("tutor"))
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

  const paginatedUsers = useMemo(() => {
    const sortedData = [...filteredUsers].sort((a, b) => {
      const nameA = `${a.name} ${a.lastName || ''}`.toLowerCase().trim();
      const nameB = `${b.name} ${b.lastName || ''}`.toLowerCase().trim();
      return nameA.localeCompare(nameB);
    });

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return sortedData.slice(startIndex, endIndex);

  }, [filteredUsers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Estado para almacenar el tutor seleccionado para datos fiscales
  const [selectedTutorForFiscal, setSelectedTutorForFiscal] = useState<UserFromConvex | null>(null);

  // Funciones CRUD para datos fiscales
  const handleFiscalCreate = async (formData: Record<string, unknown>) => {
    if (!currentUser?._id) {
      throw new Error("Usuario actual no disponible");
    }

    if (!selectedTutorForFiscal?._id) {
      throw new Error("Tutor no seleccionado");
    }

    const fiscalDataToCreate = {
      ...(formData as z.infer<typeof fiscalDataSchema>),
      userId: selectedTutorForFiscal._id,
      createBy: currentUser._id,
      country: "MXN" as const,
    };

    // Los toasts ahora los maneja el CrudDialog automáticamente
    await createFiscalData(fiscalDataToCreate);
  };

  const handleFiscalUpdate = async (formData: Record<string, unknown>) => {
    if (!currentUser?._id) {
      throw new Error("Usuario actual no disponible");
    }

    if (!fiscalData || !fiscalData._id) {
      throw new Error("Datos fiscales no disponibles para actualizar");
    }

    const fiscalDataToUpdate = {
      ...formData,
      id: fiscalData._id as Id<"fiscalData">,
      updatedBy: currentUser._id,
    };

    // Los toasts ahora los maneja el CrudDialog automáticamente
    await updateFiscalData(fiscalDataToUpdate);
  };

  const handleFiscalDelete = async (deleteData: Record<string, unknown>) => {
    if (!deleteData._id) {
      throw new Error("ID de datos fiscales no disponible");
    }

    // Los toasts ahora los maneja el CrudDialog automáticamente
    await deleteFiscalData({ id: deleteData._id as Id<"fiscalData"> });
  };

  // Funciones CRUD para tutores
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

          // Crear array con los roles combinados (agregando tutor)
          const newRolesSet = new Set([...existingRoles, "tutor"]);
          const newRoleArray = Array.from(newRolesSet) as Array<"superadmin" | "admin" | "auditor" | "teacher" | "tutor">;

          console.log(
            `⚠️ Agregando rol de tutor. Roles anteriores: ${existingRoles.join(", ")}. Nuevos roles: ${newRoleArray.join(", ")}`
          );

          // Actualizar la relación existente con el nuevo rol
          await updateUserSchoolRelation({
            id: userInCurrentSchool.userSchoolId,
            role: newRoleArray,
            department: userInCurrentSchool.department || null,
            status: "active",
          });

          return;
        }

        // Usuario existe pero NO está asignado a esta escuela - CREAR relación
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
      } else {
        console.error("Error al crear usuario en Clerk:", result.error);
        throw new Error(result.error || "Error al crear usuario en Clerk");
      }
    } catch (error) {
      console.error("❌ Error en handleCreate:", error);
      toast.error(`Error al crear tutor: ${error instanceof Error ? error.message : "Error desconocido"}`);
      throw error;
    }

    toast.success("Tutor creado exitosamente");
  };

  const handleUpdate = async (formData: Record<string, unknown>) => {
    // Combinar datos del formulario con datos originales para tener clerkId
    const combinedData = { ...data, ...formData };

    // Asumir que 'data' es del tipo UserFromConvex, que tiene schoolRole
    const originalRoles = (data as UserFromConvex)?.schoolRole;

    if (!combinedData.clerkId) {
      console.error("Clerk ID de usuario no disponible");
      throw new Error("Clerk ID de usuario no disponible");
    }

    if (!combinedData.userSchoolId) {
      console.error("UserSchool ID no disponible");
      throw new Error("UserSchool ID no disponible");
    }

    // Asegurarse de tener los roles originales
    if (!originalRoles) {
      console.error("Roles de usuario no disponibles para actualizar");
      throw new Error("Roles de usuario no disponibles para actualizar");
    }

    try {
      // PASO 1: Actualizar información básica del usuario en Clerk
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
        console.error(
          "Error al actualizar usuario en Clerk:",
          userResult.error
        );
        throw new Error(
          userResult.error ||
          "Error al actualizar información básica del usuario"
        );
      }

      // PASO 2: Actualizar estado en la relación usuario-escuela (MANTENER TODOS LOS ROLES)
      await updateUserSchoolRelation({
        id: combinedData.userSchoolId as Id<"userSchool">,
        role: originalRoles,
        department: null,
        status: (combinedData.status as "active" | "inactive") || "active",
      });

      toast.success("Tutor actualizado exitosamente");
    } catch (error) {
      console.error("Error en handleUpdate:", error);
      toast.error(`Error al actualizar tutor: ${error instanceof Error ? error.message : "Error desconocido"}`);
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
      // Realizar soft delete: cambiar status a 'inactive'
      await deactivateUserInSchool({
        userSchoolId: targetData.userSchoolId as Id<"userSchool">,
      });

      toast.success("Tutor desactivado exitosamente");
    } catch (error) {
      console.error("Error al desactivar tutor:", error);
      toast.error(`Error al desactivar tutor: ${error instanceof Error ? error.message : "Error desconocido"}`);
      throw error;
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
  const isLoading = schoolLoading || permissionsLoading || allUsers === undefined;
  const isCrudLoading =
    userActions.isCreating || userActions.isUpdating || userActions.isDeleting;

  if (isLoading) {
    return <GeneralDashboardSkeleton />;
  }

  // Verificar error de permisos o falta de permiso de lectura
  if ((permissionsError || !canReadUsersTutores) && !permissionsLoading && !isLoading) {
    return (
      <NotAuth
        pageName="Tutores"
        pageDetails="Administra los tutores que tienen acceso a información de alumnos"
        icon={GraduationCap}
      />
    );
  }

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

  const PaginationControls = () => {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, filteredUsers.length);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 border-t">
        {/* Info de registros */}
        <div className="text-sm text-muted-foreground">
          Mostrando <span className="font-medium">{startItem}</span> a{" "}
          <span className="font-medium">{endItem}</span> de{" "}
          <span className="font-medium">{filteredUsers.length}</span> registros
        </div>

        {/* Controles de paginación */}
        <div className="flex items-center gap-2">
          {/* Selector de items por página */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Mostrar:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            {/* Primera página */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            {/* Página anterior */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Números de página */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;

                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNumber)}
                    className="h-8 w-8 p-0"
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>

            {/* Página siguiente */}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Última página */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

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
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <CardTitle>
              <div className="flex flex-col gap-2">
              <span>Lista de Tutores</span>
                <Badge
                  variant="outline"
                  className="bg-orange-50 text-orange-700 border-orange-200 w-fit"
                >
                  {filteredUsers.length} tutores
                </Badge>
              </div>
            </CardTitle>
            {canCreateUsersTutores && (
              <Button
                size="lg"
                className="gap-2 bg-orange-600 hover:bg-orange-700"
                onClick={handleOpenCreate}
                disabled={isLoading || !currentSchool || isCrudLoading}
              >
                <Plus className="w-4 h-4" />
                Agregar Tutor
              </Button>
            )}
          </div>
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
              {canCreateUsersTutores && (
                <Button
                  onClick={handleOpenCreate}
                  className="gap-2 bg-orange-600 hover:bg-orange-700"
                  disabled={!currentSchool || isCrudLoading}
                >
                  <Plus className="h-4 w-4" />
                  Agregar Tutor
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Vista de tabla para pantallas medianas y grandes */}
              <div className="hidden md:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Tutor</TableHead>
                      <TableHead className="text-center hidden lg:table-cell">
                        Contacto
                      </TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead className="text-center hidden xl:table-cell">
                        Fecha de Ingreso
                      </TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user: UserFromConvex) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={user.imgUrl}
                                alt={user.name}
                              />
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
                        <TableCell className="text-center hidden lg:table-cell">
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
                                <span className="truncate max-w-[150px]">
                                  {user.address}
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              (user.schoolStatus || "active") === "active"
                                ? "default"
                                : "secondary"
                            }
                            className={
                              (user.schoolStatus || "active") === "active"
                                ? "bg-green-600 text-white"
                                : "bg-gray-600/70 text-white"
                            }
                          >
                            {(user.schoolStatus || "active") === "active"
                              ? "Activo"
                              : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center hidden xl:table-cell">
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
                            {canUpdateUsersTutores && (
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenFiscalEdit(user)}
                              className="h-8 w-8 p-0"
                              disabled={isCrudLoading}
                              title="Datos fiscales"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            {canDeleteUsersTutores && (
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
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Vista de tarjetas para pantallas pequeñas */}
              <div className="md:hidden space-y-4">
                {paginatedUsers.map((user: UserFromConvex) => (
                  <Card key={user._id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user.imgUrl} alt={user.name} />
                            <AvatarFallback className="bg-orange-100 text-orange-700">
                              {getInitials(user.name, user.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {user.name} {user.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={
                            (user.schoolStatus || "active") === "active"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            (user.schoolStatus || "active") === "active"
                              ? "bg-green-600 text-white"
                              : "bg-gray-600/70 text-white"
                          }
                        >
                          {(user.schoolStatus || "active") === "active"
                            ? "Activo"
                            : "Inactivo"}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground font-medium">
                            Rol:
                          </span>
                          <Badge
                            variant="outline"
                            className="bg-orange-50 text-orange-700 border-orange-200"
                          >
                            <GraduationCap className="h-3 w-3 mr-1" />
                            Tutor
                          </Badge>
                        </div>

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
                          <span>
                            {formatDate(user.admissionDate || user.createdAt)}
                          </span>
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
                        {canUpdateUsersTutores && (
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenFiscalEdit(user)}
                          disabled={isCrudLoading}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Datos Fiscales
                        </Button>
                        {canDeleteUsersTutores && (
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
                ))}
              </div>
            </>
          )}
        </CardContent>
        {filteredUsers.length > 0 && <PaginationControls />}
      </Card>

      {/* Dialog CRUD para Tutores */}
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
        defaultValues={{
          name: "",
          lastName: "",
          email: "",
          password: "",
          address: "",
          phone: "",
          status: "active"

        }}
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
        toastMessages={toastMessages}
        disableDefaultToasts={false}
      >
        {(form, currentOperation) => (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
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
                <FormItem className="items-start">
                  <div>
                    <FormLabel>Correo</FormLabel>
                    <FormControl className="mt-2">
                      <Input
                        {...field}
                        value={(field.value as string) || ""}
                        type="email"
                        placeholder="correo@escuela.edu.mx"
                        disabled={
                          currentOperation === "view" ||
                          currentOperation === "edit"
                        }
                      />
                    </FormControl>
                    <FormMessage className="mt-2" />
                  </div>
                </FormItem>
              )}
            />

            {currentOperation === "create" && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={(field.value as string) || ""}
                        type="password"
                        placeholder="Contraseña"
                        disabled={false}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      value={(field.value as string) || ""}
                      placeholder="555 1234567"
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
                <FormItem className="items-start">
                  <div>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value as string}
                        onValueChange={field.onChange}
                        disabled={currentOperation === "view"}
                      >
                        <SelectTrigger className="w-full mt-2">
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Activo</SelectItem>
                          <SelectItem value="inactive">Inactivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </div>
        )}
      </CrudDialog>

      {/* Dialog CRUD para Datos Fiscales */}
      <CrudDialog
        operation={fiscalOperation}
        title={
          fiscalOperation === "create"
            ? "Agregar Datos Fiscales"
            : fiscalOperation === "edit"
              ? "Editar Datos Fiscales"
              : fiscalOperation === "view"
                ? "Ver Datos Fiscales"
                : "Eliminar Datos Fiscales"
        }
        description={
          fiscalOperation === "create"
            ? "Completa la información fiscal necesaria para generar facturas"
            : fiscalOperation === "edit"
              ? "Modifica la información fiscal del tutor"
              : fiscalOperation === "view"
                ? "Información fiscal del tutor"
                : undefined
        }
        schema={fiscalDataSchema}
        defaultValues={{
          legalName: "",
          taxId: "",
          taxSystem: "605",
          cfdiUse: "G03",
          street: "",
          exteriorNumber: "",
          interiorNumber: "",
          neighborhood: "",
          city: "",
          state: "",
          zip: "",
          country: "MXN",
          email: "",
          phone: "",

        }}
        data={fiscalData}
        confirmOnSubmit
        submitConfirmationTitle={operation === "create" ? "Confirmar creación de la información fiscal del tutor" : "Confirmar actualización de la información fiscal del tutor"}
        submitConfirmationDescription={operation === "create" ? "Estás a punto de registrar la información fiscal del tutor. Por favor revisa los datos antes de continuar." : "Se aplicarán cambios a la la información fiscal del tutor seleccionado. Revisa la información para asegurarte de que sea correcta antes de continuar."}
        isOpen={isFiscalOpen}
        onOpenChange={closeFiscal}
        onSubmit={fiscalOperation === "create" ? handleFiscalCreate : handleFiscalUpdate}
        onDelete={() => handleFiscalDelete(fiscalData || {})}
        deleteConfirmationTitle="¿Eliminar datos fiscales?"
        deleteConfirmationDescription="Esta acción eliminará permanentemente los datos fiscales del tutor."
        isLoading={isLoading}
        isSubmitting={false} // TODO: Add loading states for fiscal operations
        isDeleting={false}
        toastMessages={toastMessagesFiscal}
        disableDefaultToasts={false}
      >
        {(form, currentOperation) => (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="legalName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre o Razón Social</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={(field.value as string) || ""}
                      placeholder="Nombre completo o razón social"
                      disabled={currentOperation === "view"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taxId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RFC</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={(field.value as string) || ""}
                      placeholder="RFC (12-13 caracteres)"
                      disabled={currentOperation === "view"}
                      maxLength={13}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taxSystem"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Régimen Fiscal</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value as string}
                      onValueChange={field.onChange}
                      disabled={currentOperation === "view"}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar régimen fiscal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="605">605 - Sueldos y Salarios</SelectItem>
                        <SelectItem value="606">606 - Arrendamiento</SelectItem>
                        <SelectItem value="612">612 - Actividades Empresariales y Profesionales</SelectItem>
                        <SelectItem value="616">616 - Régimen Simplificado de Confianza</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cfdiUse"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Uso de CFDI</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value as string}
                      onValueChange={field.onChange}
                      disabled={currentOperation === "view"}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar uso de CFDI" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="G03">G03 - Gastos en general</SelectItem>
                        <SelectItem value="D10">D10 - Pagos por servicios educativos</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="street"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Calle</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={(field.value as string) || ""}
                      placeholder="Nombre de la calle"
                      disabled={currentOperation === "view"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="exteriorNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número Exterior</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={(field.value as string) || ""}
                      placeholder="Número exterior"
                      disabled={currentOperation === "view"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="interiorNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número Interior</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={(field.value as string) || ""}
                      placeholder="Número interior (opcional)"
                      disabled={currentOperation === "view"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="neighborhood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Colonia</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={(field.value as string) || ""}
                      placeholder="Nombre de la colonia"
                      disabled={currentOperation === "view"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ciudad</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={(field.value as string) || ""}
                      placeholder="Nombre de la ciudad"
                      disabled={currentOperation === "view"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={(field.value as string) || ""}
                      placeholder="Nombre del estado"
                      disabled={currentOperation === "view"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="zip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código Postal</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={(field.value as string) || ""}
                      placeholder="Código postal (5 dígitos)"
                      disabled={currentOperation === "view"}
                      maxLength={5}
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
                  <FormLabel>Correo Fiscal</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={(field.value as string) || ""}
                      type="email"
                      placeholder="correo@fiscal.com"
                      disabled={currentOperation === "view"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono Fiscal</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={(field.value as string) || ""}
                      placeholder="Teléfono de contacto fiscal"
                      disabled={currentOperation === "view"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </CrudDialog>
    </div>
  );
}