"use client"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@repo/ui/components/shadcn/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/shadcn/table"
import { Filter, DollarSign, Plus, Settings, CheckCircle, XCircle, Search } from "lucide-react"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { Input } from "@repo/ui/components/shadcn/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select"
import { Button } from "@repo/ui/components/shadcn/button"
import { CrudDialog, useCrudDialog } from "@repo/ui/components/dialog/crud-dialog"
import { useMutation, useQuery } from "convex/react"
import { api } from "@repo/convex/convex/_generated/api"
import { toast } from "sonner"
import { useUser } from "@clerk/nextjs"
import { useUserWithConvex } from "stores/userStore"
import { useCurrentSchool } from "stores/userSchoolsStore"
import { Id } from "@repo/convex/convex/_generated/dataModel"
import { Eye, Pencil, School, Trash2 } from "@repo/ui/icons"
import { BillingConfigDto, billingConfigSchema } from "schema/billingConfigSchema"
import { PAYMENT_TYPES, RECURRENCE_TYPES, SCOPE_TYPES, STATUS_TYPES } from "lib/billing/constants"
import { BillingConfigForm } from "./BillingConfigForm"
import { useGroup } from "stores/groupStore"
import { PaymentResultModal } from "./BillingResultsDialog"
import { ResultData } from "@/types/billingConfig"

