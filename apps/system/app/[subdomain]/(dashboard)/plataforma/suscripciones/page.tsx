"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button"
import { Input } from "@repo/ui/components/shadcn/input"
import { Label } from "@repo/ui/components/shadcn/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/shadcn/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select"
import { Separator } from "@repo/ui/components/shadcn/separator"
import { CrudDialog, useCrudDialog } from "@repo/ui/components/dialog/crud-dialog"
import { UseFormReturn } from "react-hook-form"
import { z } from "zod"
import { Users, Eye, Edit, Trash2, AlertCircle, CheckCircle, Search, CreditCard, Clock, Filter, DollarSign, Plus } from "lucide-react"

// Schema de validación para suscripciones
const subscriptionFormSchema = z.object({
  plan: z.string().min(1, "El plan es requerido"),
  status: z.enum(["active", "trialing", "past_due", "canceled", "paused", "incomplete", "unpaid"]),
  currency: z.string().min(1, "La moneda es requerida"),
  stripeCustomerId: z.string().min(1, "El ID del cliente es requerido"),
  stripeSubscriptionId: z.string().optional(),
})

type SubscriptionFormValues = z.infer<typeof subscriptionFormSchema>

interface SubscriptionFormProps {
  form: UseFormReturn<SubscriptionFormValues>
  operation: 'create' | 'edit' | 'view' | 'delete'
}

