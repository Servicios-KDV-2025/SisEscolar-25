"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@repo/convex/convex/_generated/api"
import { Id } from "@repo/convex/convex/_generated/dataModel"
import { CheckCircle2, Download, ArrowLeft, AlertCircle, CreditCard, Calendar, Hash, FileText } from "lucide-react"
import { Button } from "@repo/ui/components/shadcn/button"
import { Card, CardContent, CardDescription, CardHeader } from "@repo/ui/components/shadcn/card"
import { Alert, AlertDescription } from "@repo/ui/components/shadcn/alert"
import { Separator } from "@repo/ui/components/shadcn/separator"
import { Badge } from "@repo/ui/components/shadcn/badge"

interface PaymentData {
  amount: string
  concept: string
  date: string
  time: string
  paymentMethod: string
  transactionId: string
  status: "success" | "pending" | "failed"
  receiptUrl?: string
}

export function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const billingId = searchParams.get("billingId") as Id<"billing"> | null

  
  const paymentDetails = useQuery(
    api.functions.payments.getLatestPaymentDetailsByBilling,
    billingId ? { billingId } : "skip"
  )

  const loading = paymentDetails === undefined && billingId !== null
  const error = billingId === null
    ? "No se proporcionó un ID de pago válido"
    : paymentDetails === null && !loading
      ? "No se encontró información del pago. El pago puede estar aún procesándose."
      : null

  const paymentData: PaymentData | null = paymentDetails
    ? {
        amount: `$${paymentDetails.payment.amount.toLocaleString("es-MX", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        concept: `${paymentDetails.billing.type} - ${paymentDetails.student.name} ${paymentDetails.student.lastName || ""}`,
        date: new Date(paymentDetails.payment.createdAt).toLocaleDateString("es-MX", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        time: new Date(paymentDetails.payment.createdAt).toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        paymentMethod:
          paymentDetails.payment.method === "card"
            ? "Tarjeta de crédito/débito"
            : paymentDetails.payment.method === "cash"
              ? "Efectivo (OXXO)"
              : paymentDetails.payment.method === "bank_transfer"
                ? "Transferencia bancaria (SPEI)"
                : "Otro",
        transactionId: paymentDetails.payment.stripePaymentIntentId || paymentDetails.payment._id,
        status: "success",
        receiptUrl: paymentDetails.payment.facturapiInvoiceId
          ? `https://api.facturapi.io/v1/invoices/${paymentDetails.payment.facturapiInvoiceId}/pdf`
          : undefined,
      }
    : null

  const handleDownloadReceipt = () => {
    if (paymentData?.receiptUrl) {
      window.open(paymentData.receiptUrl, "_blank")
    } else if (paymentDetails?.payment.facturapiInvoiceNumber) {
      // Si no hay URL directa, al menos mostrar el número de factura
      alert(`Número de factura: ${paymentDetails.payment.facturapiInvoiceNumber}`)
    }
  }

  const handleBackToDashboard = () => {
    router.push("/pagos")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Cargando información del pago...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !paymentData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || "No se encontró información del pago"}</AlertDescription>
            </Alert>
            <Button onClick={handleBackToDashboard} variant="outline" className="w-full bg-transparent">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-border shadow-lg">
        {/* Header con icono de éxito */}
        <CardHeader className="text-center pb-4 space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-success text-green-500" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">¡Pago procesado exitosamente!</h1>
            <CardDescription className="text-base text-pretty">
              Tu pago ha sido confirmado y procesado correctamente
            </CardDescription>
          </div>

          <div className="pt-2">
            <Badge variant="secondary" className="bg-success/10 text-success hover:bg-success/20 border-success/20">
              Confirmado
            </Badge>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6 space-y-6">
          {/* Monto principal */}
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-1">Monto pagado</p>
            <p className="text-4xl font-semibold tracking-tight">{paymentData.amount}</p>
          </div>

          <Separator />

          {/* Detalles del pago */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Concepto</p>
                <p className="text-sm text-muted-foreground text-pretty">{paymentData.concept}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Fecha y hora</p>
                <p className="text-sm text-muted-foreground">
                  {paymentData.date} • {paymentData.time}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Método de pago</p>
                <p className="text-sm text-muted-foreground">{paymentData.paymentMethod}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Hash className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">ID de transacción</p>
                <p className="text-sm text-muted-foreground font-mono">{paymentData.transactionId}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Acciones */}
          <div className="space-y-3 pt-2">
            <Button
              onClick={handleDownloadReceipt}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              size="lg"
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar comprobante
            </Button>

            <Button onClick={handleBackToDashboard} variant="outline" className="w-full bg-transparent" size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al dashboard
            </Button>
          </div>

          {/* Nota informativa */}
          <div className="pt-2">
            <Alert className="bg-muted/50 border-border">
              <AlertDescription className="text-xs text-muted-foreground text-pretty">
                Se ha enviado un comprobante de pago a tu correo electrónico. Si tienes alguna duda, contacta a soporte
                con el ID de transacción.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