export default function BillingConfig() {
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

  const billingConfigs = useQuery(
    api.functions.billingConfig.getBillingsConfigs,
    currentSchool ? { schoolId: currentSchool.school._id as Id<'school'> } : 'skip'
  )

  const createConfig = useMutation(api.functions.billingConfig.createBillingConfig)
  const updateConfig = useMutation(api.functions.billingConfig.updateBillingConfig)
  const deleteConfig = useMutation(api.functions.billingConfig.deleteBillingConfig)

  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [schoolCycleFilter, setSchoolCycleFilter] = useState<string>("all")
  const [scopeFilter, setScopeFilter] = useState<string>("all")

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
    status: "required",
    startDate: "",
    endDate: "",
  })

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
        title: "Cong. Obligatorias",
        value: configs.filter(c => c.status === "required").length.toString(),
        icon: Settings,
        trend: "Activas en el sistema",
        variant: "default" as const
      },
      {
        title: "Cong. Opcionales",
        value: configs.filter(c => c.status === "optional").length.toString(),
        icon: CheckCircle,
        trend: "Disponibles",
        variant: "secondary" as const
      },
      {
        title: "Cong. Inactivas",
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

  const handleSubmit = async (values: Record<string, unknown>) => {
    const validatedValues = values as BillingConfigDto

    try {
      if (operation === "create") {
        const result = await createConfig({
          schoolId: currentSchool?.school._id as Id<'school'>,
          schoolCycleId: validatedValues.schoolCycleId as Id<"schoolCycle">,
          scope: validatedValues.scope,
          targetGroup: validatedValues.targetGroup as Id<"group">[] | undefined,
          targetGrade: validatedValues.targetGrade,
          targetStudent: validatedValues.targetStudent as Id<"student">[] | undefined,
          recurrence_type: validatedValues.recurrence_type,
          type: validatedValues.type,
          amount: validatedValues.amount,
          startDate: new Date(validatedValues.startDate).getTime(),
          endDate: new Date(validatedValues.endDate).getTime(),
          status: validatedValues.status,
          createdBy: currentUser?._id as Id<'user'>,
        })
        if (result && typeof result === "object" && "createdPayments" in result) {
          setResultData(result as ResultData);
        } else {
          setResultData(null);
        }
        setShowResultModal(true);
        toast.success("Configuración creada exitosamente")
      } else if (operation === "edit") {
        await updateConfig({
          id: validatedValues._id as Id<'billingConfig'>,
          schoolId: currentSchool?.school._id as Id<'school'>,
          schoolCycleId: validatedValues.schoolCycleId as Id<"schoolCycle"> | undefined,
          scope: validatedValues.scope,
          targetGroup: validatedValues.targetGroup as Id<"group">[] | undefined,
          targetGrade: validatedValues.targetGrade,
          targetStudent: validatedValues.targetStudent as Id<"student">[] | undefined,
          recurrence_type: validatedValues.recurrence_type,
          type: validatedValues.type,
          amount: validatedValues.amount,
          startDate: new Date(validatedValues.startDate).getTime(),
          endDate: new Date(validatedValues.endDate).getTime(),
          status: validatedValues.status,
        })
        toast.success("Configuración actualizada exitosamente")
      }
      close()
    } catch (err) {
      console.error(err)
      toast.error("Error al guardar la configuración")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteConfig({
        id: id as Id<'billingConfig'>,
        schoolId: currentSchool?.school?._id as Id<"school">
      })
      toast.success("Configuración inactiva")
      close()
    } catch (err) {
      console.error(err)
      toast.error("Error al eliminar la configuración")
    }
  }

  const getSchoolCycleName = (cycleId: Id<"schoolCycle">) => {
    return schoolCycles?.find(c => c._id === cycleId)?.name ?? "N/A"
  }

  const getScopeDisplay = (config: NonNullable<typeof billingConfigs>[number]) => {
    if (config.scope === "all_students") return "Todos"
    if (config.scope === "specific_groups") {
      return `${config.targetGroup?.length ?? 0} grupo(s)`
    }
    if (config.scope === "specific_grades") {
      return `${config.targetGrade?.length ?? 0} grado(s)`
    }
    if (config.scope === "specific_students") {
      return `${config.targetStudent?.length ?? 0} estudiante(s)`
    }
    return "N/A"
  }

  const getStatusBadge = (status: keyof typeof STATUS_TYPES) => {
    const variants = {
      required: "default",
      optional: "secondary",
      inactive: "destructive"
    } as const

    return (
      <Badge variant={variants[status]}>
        {STATUS_TYPES[status]}
      </Badge>
    )
  }

  if (schoolLoading) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>
  }

  return (
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
              <div className="text-xl font-bold">{stat.value}</div>
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
                placeholder="Buscar por tipo de pago..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-1 flex-col md:flex-row gap-3 justify-center">
              <div className="flex flex-1 flex-col sm:flex-row gap-3 justify-center">
                <Select value={schoolCycleFilter} onValueChange={setSchoolCycleFilter}>
                  <SelectTrigger className="w-full md:w-50">
                    <School className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Ciclo escolar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los ciclos</SelectItem>
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
            <CardTitle>Configuraciones de Cobros</CardTitle>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Configuración
            </Button>
          </div>
          <CardDescription>
            {filteredConfigs.length} configuración(es) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ciclo Escolar</TableHead>
                  <TableHead>Alcance</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Recurrencia</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConfigs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      No se encontraron configuraciones
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredConfigs.map((config) => (
                    <TableRow key={config._id}>
                      <TableCell className="font-medium">
                        {getSchoolCycleName(config.schoolCycleId)}
                      </TableCell>
                      <TableCell>{getScopeDisplay(config)}</TableCell>
                      <TableCell>{PAYMENT_TYPES[config.type]}</TableCell>
                      <TableCell>{RECURRENCE_TYPES[config.recurrence_type]}</TableCell>
                      <TableCell className="text-right font-mono">
                        ${config.amount.toLocaleString('es-MX')}
                      </TableCell>
                      <TableCell>
                        {new Date(config.startDate).toLocaleDateString('es-MX')}
                      </TableCell>
                      <TableCell>
                        {new Date(config.endDate).toLocaleDateString('es-MX')}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(config.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openView(config)}
                            className="hover:scale-105 transition-transform cursor-pointer"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(config)}
                            className="hover:scale-105 transition-transform cursor-pointer"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDelete(config)}
                            className="hover:scale-105 transition-transform cursor-pointer text-destructive hover:text-destructive"
                            title="Desactivar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CrudDialog
        isOpen={isOpen}
        operation={operation}
        title={
          operation === "create" ? "Crear Configuración de Cobro" :
            operation === "edit" ? "Editar Configuración de Cobro" :
              "Ver Configuración de Cobro"
        }
        description="Completa los campos para configurar el cobro."
        schema={billingConfigSchema}
        defaultValues={{
          schoolCycleId: schoolCycles?.[schoolCycles.length - 1]?._id ?? "",
          scope: "all_students",
          recurrence_type: "mensual",
          type: "colegiatura",
          amount: 0,
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
      >
        {(form, operation) => (

          <BillingConfigForm
            form={form}
            operation={operation}
            groups={groups || []}
            schoolCycles={schoolCycles || []}
            students={students || []}
          />

        )}
      </CrudDialog>

      {showResultModal && resultData && (
        <PaymentResultModal
          isOpen={showResultModal}
          onClose={() => setShowResultModal(false)}
          data={resultData}
        />
      )}

    </div>
  )
}