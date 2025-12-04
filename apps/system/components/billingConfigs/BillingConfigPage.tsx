"use client"
import { useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@repo/ui/components/shadcn/card"
import { Filter, DollarSign, Plus, Settings, CheckCircle, XCircle, Search } from "lucide-react"
import { useState } from "react"
import { Input } from "@repo/ui/components/shadcn/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select"
import { Button } from "@repo/ui/components/shadcn/button"
import { CrudDialog, useCrudDialog } from "@repo/ui/components/dialog/crud-dialog"
import { useQuery } from "convex/react"
import { api } from "@repo/convex/convex/_generated/api"
import { useUser } from "@clerk/nextjs"
import { useCrudToastMessages } from "../../hooks/useCrudToastMessages";
import { useUserWithConvex } from "stores/userStore"
import { useCurrentSchool } from "stores/userSchoolsStore"
import { Id } from "@repo/convex/convex/_generated/dataModel"
import { BanknoteArrowUp, School } from "@repo/ui/icons"
import { BillingConfigDto, billingConfigSchema } from "@/types/form/billingConfigSchema"
import { PAYMENT_TYPES, SCOPE_TYPES, STATUS_TYPES } from "lib/billing/constants"
import { BillingConfigForm } from "./BillingConfigForm"
import { BillingConfigCard } from "./BillingConfigCard"
import { useGroup } from "stores/groupStore"
import { useBillingConfig } from "stores/billingConfigStore"
import { BillingResultsDialog } from "./BillingResultsDialog"
import { ResultData } from "@/types/billingConfig"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { useBillingRule } from "stores/billingRuleStore"
import { parseLocalDateString } from "lib/utils"

export default function BillingConfigPage() {
  const { user: clerkUser } = useUser()
  const { currentUser } = useUserWithConvex(clerkUser?.id)
  const { currentSchool, isLoading: schoolLoading } = useCurrentSchool(currentUser?._id)

  const schoolCycles = useQuery(
    api.functions.schoolCycles.ObtenerCiclosEscolares,
    currentSchool ? { escuelaID: currentSchool.school._id as Id<'school'> } : 'skip'
  )

  const { groups } = useGroup(currentSchool?.school._id);

  const students = useQuery(
    api.functions.student.listStudentsBySchool,
    currentSchool ? { schoolId: currentSchool.school._id as Id<'school'> } : 'skip'
  )

  const {
    billingConfigs,
    isCreating: isCreatingBillingConfig,
    isUpdating: isUpdatingBillingConfig,
    isDeleting: isDeletingBillingConfig,
    createBillingConfig,
    updateBillingConfig,
    deleteBillingConfig,
  } = useBillingConfig(currentSchool?.school._id)

  const { billingRules } = useBillingRule(currentSchool?.school._id)

  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [schoolCycleFilter, setSchoolCycleFilter] = useState<string>("all")
  const [scopeFilter, setScopeFilter] = useState<string>("all")

  const isLoading = schoolLoading || !billingConfigs

  const {
    isOpen,
    operation,
    data,
    openCreate,
    openEdit,
    openView,
    openDelete,
    close
  } = useCrudDialog(billingConfigSchema, {
    schoolCycleId: "",
    scope: "all_students",
    recurrence_type: "mensual",
    type: "colegiatura",
    amount: 0,
    ruleIds: [],
    status: "required",
    startDate: "",
    endDate: "",
  })

  //   Mensajes de toast personalizados
  const toastMessages = useCrudToastMessages("Configuración de Cobro");

  useEffect(() => {
    if (schoolCycles?.length && schoolCycleFilter === "all") {
      setSchoolCycleFilter(schoolCycles[schoolCycles.length - 1]?._id as Id<"schoolCycle">)
    }
  }, [schoolCycles, schoolCycleFilter])

  const filteredConfigs = useMemo(() => {
    return (billingConfigs ?? []).filter((config) => {
      const matchesSearch = config.type?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = typeFilter === "all" || config.type === typeFilter
      const matchesStatus = statusFilter === "all" || config.status === statusFilter
      const matchesCycle = schoolCycleFilter === "all" || config.schoolCycleId === schoolCycleFilter
      const matchesScope = scopeFilter === "all" || config.scope === scopeFilter

      return matchesSearch && matchesType && matchesStatus && matchesCycle && matchesScope
    })
  }, [billingConfigs, searchTerm, typeFilter, statusFilter, schoolCycleFilter, scopeFilter])

  const stats = useMemo(() => {
    const configs = filteredConfigs ?? []
    return [
      {
        title: "Obligatorias",
        value: configs.filter(c => c.status === "required").length.toString(),
        icon: Settings,
        trend: "Activas en el sistema",
        variant: "default" as const
      },
      {
        title: "Opcionales",
        value: configs.filter(c => c.status === "optional").length.toString(),
        icon: CheckCircle,
        trend: "Disponibles",
        variant: "secondary" as const
      },
      {
        title: "Inactivas",
        value: configs.filter(c => c.status === "inactive").length.toString(),
        icon: XCircle,
        trend: "Deshabilitadas",
        variant: "destructive" as const
      },
      {
        title: "Monto Total Mensual",
        value: `$${configs
          .filter(c => c.status === "required" && c.recurrence_type === "mensual")
          .reduce((sum, c) => sum + c.amount, 0)
          .toLocaleString()}`,
        icon: DollarSign,
        trend: "Pagos mensuales obligatorios",
        variant: "default" as const
      }
    ]
  }, [filteredConfigs])

  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleSubmit = async (values: Record<string, unknown>) => {
    const validatedValues = values as BillingConfigDto

    setIsTransitioning(true)
    try {
      if (operation === "create") {
        const result = await createBillingConfig({
          schoolId: currentSchool?.school._id as Id<'school'>,
          schoolCycleId: validatedValues.schoolCycleId as Id<"schoolCycle">,
          scope: validatedValues.scope,
          targetGroup: validatedValues.targetGroup as Id<"group">[] | undefined,
          targetGrade: validatedValues.targetGrade,
          targetStudent: validatedValues.targetStudent as Id<"student">[] | undefined,
          recurrence_type: validatedValues.recurrence_type,
          type: validatedValues.type,
          amount: validatedValues.amount,
          ruleIds: validatedValues.ruleIds as Id<"billingRule">[],
          startDate: parseLocalDateString(validatedValues.startDate),
          endDate: parseLocalDateString(validatedValues.endDate),
          status: validatedValues.status,
          createdBy: currentUser?._id as Id<'user'>,
          updatedBy: currentUser?._id as Id<'user'>,
        })
        if (result !== undefined) {
          setResultData(result as ResultData);
          setShowResultModal(true);
        } else {
          setResultData(null);
        }
        //   Los toasts ahora los maneja el CrudDialog automáticamente
      } else if (operation === "edit") {
        const result = await updateBillingConfig({
          _id: validatedValues._id as Id<'billingConfig'>,
          schoolId: currentSchool?.school._id as Id<'school'>,
          schoolCycleId: validatedValues.schoolCycleId as Id<"schoolCycle"> | undefined,
          scope: validatedValues.scope,
          targetGroup: validatedValues.targetGroup as Id<"group">[] | undefined,
          targetGrade: validatedValues.targetGrade,
          targetStudent: validatedValues.targetStudent as Id<"student">[] | undefined,
          recurrence_type: validatedValues.recurrence_type,
          type: validatedValues.type,
          amount: validatedValues.amount,
          ruleIds: validatedValues.ruleIds as Id<"billingRule">[],
          startDate: parseLocalDateString(validatedValues.startDate),
          endDate: parseLocalDateString(validatedValues.endDate),
          status: validatedValues.status,
          updatedBy: currentUser?._id as Id<"user">
        })
        if (result !== undefined) {
          setResultData(result as ResultData);
          setShowResultModal(true);
        } else {
          setResultData(null);
        }
        //   Los toasts ahora los maneja el CrudDialog automáticamente
      }
      close()
    } catch (err) {
      console.error(err)
      // Re-lanzar el error para que el CrudDialog lo maneje
      throw err;
    } finally {
      setIsTransitioning(false)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteBillingConfig(id)
    //   Los toasts ahora los maneja el CrudDialog automáticamente
  }

  if (schoolLoading) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>
  }

  return (
    <>
      {isTransitioning && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          role="status"
          aria-live="polite"
          aria-label="Procesando configuración de cobro"
        >
          <div className="flex flex-col items-center space-y-4 rounded-lg bg-white p-8 shadow-lg">
            <div className="relative">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full border-2 border-primary/30"></div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Procesando configuración
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Generando pagos para el alumnado objetivo...
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="relative overflow-hidden group hover:shadow-lg transition-all duration-300"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 lg:pb-3">
                <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className="p-1.5 lg:p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <stat.icon className="h-3 w-3 lg:h-4 lg:w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1 lg:space-y-2">
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.trend}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros y Búsqueda
            </CardTitle>
            <CardDescription>
              Filtra las configuraciones por diferentes criterios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col xl:flex-row space-y-4 gap-2">
              <div className="flex-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por el tipo de configuración de cobro..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-1 flex-col md:flex-row gap-3 justify-center">
                <div className="flex flex-2 flex-col sm:flex-row gap-3 justify-center">
                  <Select value={schoolCycleFilter} onValueChange={setSchoolCycleFilter}>
                    <SelectTrigger className="w-full">
                      <School className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Ciclo escolar" />
                    </SelectTrigger>
                    <SelectContent>
                      {schoolCycles?.map((cycle) => (
                        <SelectItem key={cycle._id} value={cycle._id}>
                          {cycle.name} {cycle.status && "(Activo)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={scopeFilter} onValueChange={setScopeFilter}>
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Alcance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los Alcances</SelectItem>
                      {Object.entries(SCOPE_TYPES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-1 flex-col sm:flex-row gap-3 justify-center">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full md:w-35">
                      <SelectValue placeholder="Tipo de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los Tipos</SelectItem>
                      {Object.entries(PAYMENT_TYPES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-35">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los Estados</SelectItem>
                      {Object.entries(STATUS_TYPES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-col gap-3 sm:flex-row">
              <CardTitle>Lista de Configuraciones de Cobros</CardTitle>
              <Button onClick={openCreate}
                className="w-full mt-1 sm:w-auto sm:mt-0">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Configuración
              </Button>
            </div>

          </CardHeader>
          <CardContent>
            <CardDescription className="flex justify-start mb-3 mr-3">
              <Badge variant="outline">
                {filteredConfigs.length} registro{filteredConfigs.length > 1 ? "s" : ""}
              </Badge>
            </CardDescription>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">
                    Cargando configuraciones...
                  </p>
                </div>
              </div>
            ) : filteredConfigs.length === 0 ? (
              <div className="text-center py-12">
                <BanknoteArrowUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No se encontraron configuraciones
                </h3>
                <p className="text-muted-foreground mb-4">
                  Intenta ajustar los filtros o agregar una configuración.
                </p>
                <Button className="cursor-pointer" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Configuración
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-9">
                {filteredConfigs.map((config) => (
                  <BillingConfigCard
                    key={config._id}
                    billingConfig={config}
                    openEdit={openEdit}
                    openView={openView}
                    openDelete={openDelete}
                    isUpdatingBillingConfig={isCreatingBillingConfig || isUpdatingBillingConfig}
                    isDeletingBillingConfig={isDeletingBillingConfig}
                    canUpdateBillingConfig={true}
                    canDeleteBillingConfig={true}
                    schoolCycles={schoolCycles}
                    billingRules={billingRules}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
      <CrudDialog
        isOpen={isOpen}
        operation={operation}
        title={
          operation === "create" ? "Crear Configuración de Cobro" :
            operation === "edit" ? "Actualizar Configuración de Cobro" :
              "Detalles de la Configuración de Cobro"
        }
        description={operation === "create"
          ?"Completa los campos necesarios para establecer una nueva configuración de cobro y asegurar un proceso de pagos claro y eficiente."
          : operation === "edit"
            ? 'Modifica los datos de esta configuración para mantener un proceso de cobro preciso y actualizado.'
            : 'Consulta la configuración completa de este cobro y verifica que toda la información esté correcta.'
        }
        deleteConfirmationTitle="¿Eliminar Configuración de Cobro?"
        deleteConfirmationDescription="Esta acción eliminará permanentemente esta configuración del sistema. No podrás recuperarla posteriormente."
        schema={billingConfigSchema}
        defaultValues={{
          schoolCycleId: schoolCycles?.[schoolCycles.length - 1]?._id ?? "",
          scope: "all_students",
          recurrence_type: "mensual",
          type: "colegiatura",
          amount: 0,
          ruleIds: [],
          status: "required",
          startDate: "",
          endDate: "",
        }}
        data={
          data
            ? {
              ...data,
              startDate: data.startDate
                ? new Date(Number(data.startDate)).toISOString().split("T")[0]
                : "",
              endDate: data.endDate
                ? new Date(Number(data.endDate)).toISOString().split("T")[0]
                : "",
            }
            : undefined
        }
        confirmOnSubmit
        submitConfirmationTitle={operation === "create" ? "Confirmar creación de configuración" : "Confirmar actualización de configuración"}
        submitConfirmationDescription={operation === "create" ? "Estás a punto de registrar una nueva configuración. Por favor revisa los datos antes de continuar." : "Se aplicarán cambios a la configuración seleccionada. Revisa la información para asegurarte de que sea correcta antes de continuar."}
        onOpenChange={close}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        toastMessages={toastMessages}
        disableDefaultToasts={false}
      >
        {(form, operation) => (

          <BillingConfigForm
            form={form}
            operation={operation}
            groups={groups || []}
            schoolCycles={schoolCycles || []}
            students={students || []}
            billingRules={billingRules || []}
          />

        )}
      </CrudDialog>

      {showResultModal && resultData && (
        <BillingResultsDialog
          isOpen={showResultModal}
          onClose={() => setShowResultModal(false)}
          data={resultData}
          billingRules={billingRules}
        />
      )}
    </>
  )
}