"use client"

import { useState } from "react"
import { Button } from "@repo/ui/components/shadcn/button"
import { Label } from "@repo/ui/components/shadcn/label"
import { Loader2, CreditCard, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { useAction } from "convex/react"
import { api } from "@repo/convex/convex/_generated/api"
import { Id } from "@repo/convex/convex/_generated/dataModel"

interface StripeCheckoutButtonProps {
  billingId: Id<"billing">
  amount: number
  schoolId: Id<"school">
  studentId: Id<"student">
  tutorId: Id<"user">
  studentName: string
  paymentType: string
  onCancel: () => void
}

export function StripeCheckoutButton({
  billingId,
  amount,
  schoolId,
  studentId,
  tutorId,
  studentName,
  paymentType,
  onCancel,
}: StripeCheckoutButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const createCheckoutSession = useAction(api.functions.stripePayments.createCheckoutSession)

  const handleCheckout = async () => {
    setIsProcessing(true)
    try {
      // Crear la sesión de checkout
      const { url } = await createCheckoutSession({
        billingId,
        amount,
        schoolId,
        studentId,
        tutorId,
        studentName,
        paymentType,
        successUrl: `${window.location.origin}${window.location.pathname}?payment=success&billingId=${billingId}`,
        cancelUrl: `${window.location.origin}${window.location.pathname}?payment=cancelled`,
      })

      // Redirigir a Stripe Checkout
      if (url) {
        window.location.href = url
      } else {
        throw new Error("No se pudo obtener la URL de checkout")
      }
    } catch (error: any) {
      toast.error("Error al iniciar el pago", {
        description: error.message,
      })
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold">Información del Pago</Label>
        <div className="mt-2 p-4 bg-gray-50 rounded-lg space-y-1">
          <p className="text-sm">
            <span className="font-medium">Estudiante:</span> {studentName}
          </p>
          <p className="text-sm">
            <span className="font-medium">Concepto:</span> {paymentType}
          </p>
          <p className="text-lg font-bold text-primary">
            Total: ${amount.toLocaleString()} MXN
          </p>
        </div>
      </div>

      <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
        <div className="flex items-start gap-2">
          <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              Pago Seguro con Stripe Checkout
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Serás redirigido a la página segura de Stripe para completar el pago con tu tarjeta.
              Acepta tarjetas de crédito y débito.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing}>
          Cancelar
        </Button>
        <Button onClick={handleCheckout} disabled={isProcessing} className="min-w-[180px]">
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Redirigiendo...
            </>
          ) : (
            <>
              <ExternalLink className="mr-2 h-4 w-4" />
              Ir a Stripe Checkout
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