function SubscriptionForm({ form, operation }: SubscriptionFormProps) {
  const isView = operation === 'view'

  // Función para formatear fechas
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("es-MX", {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="grid gap-4 py-4">
      {/* Campo Plan */}
      <div className="grid gap-2">
        <Label htmlFor="plan">Plan *</Label>
        {isView ? (
          <div className="text-sm p-2 border rounded-md bg-muted/50">
            {(() => {
              const plan = form.watch("plan");
              switch (plan) {
                case "Basic": return "Basic - $29/mes";
                case "Premium": return "Premium - $59/mes";
                case "Enterprise": return "Enterprise - $99/mes";
                default: return "No seleccionado";
              }
            })()}
          </div>
        ) : (
          <Select
            value={form.watch("plan")}
            onValueChange={(value) => form.setValue("plan", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Basic">Basic - $29/mes</SelectItem>
              <SelectItem value="Premium">Premium - $59/mes</SelectItem>
              <SelectItem value="Enterprise">Enterprise - $99/mes</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Campo Estado */}
      <div className="grid gap-2">
        <Label htmlFor="status">Estado *</Label>
        {isView ? (
          <div className="text-sm p-2 border rounded-md bg-muted/50">
            {(() => {
              const status = form.watch("status");
              const statusMap = {
                active: "Activa",
                trialing: "En Prueba",
                past_due: "Vencida",
                canceled: "Cancelada",
                paused: "Pausada",
                incomplete: "Incompleta",
                unpaid: "Sin Pagar"
              };
              return statusMap[status] || "No seleccionado";
            })()}
          </div>
        ) : (
          <Select
            value={form.watch("status")}
            onValueChange={(value: "active" | "trialing" | "past_due" | "canceled" | "paused" | "incomplete" | "unpaid") =>
              form.setValue("status", value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona estatus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activa</SelectItem>
              <SelectItem value="trialing">En Prueba</SelectItem>
              <SelectItem value="past_due">Vencida</SelectItem>
              <SelectItem value="canceled">Cancelada</SelectItem>
              <SelectItem value="paused">Pausada</SelectItem>
              <SelectItem value="incomplete">Incompleta</SelectItem>
              <SelectItem value="unpaid">Sin Pagar</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Campo Moneda */}
      <div className="grid gap-2">
        <Label htmlFor="currency">Moneda *</Label>
        {isView ? (
          <div className="text-sm p-2 border rounded-md bg-muted/50">
            {(() => {
              const currency = form.watch("currency");
              switch (currency) {
                case "USD": return "USD - Dólar Estadounidense";
                case "MXN": return "MXN - Peso Mexicano";
                case "EUR": return "EUR - Euro";
                default: return "No seleccionado";
              }
            })()}
          </div>
        ) : (
          <Select
            value={form.watch("currency")}
            onValueChange={(value) => form.setValue("currency", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona moneda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD - Dólar Estadounidense</SelectItem>
              <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
              <SelectItem value="EUR">EUR - Euro</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Campos de texto */}
      <div className="grid gap-2">
        <Label htmlFor="stripeCustomerId">ID del Cliente Stripe *</Label>
        {isView ? (
          <div className="text-sm p-2 border rounded-md bg-muted/50">
            {form.watch("stripeCustomerId") || "No especificado"}
          </div>
        ) : (
          <Input
            id="stripeCustomerId"
            placeholder="cus_xxxxxxxxxx"
            {...form.register("stripeCustomerId")}
            required
          />
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="stripeSubscriptionId">ID de Suscripción Stripe</Label>
        {isView ? (
          <div className="text-sm p-2 border rounded-md bg-muted/50">
            {form.watch("stripeSubscriptionId") || "No especificado"}
          </div>
        ) : (
          <Input
            id="stripeSubscriptionId"
            placeholder="sub_xxxxxxxxxx"
            {...form.register("stripeSubscriptionId")}
          />
        )}
      </div>
    </div>
  );
}

const MOCK_SUBSCRIPTIONS = [
  {
    _id: "1",
    schoolId: "school1",
    userId: "user1",
    stripeCustomerId: "cus_123",
    stripeSubscriptionId: "sub_123",
    currency: "USD",
    plan: "Premium",
    status: "active",
    currentPeriodStart: Date.now() - 86400000 * 15,
    currentPeriodEnd: Date.now() + 86400000 * 15,
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now(),
  },
  {
    _id: "2",
    schoolId: "school1",
    userId: "user2",
    stripeCustomerId: "cus_456",
    stripeSubscriptionId: "sub_456",
    currency: "USD",
    plan: "Basic",
    status: "past_due",
    currentPeriodStart: Date.now() - 86400000 * 10,
    currentPeriodEnd: Date.now() + 86400000 * 20,
    createdAt: Date.now() - 86400000 * 60,
    updatedAt: Date.now(),
  },
  {
    _id: "3",
    schoolId: "school1",
    userId: "user3",
    stripeCustomerId: "cus_789",
    stripeSubscriptionId: "sub_789",
    currency: "USD",
    plan: "Enterprise",
    status: "trialing",
    currentPeriodStart: Date.now() - 86400000 * 5,
    currentPeriodEnd: Date.now() + 86400000 * 25,
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now(),
  },
  {
    _id: "4",
    schoolId: "school1",
    userId: "user4",
    stripeCustomerId: "cus_999",
    stripeSubscriptionId: "sub_999",
    currency: "USD",
    plan: "Basic",
    status: "canceled",
    currentPeriodStart: Date.now() - 86400000 * 20,
    currentPeriodEnd: Date.now() - 86400000 * 5,
    createdAt: Date.now() - 86400000 * 90,
    updatedAt: Date.now(),
  }
]

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return { className: "bg-green-600 text-white", label: "Activa" }
      case "trialing":
        return { className: "bg-blue-600 text-white", label: "En Prueba" }
      case "past_due":
        return { className: "bg-yellow-600 text-white", label: "Vencida" }
      case "canceled":
        return { className: "bg-red-600 text-white", label: "Cancelada" }
      case "paused":
        return { className: "bg-gray-600/70 text-white", label: "Pausada" }
      case "incomplete":
      case "incomplete_expired":
        return { className: "bg-orange-600 text-white", label: "Incompleta" }
      case "unpaid":
        return { className: "bg-red-600 text-white", label: "Sin Pagar" }
      default:
        return { className: "bg-gray-600/70 text-white", label: status }
    }
  }

  const config = getStatusConfig(status)
  return <Badge className={config.className}>{config.label}</Badge>
}

export default function SubscriptionsManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [planFilter, setPlanFilter] = useState("all")
  const [sortBy, setSortBy] = useState<"plan" | "status" | "createdAt" | "currentPeriodEnd">("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Usar el hook del CrudDialog
  const {
    isOpen,
    operation,
    data,
    openCreate,
    openEdit,
    openView,
    openDelete,
    close,
  } = useCrudDialog(subscriptionFormSchema)

  const subscriptions = MOCK_SUBSCRIPTIONS

  const filteredAndSortedSubscriptions = useMemo(() => {
    return subscriptions
      .filter((subscription) => {
        const matchesSearch =
          subscription.plan.toLowerCase().includes(searchTerm.toLowerCase()) ||
          subscription.stripeCustomerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          subscription.status.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === "all" || subscription.status === statusFilter
        const matchesPlan = planFilter === "all" || subscription.plan === planFilter

        return matchesSearch && matchesStatus && matchesPlan
      })
      .sort((a, b) => {
        let aValue: string | number = a[sortBy]
        let bValue: string | number = b[sortBy]

        if (sortBy === "createdAt" || sortBy === "currentPeriodEnd") {
          aValue = new Date(aValue).getTime()
          bValue = new Date(bValue).getTime()
        }

        if (typeof aValue === "string" && typeof bValue === "string") {
          if (sortOrder === "asc") {
            return aValue.localeCompare(bValue)
          } else {
            return bValue.localeCompare(aValue)
          }
        }

        if (sortOrder === "asc") {
          return aValue > bValue ? 1 : -1
        } else {
          return aValue < bValue ? 1 : -1
        }
      })
  }, [subscriptions, searchTerm, statusFilter, planFilter, sortBy, sortOrder])

  const stats = useMemo(() => {
    const total = subscriptions.length
    const active = subscriptions.filter((s) => s.status === "active").length
    const pastDue = subscriptions.filter((s) => s.status === "past_due").length
    const trialing = subscriptions.filter((s) => s.status === "trialing").length
    const totalRevenue = subscriptions
      .filter(s => s.status === "active")
      .reduce((sum, s) => {
        const planPrices = { "Basic": 29, "Premium": 59, "Enterprise": 99 }
        return sum + (planPrices[s.plan as keyof typeof planPrices] || 0)
      }, 0)

    return { total, active, pastDue, trialing, totalRevenue }
  }, [subscriptions])

  const getUniquePlans = () => {
    const plans = subscriptions.map((s) => s.plan)
    return [...new Set(plans)]
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("es-MX", {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const handleSort = (column: "plan" | "status" | "createdAt" | "currentPeriodEnd") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }

  const handleView = (subscription: any) => {
    openView(subscription)
  }

  const handleEdit = (subscription: any) => {
    openEdit(subscription)
  }

  const handleDelete = (subscription: any) => {
    openDelete(subscription)
  }

  // Función para manejar el submit del formulario
  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      if (operation === 'edit') {
        // Aquí iría la lógica para actualizar la suscripción
        console.log("Actualizar suscripción:", values)
        // await updateSubscription(data?._id, values)
      }
      close()
    } catch (error) {
      console.error("Error:", error)
    }
  }

  // Función para manejar la eliminación
  const handleDeleteSubmit = async (id: string) => {
    try {
      // Aquí iría la lógica para eliminar la suscripción
      console.log("Eliminar suscripción:", id)
      // await deleteSubscription(id)
      close()
    } catch (error) {
      console.error("Error:", error)
    }
  }

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
                  <CreditCard className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">Suscripciones</h1>
                  <p className="text-lg text-muted-foreground">
                    Administra las suscripciones y pagos de tu institución educativa
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Suscripciones
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Activas
            </CardTitle>
            <div className="p-2 bbg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <CheckCircle className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold text-primary">{stats.active}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vencidas
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <AlertCircle className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold text-primary">{stats.pastDue}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En Prueba
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Clock className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold text-primary">{stats.trialing}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos Mensuales
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">${stats.totalRevenue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Búsqueda */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros y Búsqueda
              </CardTitle>
              <CardDescription>
                Encuentra suscripciones por plan, cliente, estado o fechas
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
                  placeholder="Buscar por plan, cliente o estado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filtrar plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los planes</SelectItem>
                  {getUniquePlans().map((plan) => (
                    <SelectItem key={plan} value={plan}>
                      {plan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filtrar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activas</SelectItem>
                  <SelectItem value="past_due">Vencidas</SelectItem>
                  <SelectItem value="canceled">Canceladas</SelectItem>
                  <SelectItem value="trialing">En prueba</SelectItem>
                  <SelectItem value="paused">Pausadas</SelectItem>
                  <SelectItem value="incomplete">Incompletas</SelectItem>
                  <SelectItem value="unpaid">Sin pagar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Suscripciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Suscripciones</span>
            <Badge variant="outline">
              {filteredAndSortedSubscriptions.length} suscripciones
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAndSortedSubscriptions.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm || statusFilter !== "all" || planFilter !== "all"
                  ? "No se encontraron suscripciones"
                  : "No hay suscripciones registradas"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" || planFilter !== "all"
                  ? "Intenta ajustar los filtros de búsqueda."
                  : "no hay subcripcion."}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("plan")}>
                      Plan {sortBy === "plan" && (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("status")}>
                      Estado {sortBy === "status" && (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Moneda</TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("currentPeriodEnd")}>
                      Próximo Pago {sortBy === "currentPeriodEnd" && (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("createdAt")}>
                      Creado {sortBy === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedSubscriptions.map((subscription) => (
                    <TableRow key={subscription._id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          {subscription.plan}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={subscription.status} />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {subscription.stripeCustomerId}
                      </TableCell>
                      <TableCell>{subscription.currency}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {subscription.status === "active" || subscription.status === "trialing"
                          ? formatDate(subscription.currentPeriodEnd)
                          : "N/A"
                        }
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(subscription.createdAt)}
                      </TableCell>
                      <TableCell className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(subscription)}
                          className="hover:scale-105 transition-transform cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>                      
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CrudDialog para gestión de suscripciones */}
      <CrudDialog
        operation={operation}
        title={operation === 'create'
          ? 'Crear Nueva Suscripción'
          : operation === 'edit'
            ? 'Editar Suscripción'
            : operation === 'delete'
              ? 'Cancelar Suscripción'
              : 'Ver Suscripción'
        }
        description={operation === 'create'
          ? 'Ingresa los detalles para la nueva suscripción.'
          : operation === 'edit'
            ? 'Actualiza la información de la suscripción.'
            : operation === 'delete'
              ? '¿Estás seguro de que quieres cancelar esta suscripción?'
              : 'Información detallada de la suscripción.'
        }
        schema={subscriptionFormSchema}
        defaultValues={{
          plan: "Basic",
          status: "active",
          currency: "USD",
          stripeCustomerId: "",
          stripeSubscriptionId: "",
        }}
        data={data}
        isOpen={isOpen}
        onOpenChange={close}
        onSubmit={handleSubmit}
        onDelete={handleDeleteSubmit}
        deleteConfirmationTitle="¿Cancelar suscripción?"
        deleteConfirmationDescription="Esta acción cancelará la suscripción inmediatamente. El usuario perderá acceso a los servicios premium."
        deleteButtonText="Cancelar Suscripción"
      >
        {(form, operation) => (
          <SubscriptionForm
            form={form as unknown as UseFormReturn<SubscriptionFormValues>}
            operation={operation}
          />
        )}
      </CrudDialog>
    </div>
  )
}