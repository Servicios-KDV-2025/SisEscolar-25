"use client"

import { useState, useEffect } from "react"
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@repo/ui/components/shadcn/button"
import { Label } from "@repo/ui/components/shadcn/label"
import { Loader2, CreditCard } from "lucide-react"
import { toast } from "sonner"
import { useAction } from "convex/react"
import { api } from "@repo/convex/convex/_generated/api"
import { Id } from "@repo/convex/convex/_generated/dataModel"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StripePaymentFormProps {
  billingId: Id<"billing">
  amount: number
  schoolId: Id<"school">
  studentId: Id<"student">
  tutorId: Id<"user">
  studentName: string
  paymentType: string
  onSuccess: () => void
  onCancel: () => void
}

function CheckoutForm({
  billingId,
  amount,
  schoolId,
  studentId,
  tutorId,
  studentName,
  paymentType,
  onSuccess,
  onCancel,
}: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  const createPaymentIntent = useAction(api.functions.stripePayments.createPaymentIntent)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      toast.error("Stripe no está listo")
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      toast.error("Elemento de tarjeta no encontrado")
      return
    }

    setIsProcessing(true)

    try {
      // Crear el Payment Intent
      const { clientSecret, paymentIntentId } = await createPaymentIntent({
        billingId,
        amount,
        schoolId,
        studentId,
        tutorId,
        description: `Pago de ${paymentType} - ${studentName}`,
        metadata: {
          paymentType,
          studentName,
        },
      })

      // Verificar que se obtuvo el clientSecret
      if (!clientSecret) {
        toast.error("Error al crear la intención de pago")
        return
      }

      // Confirmar el pago con la tarjeta
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      })

      if (result.error) {
        toast.error("Error al procesar el pago", {
          description: result.error.message,
        })
      } else if (result.paymentIntent.status === "succeeded") {
        toast.success("¡Pago procesado exitosamente!", {
          description: `Se procesó el pago de $${amount.toLocaleString()} MXN`,
        })
        onSuccess()
      }
    } catch (error: any) {
      toast.error("Error al procesar el pago", {
        description: error.message,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
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

        <div className="space-y-2">
          <Label htmlFor="card-element" className="text-base font-semibold">
            Información de la Tarjeta
          </Label>
          <div className="border rounded-lg p-4 bg-white">
            <CardElement
              id="card-element"
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#424770",
                    "::placeholder": {
                      color: "#aab7c4",
                    },
                  },
                  invalid: {
                    color: "#9e2146",
                  },
                },
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Los pagos son procesados de forma segura por Stripe
          </p>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!stripe || isProcessing} className="min-w-[150px]">
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pagar ${amount.toLocaleString()}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

export function StripePaymentForm(props: StripePaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  )
}