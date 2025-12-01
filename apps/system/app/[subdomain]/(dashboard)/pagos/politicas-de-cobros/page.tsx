"use client";

import { useUser } from "@clerk/nextjs";
import { BillingRuleCard } from "../../../../../components/billingRules/BillingRuleCard";
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
  CheckCircle,
  Filter,
  Plus,
  XCircle,
  Settings,
  Scale,
} from "@repo/ui/icons";
import { Input } from "@repo/ui/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
import { Search } from "lucide-react";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { BillingRulesForm } from "components/billingRules/BillingRulesForm";
import { useCrudToastMessages } from "../../../../../hooks/useCrudToastMessages";
import { GeneralDashboardSkeleton } from "components/skeletons/GeneralDashboardSkeleton";

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
    createBillingRule,
    updateBillingRule,
    deleteBillingRule,
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
    startDay: "",
    endDay: "",
    maxUses: "",
    usedCount: "",
    cutoffAfterDays: "",
  });

  //   Mensajes de toast personalizados
  const toastMessages = useCrudToastMessages("Política de Cobro");

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
      //   Los toasts ahora los maneja el CrudDialog automáticamente
    } else if (operation === "edit" && data?._id) {
      await updateBillingRule({
        ...baseData,
        _id: data._id as Id<"billingRule">,
        updatedAt: new Date().getTime(),
        updatedBy: currentUser._id,
      });
      //   Los toasts ahora los maneja el CrudDialog automáticamente
    }
  };

  const handleDelete = async (id: string) => {
    await deleteBillingRule(id);
    //   Los toasts ahora los maneja el CrudDialog automáticamente
  };
if (!isLoaded || userLoading || schoolLoading) {
    return (
    
        <GeneralDashboardSkeleton nc={3} />
      
    );
  }
  return (
    <div className="space-y-8 p-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Scale className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">
                    Políticas de Cobros
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Administra las políticas de cobros.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros y Búsqueda
          </CardTitle>
          <CardDescription>
            Encuentra las políticas por nombre, tipo o estado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-2">
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
            <div className="flex flex-col sm:flex-row gap-3">
              <Select
                onValueChange={(v) =>
                  setTypeFilter(v === "all" ? null : v)
                }
                value={typeFilter || ""}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los Tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Tipos</SelectItem>
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
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los Estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Estados</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <CardTitle>
              <div className="flex flex-col gap-2">
                <span>Lista de Políticas de Cobros</span>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 w-fit">
                  {filteredBillingRules.length} políticas
                </Badge>
              </div>
            </CardTitle>
            <Button
              size="lg"
              className="gap-2"
              onClick={openCreate}
              disabled={isCreatingBillingRule}
            >
              <Plus className="h-4 w-4" />
              Agregar Política
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <GeneralDashboardSkeleton nc={3}/>
          ) : filteredBillingRules.length === 0 ? (
            <div className="text-center py-12">
              <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                No se encontraron políticas
              </h3>
              <p className="text-muted-foreground mb-4">
                Intenta ajustar los filtros o no hay políticas registradas.
              </p>
              <Button
                size="lg"
                className="gap-2"
                onClick={openCreate}
                disabled={isCreatingBillingRule}
              >
                <Plus className="h-4 w-4" />
                Agregar Política
              </Button>
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
            ? "Crear Nueva Políticas de Cobros"
            : operation === "edit"
              ? "Editar Políticas de Cobros"
              : "Ver Políticas de Cobros"
        }
        description={
          operation === "create"
            ? "Completa la información de la nueva política"
            : operation === "edit"
              ? "Modifica la información de la política"
              : "Información de la política"
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
        confirmOnSubmit
        submitConfirmationTitle={operation === "create" ? "Confirmar creación de política de cobros" : "Confirmar actualización de política de cobros"}
        submitConfirmationDescription={operation === "create" ? "Estás a punto de registrar una nueva política de cobros. Por favor revisa los datos antes de continuar." : "Se aplicarán cambios a la política de cobros seleccionada. Revisa la información para asegurarte de que sea correcta antes de continuar. Los cobros que estan asociados a esta política sera modificados."}
        isOpen={isOpen}
        onOpenChange={close}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        isSubmitting={isCreatingBillingRule || isUpdatingBillingRule}
        isDeleting={isDeletingBillingRule}
        toastMessages={toastMessages}
        disableDefaultToasts={false}
      >
        {(form, operation) => (
          <BillingRulesForm
            form={form}
            operation={operation}
          />
        )}
      </CrudDialog>
    </div>
  );
}