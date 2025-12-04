"use client"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@repo/ui/components/shadcn/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/shadcn/table"
import { Copy, Wallet, BadgeCheck, CheckCircle2, Mail, Calendar, Receipt, Filter, AlertTriangle, CheckCircle, Clock, Search, History, TrendingUp, Loader2, Download, FileX, Eye, User, CreditCard, FileText, Building2 } from "lucide-react"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { Input } from "@repo/ui/components/shadcn/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@repo/ui/components/shadcn/select"
import { Button } from "@repo/ui/components/shadcn/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@repo/ui/components/shadcn/tooltip"
import { CrudDialog } from "@repo/ui/components/dialog/crud-dialog"
import { z } from "zod"
import { useQuery, useMutation, useAction } from "convex/react"
import { api } from "@repo/convex/convex/_generated/api"
import { Id } from "@repo/convex/convex/_generated/dataModel"
import { useUser } from "@clerk/nextjs"
import { useUserWithConvex } from "../../../../stores/userStore"
import { useCurrentSchool } from "../../../../stores/userSchoolsStore"
import { PAYMENT_TYPES } from "lib/billing/constants"
import { toast } from "@repo/ui/sonner";
import { Separator } from "@repo/ui/components/shadcn/separator"
import { PaymentHistoryItem } from "@/types/payment"


interface PaymentHistoryProps {
  selectedSchoolCycle: string
  setSelectedSchoolCycle: (cycle: string) => void
  canCreatePagos?: boolean
  canUpdatePagos?: boolean
  currentRole?: string | null
  currentUser?: { _id: Id<"user"> } | null
}

