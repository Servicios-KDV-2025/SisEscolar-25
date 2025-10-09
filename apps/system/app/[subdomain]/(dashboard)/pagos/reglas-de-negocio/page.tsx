"use client";

import { useUser } from "@clerk/nextjs";
import { BillingRuleCard } from "../../../../../components/BillingRuleCard";
import { useUserWithConvex } from "stores/userStore";
import { useCurrentSchool } from "stores/userSchoolsStore";
import { useBillingRule } from "stores/billingRuleStore";
import {
  CrudDialog,
  useCrudDialog,
} from "@repo/ui/components/dialog/crud-dialog";
import { billingRuleSchema } from "types/form/billingRuleSchema";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  AlertCircle,
  CheckCircle,
  Filter,
  Plus,
  XCircle,
  Settings,
} from "@repo/ui/icons";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/shadcn/form";
import { Input } from "@repo/ui/components/shadcn/input";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@repo/ui/components/shadcn/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { usePermissions } from "../../../../../hooks/usePermissions";
import NotAuth from "../../../../../components/NotAuth";

export default function BillingRulePage() {
  const { user: clerkUser, isLoaded } = useUser();
  const { currentUser, isLoading: userLoading } = useUserWithConvex(
    clerkUser?.id
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const { currentSchool, isLoading: schoolLoading } = useCurrentSchool(
    currentUser?._id
  );

  const isLoading = !isLoaded || userLoading || schoolLoading;

  const {
    billingRules,
    isCreating: isCreatingBillingRule,
    isUpdating: isUpdatingBillingRule,
    isDeleting: isDeletingBillingRule,
    createError: createBillingRuleError,
    updateError: updateBillingRuleError,
    deleteError: deleteBillingRuleError,
    createBillingRule,
    updateBillingRule,
    deleteBillingRule,
    clearErrors: clearBillingRuleErrors,
  } = useBillingRule(currentSchool?.school._id);

  const {
    isOpen,
    operation,
    data,
    openCreate,
    openEdit,
    openView,
    openDelete,
    close,
  } = useCrudDialog(billingRuleSchema, {
    name: "",
    description: "",
    type: "",
    scope: "",
    status: "",
    lateFeeType: "",
    lateFeeValue: "",
    startDay: "",
    endDay: "",
    maxUses: "",
    usedCount: "",
    cutoffAfterDays: "",
  });

  const filteredBillingRules = billingRules.filter((rule) => {
    const matchesSearch = rule.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || rule.status === statusFilter;
    const matchesType = !typeFilter || rule.type === typeFilter;
    return matchesStatus && matchesSearch && matchesType;
  });

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!currentSchool?.school._id || !currentUser?._id) {
      return;
    }

    const baseData = {
      schoolId: currentSchool.school._id,
      name: values.name as string,
      description: values.description as string | undefined,
      type: values.type as "late_fee" | "early_discount" | "cutoff",
      scope: values.scope as "estandar" | "becarios" | "all_students",
      status: values.status as "active" | "inactive",
      lateFeeType: values.lateFeeType as "percentage" | "fixed" | undefined,
      lateFeeValue: values.lateFeeValue as number | undefined,
      startDay: values.startDay as number | undefined,
      endDay: values.endDay as number | undefined,
      maxUses: values.maxUses as number | undefined,
      usedCount: values.usedCount as number | undefined,
      cutoffAfterDays: values.cutoffAfterDays as number | undefined,
    };

    if (operation === "create") {
      await createBillingRule({
        ...baseData,
        createdBy: currentUser._id,
        updatedBy: currentUser._id,
      });
    } else if (operation === "edit" && data?._id) {
      await updateBillingRule({
        ...baseData,
        _id: data._id as Id<"billingRule">,
        updatedAt: new Date().getTime(),
        updatedBy: currentUser._id,
      });
    }
  };

  const handleDelete = async (id: string) => {
    await deleteBillingRule(id);
    try {
      toast.success("Eliminado correctamente");
    } catch (error) {
      toast.error("Error al eliminar regla de facturación", {
        description: (error as Error).message,
      });
      throw error;
    }
  };

  const generateDescription = (values: any) => {
    const { type, lateFeeType, lateFeeValue, startDay, endDay, cutoffAfterDays, scope } = values;

    let description = "";

    if (type === "early_discount") {
      description = `Descuento por pronto pago`;
      if (lateFeeType && lateFeeValue) {
        description += ` del ${lateFeeType === "percentage" ? `${lateFeeValue}%` : `$${lateFeeValue}`}`;
      }
      if (startDay !== undefined && endDay !== undefined) {
        description += ` si paga entre el día ${startDay} y ${endDay}`;
      }
    } else if (type === "late_fee") {
      description = `Recargo por pago tardío`;
      if (lateFeeType && lateFeeValue) {
        description += ` del ${lateFeeType === "percentage" ? `${lateFeeValue}%` : `$${lateFeeValue}`}`;
      }
      if (startDay !== undefined && endDay !== undefined) {
        description += ` a partir del día ${startDay} hasta el día ${endDay}`;
      }
    } else if (type === "cutoff") {
      if (cutoffAfterDays) {
        description = `Suspensión por impago después de ${cutoffAfterDays} días`;
      } else {
        description = `Suspensión por impago`;
      }
    }

    if (scope && scope !== "all_students") {
      const scopeLabel = scope === "estandar" ? "estándar" : scope === "becarios" ? "becarios" : scope;
      description += ` para ${scopeLabel}`;
    }

    return description;
  };

  const {
    canCreateSubject,
    canReadSubject,
  } = usePermissions(currentSchool?.school._id);

  return (
    <>
      {canReadSubject ? (
        <div className="space-y-8 p-6">
          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
            <div className="relative p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <Settings className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold tracking-tight">
                        Reglas de Negocio
                      </h1>
                      <p className="text-lg text-muted-foreground">
                        Administra las reglas de facturación y descuentos.
                      </p>
                    </div>
                  </div>
                </div>
                {canCreateSubject && (<Button
                  size="lg"
                  className="gap-2"
                  onClick={openCreate}
                  disabled={isCreatingBillingRule}
                >
                  <Plus className="h-4 w-4" />
                  Agregar Regla
                </Button>)}
              </div>
            </div>
          </div>

          {/* Error Alerts */}
          {(createBillingRuleError || updateBillingRuleError || deleteBillingRuleError) && (
            <div className="space-y-4">
              {createBillingRuleError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Error al crear regla: {createBillingRuleError}
                  </AlertDescription>
                </Alert>
              )}
              {updateBillingRuleError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Error al actualizar regla: {updateBillingRuleError}
                  </AlertDescription>
                </Alert>
              )}
              {deleteBillingRuleError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Error al eliminar regla: {deleteBillingRuleError}
                  </AlertDescription>
                </Alert>
              )}
              <button
                onClick={clearBillingRuleErrors}
                className="text-xs text-blue-500 underline mt-1"
              >
                Limpiar errores
              </button>
            </div>
          )}

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total
                </CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-bold">{billingRules.length}</div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Activas
                </CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <CheckCircle className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-bold">
                  {billingRules.filter((r) => r.status === "active").length}
                </div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Inactivas
                </CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <XCircle className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-bold">
                  {billingRules.filter((r) => r.status === "inactive").length}
                </div>
              </CardContent>
            </Card>
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
                    Encuentra las reglas por nombre, tipo o estado
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
                      placeholder="Buscar por nombre..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select
                    onValueChange={(v) =>
                      setTypeFilter(v === "all" ? null : v)
                    }
                    value={typeFilter || ""}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Filtrar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      <SelectItem value="late_fee">Recargo por mora</SelectItem>
                      <SelectItem value="early_discount">Descuento anticipado</SelectItem>
                      <SelectItem value="cutoff">Corte</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    onValueChange={(v) =>
                      setStatusFilter(v === "all" ? null : v)
                    }
                    value={statusFilter || ""}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Filtrar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Activos</SelectItem>
                      <SelectItem value="inactive">Inactivos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de Reglas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Lista de Reglas de Negocio</span>
                <Badge variant="outline">
                  {filteredBillingRules.length} reglas
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">
                      Cargando reglas...
                    </p>
                  </div>
                </div>
              ) : filteredBillingRules.length === 0 ? (
                <div className="text-center py-12">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No se encontraron reglas
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Intenta ajustar los filtros o no hay reglas registradas.
                  </p>
                    {canCreateSubject && (<Button
                    size="lg"
                    className="gap-2"
                    onClick={openCreate}
                    disabled={isCreatingBillingRule}
                  >
                    <Plus className="h-4 w-4" />
                    Nueva Regla
                  </Button>)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-9">
                  {filteredBillingRules.map((rule) => (
                    <BillingRuleCard
                      key={rule._id}
                      billingRule={rule}
                      openEdit={openEdit}
                      openView={openView}
                      openDelete={openDelete}
                      isUpdatingBillingRule={isUpdatingBillingRule}
                      isDeletingBillingRule={isDeletingBillingRule}
                      canUpdateBillingRule={canCreateSubject}
                      canDeleteBillingRule={canCreateSubject}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <CrudDialog
            operation={operation}
            title={
              operation === "create"
                ? "Crear Nueva Regla de Negocio"
                : operation === "edit"
                  ? "Editar Regla de Negocio"
                  : "Ver Regla de Negocio"
            }
            description={
              operation === "create"
                ? "Completa la información de la nueva regla"
                : operation === "edit"
                  ? "Modifica la información de la regla"
                  : "Información de la regla"
            }
            schema={billingRuleSchema}
            defaultValues={{
              name: "",
              description: "",
              type: "late_fee",
              scope: "estandar",
              status: "active",
            }}
            data={data}
            isOpen={isOpen}
            onOpenChange={close}
            onSubmit={handleSubmit}
            onDelete={handleDelete}
            isSubmitting={isCreatingBillingRule || isUpdatingBillingRule}
            isDeleting={isDeletingBillingRule}
          >
            {(form, operation) => {
              const nameValue = (form.watch("name") as string) || "";
              const descriptionValue =
                (form.watch("description") as string) || "";

              // Auto-generate description
              useEffect(() => {
                if (operation === "create" || operation === "edit") {
                  const currentValues = form.getValues();
                  const autoDescription = generateDescription(currentValues);
                  if (autoDescription && autoDescription !== currentValues.description) {
                    form.setValue("description", autoDescription);
                  }
                }
              }, [
                form.watch("type"),
                form.watch("lateFeeType"),
                form.watch("lateFeeValue"),
                form.watch("startDay"),
                form.watch("endDay"),
                form.watch("cutoffAfterDays"),
                form.watch("scope"),
                operation
              ]);

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              placeholder="Nombre de la regla"
                              value={field.value as string}
                              disabled={operation === "view"}
                              maxLength={50}
                            />
                            <div className="absolute right-2 top-2 text-xs text-muted-foreground">
                              {nameValue.length}/50
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Textarea
                              {...field}
                              placeholder="La descripción se genera de manera automatica de acuerdo a los campos agregagos"
                              value={field.value as string}
                              disabled={true}
                              maxLength={150}
                              className="pr-12"
                            />
                            <div className="absolute right-2 top-2 text-xs text-muted-foreground">
                              {descriptionValue.length}/150
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value?.toString()}
                          disabled={operation === "view"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="late_fee">Recargo por mora</SelectItem>
                            <SelectItem value="early_discount">Descuento anticipado</SelectItem>
                            <SelectItem value="cutoff">Corte</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scope"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alcance</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value?.toString()}
                          disabled={operation === "view"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un alcance" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="estandar">Estándar</SelectItem>
                            <SelectItem value="becarios">Becarios</SelectItem>
                            <SelectItem value="all_students">Todos los estudiantes</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  

                  {/* Additional fields for specific types */}
                  {((form.watch("type") === "late_fee") || (form.watch("type") === "early_discount")) && (
                    <>
                      <FormField
                        control={form.control}
                        name="lateFeeType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de {form.watch("type") === "late_fee" ? "Recargo" : "Descuento"}</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value?.toString()}
                              disabled={operation === "view"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="percentage">Porcentaje</SelectItem>
                                <SelectItem value="fixed">Fijo</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lateFeeValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor del {form.watch("type") === "late_fee" ? "Recargo" : "Descuento"}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                placeholder="0.00"
                                value={typeof field.value === "number" || typeof field.value === "string" ? field.value : ""}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                disabled={operation === "view"}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="startDay"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Día de Inicio</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                placeholder="0"
                                value={typeof field.value === "number" || typeof field.value === "string" ? field.value : ""}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                disabled={operation === "view"}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endDay"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Día de Fin</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                placeholder="0"
                                value={typeof field.value === "number" || typeof field.value === "string" ? field.value : ""}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                disabled={operation === "view"}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {(form.watch("type") === "cutoff") && (
                    <FormField
                      control={form.control}
                      name="cutoffAfterDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Días para Corte</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              placeholder="0"
                              value={typeof field.value === "number" || typeof field.value === "string" ? field.value : ""}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                              disabled={operation === "view"}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              );
            }}
          </CrudDialog>
        </div>
      ) : (
        <NotAuth
          pageName="Reglas de Negocio"
          pageDetails="Aquí puedes gestionar las reglas de facturación de tu institución."
          icon={Settings}
        />
      )}
    </>
  );
}