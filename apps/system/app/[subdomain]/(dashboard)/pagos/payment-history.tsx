"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@repo/ui/components/shadcn/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/shadcn/table"
import { Filter, AlertTriangle, CheckCircle, Clock, Search, History, TrendingUp, Loader2, Eye, Download, FileX } from "lucide-react"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { Input } from "@repo/ui/components/shadcn/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@repo/ui/components/shadcn/select"
import { Button } from "@repo/ui/components/shadcn/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@repo/ui/components/shadcn/tooltip"
import { useQuery, useMutation, useAction } from "convex/react"
import { api } from "@repo/convex/convex/_generated/api"
import { Id } from "@repo/convex/convex/_generated/dataModel"
import { useUser } from "@clerk/nextjs"
import { useUserWithConvex } from "../../../../stores/userStore"
import { useCurrentSchool } from "../../../../stores/userSchoolsStore"
import { PAYMENT_TYPES } from "lib/billing/constants"

interface PaymentHistoryProps {
  selectedSchoolCycle: string
  setSelectedSchoolCycle: (cycle: string) => void
}

export default function PaymentHistoryComponent({ selectedSchoolCycle, setSelectedSchoolCycle }: PaymentHistoryProps) {
  const [historySearchTerm, setHistorySearchTerm] = useState("")
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string | null>(null)
  const [historyStartDateFilter, setHistoryStartDateFilter] = useState<string>("")
  const [historyEndDateFilter, setHistoryEndDateFilter] = useState<string>("")

  // Hooks para obtener datos del usuario y escuela
  const { user: clerkUser } = useUser()
  const { currentUser } = useUserWithConvex(clerkUser?.id)
  const { currentSchool } = useCurrentSchool(currentUser?._id)

  // Verificar si el tutor tiene información fiscal completa
  const tutorFiscalData = useQuery(
    api.functions.fiscalData.getFiscalDataByUserId,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );
  const hasCompleteFiscalInfo = !!tutorFiscalData;

  // Action para generar facturas
  const generateInvoice = useAction(api.functions.actions.facturapi.generateFacturapiInvoice);

  // Mutation para actualizar el pago con información de Facturapi
  const updatePaymentWithFacturapi = useMutation(api.functions.payments.updatePaymentWithFacturapi);

  // Action para descargar facturas de Facturapi
  const downloadFacturapiInvoice = useAction(api.functions.actions.facturapi.downloadFacturapiInvoice);

  // Función para generar facturas automáticamente para pagos pendientes
  const generatePendingInvoices = async () => {
    if (!hasCompleteFiscalInfo || !currentUser?._id) return;

    // Filtrar pagos que están pendientes y no tienen factura generada
    const pendingPayments = (paymentHistory || []).filter(
      payment =>
        payment.facturapiInvoiceStatus === "pending" &&
        !payment.facturapiInvoiceId
    );

    for (const payment of pendingPayments) {
      try {
        console.log(`Generando factura automática para pago: ${payment.id}`);

        // Generar la factura
        const result = await generateInvoice({
          paymentId: payment.id as Id<"payments">,
          tutorId: currentUser._id as Id<"user">,
        });

        if (result.success) {
          // Actualizar el pago con la información de Facturapi
          await updatePaymentWithFacturapi({
            paymentId: payment.id as Id<"payments">,
            facturapiInvoiceId: result.facturapiInvoiceId,
            facturapiInvoiceNumber: String(result.invoiceNumber),
            facturapiInvoiceStatus: result.status,
          });

          console.log(`Factura generada automáticamente: ${result.facturapiInvoiceId}`);
        }
      } catch (error) {
        console.error(`Error generando factura para pago ${payment.id}:`, error);
        // No mostrar error al usuario, solo continuar con otros pagos
      }
    }
  };

  // Obtener ciclos escolares
  const schoolCycles = useQuery(
    api.functions.schoolCycles.getAllSchoolCycles,
    currentSchool?.school._id ? { schoolId: currentSchool.school._id } : "skip"
  )

  // Obtener historial de pagos
  const paymentHistory = useQuery(
    api.functions.payments.getPaymentHistory,
    currentSchool?.school._id && selectedSchoolCycle
      ? {
          schoolId: currentSchool.school._id,
          schoolCycleId: selectedSchoolCycle as Id<"schoolCycle">,
        }
      : "skip"
  )

  // Obtener estadísticas
  const paymentStats = useQuery(
    api.functions.payments.getPaymentStats,
    currentSchool?.school._id && selectedSchoolCycle
      ? {
          schoolId: currentSchool.school._id,
          schoolCycleId: selectedSchoolCycle as Id<"schoolCycle">,
        }
      : "skip"
  )

  // Establecer el ciclo activo por defecto
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

  // Generar facturas automáticamente cuando se carga el historial de pagos
  useEffect(() => {
    if (paymentHistory && hasCompleteFiscalInfo && currentUser?._id) {
      generatePendingInvoices();
    }
  }, [paymentHistory, hasCompleteFiscalInfo, currentUser?._id])

  const totalPayments = paymentStats?.totalPayments || 0
  const paidPayments = paymentStats?.paidPayments || 0
  const pendingPayments = (paymentStats?.pendingPayments || 0) + (paymentStats?.overduePayments || 0)
  const totalAmountCollected = paymentStats?.totalAmountCollected || 0

  const filteredHistory = (paymentHistory || []).filter((payment) => {
    const matchesSearch =
      payment.studentName.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      payment.studentEnrollment.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      payment.paymentType.toLowerCase().includes(historySearchTerm.toLowerCase())
    
    const matchesStatus = !historyStatusFilter || payment.billingStatus === historyStatusFilter

    // Filtrar por fecha de pago
    const paymentDate = new Date(payment.paidAt).toISOString().split('T')[0]
    const matchesStartDate = !historyStartDateFilter || (paymentDate && paymentDate >= historyStartDateFilter)
    const matchesEndDate = !historyEndDateFilter || (paymentDate && paymentDate <= historyEndDateFilter)

    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate
  })

  const handleViewInvoice = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleGenerateInvoice = async (paymentId: string) => {
    if (!hasCompleteFiscalInfo) {
      alert("Debes completar tu información fiscal antes de generar facturas");
      return;
    }

    if (!currentUser?._id) return;

    try {
      // Llamar a la función de generación de facturas
      const result = await generateInvoice({
        paymentId: paymentId as Id<"payments">,
        tutorId: currentUser._id as Id<"user">,
      });

      if (result.success) {
        // Actualizar el pago con la información de Facturapi usando una mutation
        await updatePaymentWithFacturapi({
          paymentId: paymentId as Id<"payments">,
          facturapiInvoiceId: result.facturapiInvoiceId,
          facturapiInvoiceNumber: String(result.invoiceNumber),
          facturapiInvoiceStatus: result.status,
        });

        alert("Factura generada exitosamente");
        // Refrescar la página para mostrar los cambios
        window.location.reload();
      } else {
        alert("Error al generar la factura");
      }
    } catch (error) {
      console.error("Error generando factura:", error);
      alert("Error al generar la factura: " + (error instanceof Error ? error.message : "Error desconocido"));
    }
  };

  const handleDownloadInvoice = async (url: string, studentName: string, filename?: string | null, mimeType?: string | null) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()

      // Detectar la extensión desde múltiples fuentes
      let extension = 'pdf' // Por defecto
      let finalFilename = `Factura_${studentName.replace(/\s/g, '_')}`

      // 1. Si tenemos el nombre del archivo guardado, usar su extensión
      if (filename) {
        const fileExtension = filename.split('.').pop()
        if (fileExtension && fileExtension.length <= 5) { // Validar que sea una extensión válida
          extension = fileExtension
          // Usar el nombre original si está disponible
          finalFilename = filename
        }
      }
      // 2. Si tenemos el mimeType guardado, usarlo
      else if (mimeType) {
        const mimeToExtension: Record<string, string> = {
          'application/pdf': 'pdf',
          'image/jpeg': 'jpg',
          'image/jpg': 'jpg',
          'image/png': 'png',
          'image/gif': 'gif',
          'image/webp': 'webp',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
          'application/msword': 'doc',
          'application/vnd.ms-excel': 'xls',
          'text/plain': 'txt',
        }
        extension = mimeToExtension[mimeType] || extension
        finalFilename = `${finalFilename}.${extension}`
      }
      // 3. Intentar desde Content-Disposition del response
      else {
        const contentDisposition = response.headers.get('content-disposition')
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
          if (filenameMatch && filenameMatch[1]) {
            const headerFilename = filenameMatch[1].replace(/['"]/g, '')
            const fileExtension = headerFilename.split('.').pop()
            if (fileExtension) {
              extension = fileExtension
            }
          }
        }

        // 4. Usar Content-Type como último recurso
        const contentType = response.headers.get('content-type')
        if (contentType) {
          const mimeToExtension: Record<string, string> = {
            'application/pdf': 'pdf',
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
            'application/msword': 'doc',
            'application/vnd.ms-excel': 'xls',
            'text/plain': 'txt',
          }
          extension = mimeToExtension[contentType] || extension
        }

        finalFilename = `${finalFilename}.${extension}`
      }

      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = finalFilename

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Error descargando la factura:', error)
    }
  }

  const handleDownloadFacturapiInvoice = async (facturapiInvoiceId: string, student: string, paymentType: string) => {
    try {
      console.log('Descargando factura de Facturapi:', facturapiInvoiceId);

      const result = await downloadFacturapiInvoice({ facturapiInvoiceId, student, paymentType});

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
        link.download = result.filename || `Factura_${student.replace(/\s/g, '_')}.pdf`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        console.log('Factura descargada exitosamente');
      } else {
        console.error('Error descargando factura:', result);
        alert('Error al descargar la factura');
      }
    } catch (error) {
      console.error('Error descargando factura de Facturapi:', error);
      alert('Error al descargar la factura: ' + (error instanceof Error ? error.message : 'Error desconocido'));
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
            <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">Total Recaudado</CardTitle>
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
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Grado/Grupo</TableHead>
                    <TableHead>Tipo de Cobro</TableHead>
                    <TableHead>Estado del Cobro</TableHead>
                    <TableHead>Monto Pagado</TableHead>
                    <TableHead>Monto Total</TableHead>
                    <TableHead>Restante</TableHead>
                    <TableHead>Fecha de Pago</TableHead>
                    <TableHead>Método de Pago</TableHead>
                    <TableHead>Pagado por</TableHead>
                    <TableHead>Factura</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.studentName}</TableCell>
                      <TableCell>{payment.studentEnrollment}</TableCell>
                      <TableCell>
                        {payment.studentGrade} {payment.studentGroup}
                      </TableCell>
                      <TableCell>{payment.paymentType}</TableCell>
                      <TableCell>{getPaymentStatusBadge(payment.billingStatus)}</TableCell>
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
                      <TableCell>{payment.createdBy}</TableCell>
                      <TableCell>
                        {payment.invoiceUrl || payment.facturapiInvoiceId ? (
                          <TooltipProvider>
                            <div className="flex items-center gap-2">
                              {payment.invoiceUrl && (
                                <>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewInvoice(payment.invoiceUrl!)}
                                        className="h-8 w-8 p-0 hover:bg-blue-100 cursor-pointer"
                                      >
                                        <Eye className="h-4 w-4 text-primary" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Ver factura</p>
                                    </TooltipContent>
                                  </Tooltip>

                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDownloadInvoice(
                                          payment.invoiceUrl!,
                                          payment.studentName,
                                          payment.facturapiInvoiceId,
                                        )}
                                        className="h-8 w-8 p-0 hover:bg-green-100 cursor-pointer"
                                      >
                                        <Download className="h-4 w-4 text-primary" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Descargar factura</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </>
                              )}

                              {payment.facturapiInvoiceId && !payment.invoiceUrl && (
                                <div className="flex items-center gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-1 text-orange-600">
                                        <FileX className="h-4 w-4" />
                                        <span className="text-xs">
                                          {payment.facturapiInvoiceStatus === 'pending' ? 'Factura pendiente' :
                                           payment.facturapiInvoiceStatus === 'valid' ? 'Factura generada' :
                                           `Factura: ${payment.facturapiInvoiceStatus}`}
                                        </span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>ID Facturapi: {payment.facturapiInvoiceId}</p>
                                      {payment.facturapiInvoiceNumber && <p>Número: {payment.facturapiInvoiceNumber}</p>}
                                    </TooltipContent>
                                  </Tooltip>

                                  {payment.facturapiInvoiceStatus === 'valid' && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDownloadFacturapiInvoice(payment.facturapiInvoiceId!, payment.studentName, payment.paymentType)}
                                          className="h-6 w-6 p-0 hover:bg-green-100 ml-1"
                                        >
                                          <Download className="h-3 w-3 text-green-600" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Descargar factura PDF</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              )}
                            </div>
                          </TooltipProvider>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleGenerateInvoice(payment.id)}
                                  className="h-8 w-8 p-0 hover:bg-blue-100 cursor-pointer"
                                  disabled={!hasCompleteFiscalInfo}
                                >
                                  <FileX className="h-4 w-4 text-primary" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {hasCompleteFiscalInfo
                                    ? "Generar factura"
                                    : "Completa tu información fiscal para generar facturas"
                                  }
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
