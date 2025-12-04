"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useQuery, useAction } from "convex/react"
import { api } from "@repo/convex/convex/_generated/api"
import { Id } from "@repo/convex/convex/_generated/dataModel"
import { CheckCircle2, Download, ArrowLeft, AlertCircle, CreditCard, Calendar, Hash, FileText, Loader2 } from "lucide-react"
import { Button } from "@repo/ui/components/shadcn/button"
import { Card, CardContent, CardDescription, CardHeader } from "@repo/ui/components/shadcn/card"
import { Alert, AlertDescription } from "@repo/ui/components/shadcn/alert"
import { Separator } from "@repo/ui/components/shadcn/separator"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { toast } from "@repo/ui/sonner"

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
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false)
  
  const getStripeReceiptUrl = useAction(api.functions.actions.stripePayments.getStripeReceiptUrl)
  
  // Priorizar paymentId, luego paymentIntentId, luego billing como ultima opcion 
  const paymentId = searchParams.get("paymentId") as Id<"payments"> | null
  const paymentIntentId = searchParams.get("payment_intent") || searchParams.get("paymentIntentId")
  const billingId = searchParams.get("billingId") as Id<"billing"> | null

  //  Consulta por paymentId priorizado
  const paymentDetailsById = useQuery(
    api.functions.payments.getPaymentDetailsById,
    paymentId ? { paymentId } : "skip"
  )

  //  Consultar por paymentIntentId  por si el anterior falla 
  const paymentDetailsByPaymentIntent = useQuery(
    api.functions.payments.getPaymentDetailsByPaymentIntentId,
    !paymentId && paymentIntentId ? { paymentIntentId } : "skip"
  )

  //  Consultar por billingId si no hay paymentId ni paymentIntentId
  const paymentDetailsByBilling = useQuery(
    api.functions.payments.getLatestPaymentDetailsByBilling,
    !paymentId && !paymentIntentId && billingId ? { billingId } : "skip"
  )

  const paymentDetails = paymentDetailsById ?? paymentDetailsByPaymentIntent ?? paymentDetailsByBilling
  const hasValidId = paymentId !== null || paymentIntentId !== null || billingId !== null
  const loading = paymentDetails === undefined && hasValidId
  const error = !hasValidId
    ? "No se proporcionó un ID de pago válido"
    : paymentDetails === null && !loading
      ? "No se encontró información del pago. El pago puede estar aún procesándose. Por favor espera unos segundos y recarga la página."
      : null

  const paymentData: PaymentData | null = (() => {
    if (!paymentDetails?.payment || !paymentDetails?.billing || !paymentDetails?.student) {
      return null;
    }
    
    const { payment, billing, student } = paymentDetails;
    
    return {
      amount: `$${payment.amount.toLocaleString("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      concept: `${billing.type} - ${student.name} ${student.lastName || ""}`,
      date: new Date(payment.createdAt).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: new Date(payment.createdAt).toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      paymentMethod:
        payment.method === "card"
          ? "Tarjeta de crédito/débito"
          : payment.method === "cash"
            ? "Efectivo (OXXO)"
            : payment.method === "bank_transfer"
              ? "Transferencia bancaria (SPEI)"
              : "Otro",
      transactionId: payment.stripePaymentIntentId || payment._id,
      status: "success" as const,
      receiptUrl: payment.facturapiInvoiceId
        ? `https://api.facturapi.io/v1/invoices/${payment.facturapiInvoiceId}/pdf`
        : undefined,
    };
  })()

  const handleDownloadReceipt = async () => {
    if (!paymentDetails?.payment) return

    const payment = paymentDetails.payment
    const school = paymentDetails.school

    // Intentar con recibo de Stripe si está disponible
    if (payment.stripeChargeId && school?.stripeAccountId) {
      setIsLoadingReceipt(true)
      try {
        const result = await getStripeReceiptUrl({
          chargeId: payment.stripeChargeId,
          stripeAccountId: school.stripeAccountId,
        })

        if (result.invoiceUrl) {
          window.open(result.invoiceUrl, "_blank")
          return
        } else if (result.error) {
          console.error("Error obteniendo recibo de Stripe:", result.error)
          // Continuar con las siguientes opciones
        }
      } catch (error) {
        console.error("Error obteniendo recibo de Stripe:", error)
        toast.error("Error al obtener el recibo de Stripe", {
          description: error instanceof Error ? error.message : "Error desconocido",
        })
      } finally {
        setIsLoadingReceipt(false)
      }
    }

    //  Intentar con Facturapi como segunda opcion
    if (payment.facturapiInvoiceId) {
      const facturapiUrl = `https://api.facturapi.io/v1/invoices/${payment.facturapiInvoiceId}/pdf`
      window.open(facturapiUrl, "_blank")
      return
    }

    
    if (payment.facturapiInvoiceNumber) {
      toast.info("Recibo no disponible", {
        description: `Número de factura: ${payment.facturapiInvoiceNumber}`,
      })
      return
    }

    toast.info("Recibo no disponible", {
      description: "El recibo aún no está disponible. Por favor intenta más tarde.",
    })
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
              disabled={isLoadingReceipt}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              size="lg"
            >
              {isLoadingReceipt ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Obteniendo recibo...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar comprobante
                </>
              )}
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