export default function PaymentHistoryComponent({ 
  selectedSchoolCycle, 
  setSelectedSchoolCycle,
  canCreatePagos = true,
  canUpdatePagos = true,
  currentRole,
  currentUser: currentUserProp
}: PaymentHistoryProps) {
  const [historySearchTerm, setHistorySearchTerm] = useState("")
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string | null>(null)
  const [historyStartDateFilter, setHistoryStartDateFilter] = useState<string>("")
  const [historyEndDateFilter, setHistoryEndDateFilter] = useState<string>("")
  const [downloadingInvoices, setDownloadingInvoices] = useState<Set<string>>(new Set())
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PaymentHistoryItem>()
  const [rfcCopied, setRfcCopied] = useState(false)

  const { user: clerkUser } = useUser()
  const { currentUser: currentUserFromHook } = useUserWithConvex(clerkUser?.id)
  const { currentSchool } = useCurrentSchool(currentUserFromHook?._id)
  
  // Usar el currentUser de props si está disponible, sino usar el del hook
  const currentUser = currentUserProp || currentUserFromHook

  const generateFacturapiInvoice = useAction(api.functions.actions.facturapi.generateFacturapiInvoice);
  const updatePaymentWithFacturapi = useMutation(api.functions.payments.updatePaymentWithFacturapi);
  const downloadFacturapiInvoice = useAction(api.functions.actions.facturapi.downloadFacturapiInvoice);

  const tutorFiscalData = useQuery(
    api.functions.fiscalData.getFiscalDataByUserId,
    selectedPayment?.tutorId ? { userId: selectedPayment.tutorId as Id<"user"> } : "skip"
  );

  const schoolCycles = useQuery(
    api.functions.schoolCycles.getAllSchoolCycles,
    currentSchool?.school._id ? { schoolId: currentSchool.school._id } : "skip"
  )

  const paymentHistory = useQuery(
    api.functions.payments.getPaymentHistory,
    currentSchool?.school._id && selectedSchoolCycle
      ? {
        schoolId: currentSchool.school._id,
        schoolCycleId: selectedSchoolCycle as Id<"schoolCycle">,
      }
      : "skip"
  )

  useEffect(() => {
    if (schoolCycles && schoolCycles.length > 0 && !selectedSchoolCycle) {
      const activeCycle = schoolCycles.find((cycle) => cycle.isActive)
      if (activeCycle) {
        setSelectedSchoolCycle(activeCycle.id)
      } else if (schoolCycles[0]) {
        setSelectedSchoolCycle(schoolCycles[0].id)
      }
    }
  }, [schoolCycles, selectedSchoolCycle, setSelectedSchoolCycle])

  // Obtener estudiantes del tutor si es tutor
  const tutorStudents = useQuery(
    api.functions.student.getStudentsByTutor,
    currentRole === "tutor" && currentUser?._id && currentSchool?.school._id
      ? {
          schoolId: currentSchool.school._id as Id<"school">,
          tutorId: currentUser._id as Id<"user">,
        }
      : "skip"
  );

  const filteredHistory = (paymentHistory || []).filter((payment) => {
    // Si es tutor, filtrar solo los pagos de sus hijos
    if (currentRole === "tutor" && tutorStudents) {
      const studentIds = tutorStudents.map(s => s._id);
      if (!studentIds.includes(payment.studentId as Id<"student">)) {
        return false;
      }
    }
    
    const matchesSearch =
      payment.studentName.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      payment.studentEnrollment.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      payment.paymentType.toLowerCase().includes(historySearchTerm.toLowerCase())
    const matchesStatus = !historyStatusFilter || payment.billingStatus === historyStatusFilter
    const paymentDate = new Date(payment.paidAt).toISOString().split('T')[0]
    const matchesStartDate = !historyStartDateFilter || (paymentDate && paymentDate >= historyStartDateFilter)
    const matchesEndDate = !historyEndDateFilter || (paymentDate && paymentDate <= historyEndDateFilter)

    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate
  })

  const paymentStats = useQuery(
    api.functions.payments.getPaymentStats,
    currentSchool?.school._id && selectedSchoolCycle
      ? {
        schoolId: currentSchool.school._id,
        schoolCycleId: selectedSchoolCycle as Id<"schoolCycle">,
      }
      : "skip"
  )

  // Calcular estadísticas basadas en el historial filtrado si es tutor, sino usar paymentStats
  const stats = useMemo(() => {
    if (currentRole === "tutor" && filteredHistory) {
      const total = filteredHistory.length
      const paid = filteredHistory.filter(p => p.billingStatus === "Pago cumplido").length
      const pending = filteredHistory.filter(p => 
        p.billingStatus === "Pago pendiente" || 
        p.billingStatus === "Pago parcial" || 
        p.billingStatus === "Pago vencido" || 
        p.billingStatus === "Pago retrasado"
      ).length
      const totalAmount = filteredHistory.reduce((sum, p) => sum + p.amount, 0)
      
      return {
        totalPayments: total,
        paidPayments: paid,
        pendingPayments: pending,
        totalAmountCollected: totalAmount
      }
    } else {
      return {
        totalPayments: paymentStats?.totalPayments || 0,
        paidPayments: paymentStats?.paidPayments || 0,
        pendingPayments: (paymentStats?.pendingPayments || 0) + (paymentStats?.overduePayments || 0),
        totalAmountCollected: paymentStats?.totalAmountCollected || 0
      }
    }
  }, [currentRole, filteredHistory, paymentStats])

  const totalPayments = stats.totalPayments
  const paidPayments = stats.paidPayments
  const pendingPayments = stats.pendingPayments
  const totalAmountCollected = stats.totalAmountCollected

  const handleGenerateInvoice = async (paymentId: string, tutor: string, paymentType: string, createdPayment: number, tutorId: string) => {
    if (!currentUser?._id) return;

    try {
      const result = await generateFacturapiInvoice({
        paymentId: paymentId as Id<"payments">,
        tutorId: tutorId as Id<"user">,
      });

      if (result.success === true && result.facturapiInvoiceId) {
        await updatePaymentWithFacturapi({
          paymentId: paymentId as Id<"payments">,
          facturapiInvoiceId: result.facturapiInvoiceId,
          facturapiInvoiceNumber: String(result.facturapiInvoiceNumber),
          facturapiInvoiceStatus: result.facturapiInvoiceStatus,
        });

        toast.success("Factura generada exitosamente");
        handleDownloadFacturapiInvoice(result.facturapiInvoiceId, tutor, paymentType, createdPayment)
      } else if (result.success === false) {
        toast.error(result.message);
      } else {
        toast.error("Error al generar la factura");
      }
    } catch (error) {
      console.error("Error generando factura:", error);
      toast.error("Error al generar la factura: " + (error instanceof Error ? error.message : "Error desconocido"));
    }
  };

  const handleDownloadFacturapiInvoice = async (facturapiInvoiceId: string, tutor: string, paymentType: string, createdPayment: number) => {
    setDownloadingInvoices(prev => new Set(prev).add(facturapiInvoiceId));

    try {
      const result = await downloadFacturapiInvoice({ facturapiInvoiceId, tutor, paymentType: PAYMENT_TYPES[paymentType as keyof typeof PAYMENT_TYPES], createdPayment });

      if (result.success) {
        const binaryString = atob(result.pdfData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = result.filename || `Factura_${tutor.replace(/\s/g, '_')}.pdf`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

      } else {
        console.error('Error descargando factura:', result);
        toast.error('Error al descargar la factura');
      }
    } catch (error) {
      console.error('Error descargando factura de Facturapi:', error);
      toast.error('Error al descargar la factura: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setDownloadingInvoices(prev => {
        const newSet = new Set(prev);
        newSet.delete(facturapiInvoiceId);
        return newSet;
      });
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "Pago cumplido":
        return (
          <Badge className="bg-transparent text-green-800">
            <CheckCircle className="w-4 h-4 mr-1 text-green-800" />
            Pago cumplido
          </Badge>
        )
      case "Pago parcial":
        return (
          <Badge className="bg-transparent text-blue-800">
            <Clock className="w-4 h-4 mr-1 text-blue-800" />
            Pago parcial
          </Badge>
        )
      case "Pago pendiente":
        return (
          <Badge className="bg-transparent text-yellow-800">
            <Clock className="w-4 h-4 mr-1 text-yellow-800" />
            Pago pendiente
          </Badge>
        )
      case "Pago vencido":
        return (
          <Badge className="bg-transparent text-red-500">
            <AlertTriangle className="w-4 h-4 mr-1 text-red-500" />
            Pago vencido
          </Badge>
        )
      case "Pago retrasado":
        return (
          <Badge className="bg-transparent text-orange-600">
            <AlertTriangle className="w-4 h-4 mr-1 text-orange-600" />
            Pago retrasado
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 lg:pb-3">
            <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">Total de Pagos</CardTitle>
            <div className="p-1.5 lg:p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <History className="h-3 w-3 lg:h-4 lg:w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 lg:space-y-2">
            <div className="text-xl lg:text-3xl font-bold">{totalPayments}</div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 lg:pb-3">
            <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">Pagos Completados</CardTitle>
            <div className="p-1.5 lg:p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <CheckCircle className="h-3 w-3 lg:h-4 lg:w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 lg:space-y-2">
            <div className="text-xl lg:text-3xl font-bold">{paidPayments}</div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 lg:pb-3">
            <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">Pagos Pendientes</CardTitle>
            <div className="p-1.5 lg:p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Clock className="h-3 w-3 lg:h-4 lg:w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 lg:space-y-2">
            <div className="text-xl lg:text-3xl font-bold">{pendingPayments}</div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 lg:pb-3">
            <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">
              {currentRole === "tutor" ? "Total de mis pagos" : "Total Recaudado"}
            </CardTitle>
            <div className="p-1.5 lg:p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 lg:space-y-2">
            <div className="text-lg lg:text-3xl font-bold">${totalAmountCollected.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros y Búsqueda
              </CardTitle>
              <CardDescription>Encuentra pagos por estudiante, factura, estado o rango de fechas.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por estudiante o factura..."
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2 max-md:flex-col">
                <Select value={selectedSchoolCycle} onValueChange={setSelectedSchoolCycle}>
                  <SelectTrigger className="w-[200px] max-md:w-full">
                    <SelectValue placeholder="Ciclo escolar" />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolCycles?.map((cycle) => (
                      <SelectItem key={cycle.id} value={cycle.id}>
                        {cycle.name} {cycle.isActive && "(Activo)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  onValueChange={(v) => setHistoryStatusFilter(v === "all" ? null : v)}
                  value={historyStatusFilter || ""}
                >
                  <SelectTrigger className="w-[160px] max-md:w-full">
                    <SelectValue placeholder="Filtrar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Pago cumplido">Pagos cumplidos</SelectItem>
                    <SelectItem value="Pago parcial">Pagos parciales</SelectItem>
                    <SelectItem value="Pago pendiente">Pagos pendientes</SelectItem>
                    <SelectItem value="Pago vencido">Pagos vencidos</SelectItem>
                    <SelectItem value="Pago retrasado">Pagos retrasados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Fecha de inicio (desde):</label>
                <Input
                  type="date"
                  value={historyStartDateFilter}
                  onChange={(e) => setHistoryStartDateFilter(e.target.value)}
                  placeholder="Fecha de inicio"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Fecha de fin (hasta):</label>
                <Input
                  type="date"
                  value={historyEndDateFilter}
                  onChange={(e) => setHistoryEndDateFilter(e.target.value)}
                  placeholder="Fecha de fin"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Pagos
          </CardTitle>
          <CardDescription>Consulta el historial completo de pagos realizados por los estudiantes.</CardDescription>
        </CardHeader>
        <CardContent>
          {paymentHistory === undefined ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Cargando historial de pagos...</span>
              </div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-sm text-muted-foreground">
                No hay pagos registrados en este ciclo escolar
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    {currentRole !== "tutor" && <TableHead>Matrícula</TableHead>}
                    {currentRole !== "tutor" && <TableHead>Grado/Grupo</TableHead>}
                    <TableHead>Tipo de Cobro</TableHead>
                    {currentRole !== "tutor" && <TableHead>Estado del Cobro</TableHead>}
                    <TableHead>Monto Pagado</TableHead>
                    <TableHead>Monto Total</TableHead>
                    <TableHead>Restante</TableHead>
                    <TableHead>Fecha de Pago</TableHead>
                    <TableHead>Método de Pago</TableHead>
                    {currentRole !== "tutor" && <TableHead>Pagado por</TableHead>}
                    {currentRole !== "auditor" && <TableHead>Factura</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.studentName}</TableCell>
                      {currentRole !== "tutor" && <TableCell>{payment.studentEnrollment}</TableCell>}
                      {currentRole !== "tutor" && (
                        <TableCell>
                          {payment.studentGrade} {payment.studentGroup}
                        </TableCell>
                      )}
                      <TableCell>{PAYMENT_TYPES[payment.paymentType as keyof typeof PAYMENT_TYPES]}</TableCell>
                      {currentRole !== "tutor" && <TableCell>{getPaymentStatusBadge(payment.billingStatus)}</TableCell>}
                      <TableCell className="font-semibold">${payment.amount.toLocaleString()}</TableCell>
                      <TableCell>${payment.billingAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        {(() => {
                          // Calcular el remanente correctamente: Total - Pagado
                          const remaining = payment.billingAmount - payment.amount;

                          if (remaining > 0) {
                            // Hay deuda pendiente
                            return (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-orange-600 font-medium cursor-help">
                                      ${remaining.toLocaleString()}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Adeudo pendiente</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          } else if (remaining < 0) {
                            // Hay sobrepago
                            const overpayment = Math.abs(remaining);
                            return (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-blue-600 font-medium cursor-help">
                                      ${overpayment.toLocaleString()} (Sobrepago)
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Se pagó de más</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          } else {
                            // Pago exacto
                            return (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-green-600 font-medium cursor-help">
                                      $0
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Pago completo</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          }
                        })()}
                      </TableCell>
                      <TableCell>{new Date(payment.paidAt).toLocaleDateString('es-MX')}</TableCell>
                      <TableCell>{payment.methodLabel}</TableCell>
                      {currentRole !== "tutor" && <TableCell>{payment.createdBy}</TableCell>}
                      {currentRole !== "auditor" && (
                        <TableCell className="text-center">
                        {payment.facturapiInvoiceId && payment.facturapiInvoiceStatus === 'valid' ? (
                          <>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setSelectedPayment(payment); setIsInvoiceModalOpen(true); }}
                                    disabled={downloadingInvoices.has(payment.facturapiInvoiceId!)}
                                    className="h-8 w-8 p-0 hover:bg-green-100 cursor-pointer"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    Ver datos de la factura...
                                  </p>
                                  {payment.facturapiInvoiceNumber && <p>Folio: {payment.facturapiInvoiceNumber}</p>}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownloadFacturapiInvoice(payment.facturapiInvoiceId!, payment.createdBy, payment.paymentType, payment.createdAt)}
                                    disabled={downloadingInvoices.has(payment.facturapiInvoiceId!)}
                                    className="h-8 w-8 p-0 hover:bg-green-100 cursor-pointer"
                                  >
                                    {downloadingInvoices.has(payment.facturapiInvoiceId!) ? (
                                      <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                                    ) : (
                                      <Download className="h-4 w-4 text-green-600" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {downloadingInvoices.has(payment.facturapiInvoiceId!)
                                      ? "Descargando factura..."
                                      : "Descargar factura PDF"
                                    }
                                  </p>
                                  {payment.facturapiInvoiceNumber && <p>Folio: {payment.facturapiInvoiceNumber}</p>}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </>
                        ) : (
                          (canCreatePagos && canUpdatePagos) || currentRole === "tutor" ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleGenerateInvoice(payment.id, payment.createdBy, payment.paymentType, payment.createdAt, payment.tutorId as Id<"user">)}
                                    className="h-8 w-8 p-0 hover:bg-blue-100 cursor-pointer"
                                  >
                                    <FileX className="h-4 w-4 text-primary" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Generar factura
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : null
                        )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CrudDialog
        operation="view"
        title="Detalles de la Factura"
        description="Revisa toda la información del pago realizado y la factura generada para este proceso."
        schema={z.object({})}
        data={selectedPayment as (Record<string, unknown> & { _id?: string }) | undefined}
        isOpen={isInvoiceModalOpen}
        onOpenChange={setIsInvoiceModalOpen}
        onSubmit={async () => { }}
        cancelButtonText="Cerrar"
      >
        {() => selectedPayment && (
          <div className="flex flex-col mt-2">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10" />
              <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-white/5" />

              <div className="relative">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-emerald-100">Monto Pagado</p>
                      <p className="text-2xl md:text-3xl font-bold tracking-tight">
                        ${selectedPayment?.amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center justify-end md:justify-end">
                    <div className="bg-white/90 rounded-md px-2 py-1">
                      {selectedPayment?.billingStatus ? getPaymentStatusBadge(selectedPayment.billingStatus) : null}
                    </div>
                  </div>
                </div>

                <Separator className="mt-6 mb-2 bg-white/20" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-emerald-200">Concepto</p>
                    <p className="font-semibold">{PAYMENT_TYPES[selectedPayment?.paymentType as keyof typeof PAYMENT_TYPES]}</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-emerald-200">Monto Total del Cobro</p>
                    <p className="font-semibold">
                      ${selectedPayment?.billingAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <section className="my-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Detalles del Pago</h3>
              <div className="rounded-lg border bg-card">
                <div className="grid divide-y">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Fecha</span>
                    </div>
                    <span className="text-sm font-medium mt-1 sm:mt-0">
                      {new Date(selectedPayment?.paidAt ?? selectedPayment?.createdAt ?? Date.now()).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Hora</span>
                    </div>
                    <span className="text-sm font-medium">
                      {new Date(selectedPayment?.paidAt ?? selectedPayment?.createdAt ?? Date.now()).toLocaleTimeString("es-MX", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Método de pago</span>
                    </div>
                    <span className="text-sm font-medium mt-1 sm:mt-0">{selectedPayment.methodLabel}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Registrado por</span>
                    </div>
                    <span className="text-sm font-medium mt-1 sm:mt-0">{selectedPayment.createdBy}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Monto del cobro</span>
                    </div>
                    <span className="text-sm font-medium mt-1 sm:mt-0">
                      ${selectedPayment.billingAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="my-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                Datos Fiscales del Emisor
              </h3>
              {tutorFiscalData ? (
                <div className="rounded-lg border bg-card">
                  <div className="px-4 py-4 border-b bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">RFC</p>
                        <p className="font-mono text-lg font-semibold tracking-wider">
                          {tutorFiscalData.taxId || "No registrado"}
                        </p>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (tutorFiscalData?.taxId) {
                                  navigator.clipboard.writeText(tutorFiscalData.taxId);
                                  setRfcCopied(true);
                                  setTimeout(() => setRfcCopied(false), 2000);
                                }
                              }}
                            >
                              {rfcCopied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Copiar RFC</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  <div className="grid divide-y">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Razón Social</span>
                      </div>
                      <span className="text-sm font-medium text-left md:text-right max-w-full md:max-w-[200px] truncate mt-1 sm:mt-0">
                        {tutorFiscalData.legalName || "No registrado"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Régimen Fiscal</span>
                      </div>
                      <span className="text-sm font-medium text-left md:text-right max-w-full md:max-w-[200px]">
                        {tutorFiscalData.taxSystem || "No especificado"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Uso de CFDI</span>
                      </div>
                      <span className="text-sm font-medium text-left md:text-right">{tutorFiscalData.cfdiUse || "No especificado"}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Correo Fiscal</span>
                      </div>
                      <span className="text-sm font-medium text-left md:text-right mt-1 sm:mt-0">{tutorFiscalData.email || "No registrado"}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-muted-foreground rounded-lg border">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="text-sm">Cargando información fiscal...</span>
                </div>
              )}
            </section>

            <section className="my-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Factura Electrónica</h3>
              <div className={`rounded-lg border bg-card overflow-hidden ${selectedPayment ? "border-emerald-200" : ""}`}>
                <div className="px-4 py-5">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${selectedPayment ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground"
                        }`}
                    >
                      {selectedPayment ? <BadgeCheck className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between min-w-0 w-full gap-2">
                      <div className="flex flex-row items-center gap-2">
                        <p className="text-md text-muted-foreground">Folio Fiscal: </p>
                        <p className="font-mono text-lg md:text-xl font-semibold tracking-wide break-all">
                          {selectedPayment.facturapiInvoiceNumber || "Pendiente de generación"}
                        </p>
                      </div>
                      <div className="flex items-center justify-start md:justify-end">
                        <Badge
                          variant={selectedPayment.facturapiInvoiceStatus === 'valid' ? "default" : "secondary"}
                          className={selectedPayment.facturapiInvoiceStatus === 'valid' ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                        >
                          {selectedPayment.facturapiInvoiceStatus === 'valid' ? "Valido" : selectedPayment.facturapiInvoiceStatus || "Pendiente"}
                        </Badge>
                      </div>

                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 border-t bg-muted/30">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Fecha de emisión</span>
                    <span className="font-medium">
                      {new Date(selectedPayment.createdAt).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {selectedPayment && (
                  <div className="px-4 py-3 border-t bg-emerald-50 flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Validada ante el SAT</span>
                  </div>
                )}
              </div>
            </section>
          </div>

        )}
      </CrudDialog>
    </div>
  )
}