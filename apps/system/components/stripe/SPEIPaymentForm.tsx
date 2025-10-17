"use client"

import { useState } from "react"
import { Button } from "@repo/ui/components/shadcn/button" 
import { Label } from "@repo/ui/components/shadcn/label"
import { Card } from "@repo/ui/components/shadcn/card"
import { Loader2, Building2, Copy, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useAction } from "convex/react"
import { api } from "@repo/convex/convex/_generated/api"
import { Id } from "@repo/convex/convex/_generated/dataModel"
import Stripe from "stripe"

interface SPEIPaymentFormProps {
  billingId: Id<"billing">
  amount: number
  schoolId: Id<"school">
  studentId: Id<"student">
  tutorId: Id<"user">
  studentName: string
  paymentType: string
  customerEmail: string
  customerName?: string
  onSuccess: () => void
  onCancel: () => void
}

export function SPEIPaymentForm({
  billingId,
  amount,
  schoolId,
  studentId,
  tutorId,
  studentName,
  paymentType,
  customerEmail,
  customerName,
  onCancel,
}: SPEIPaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [transferInstructions, setTransferInstructions] = useState<Stripe.PaymentIntent.NextAction.DisplayBankTransferInstructions | null>(null)

  const createPaymentIntent = useAction(api.functions.stripePayments.createPaymentIntentWithSPEI)

  const handleGenerateInstructions = async () => {
    setIsProcessing(true)
    try {
      const result = await createPaymentIntent({
        billingId,
        amount,
        schoolId,
        studentId,
        tutorId,
        description: `Pago de ${paymentType} - ${studentName}`,
        customerEmail,
        customerName: customerName || studentName,
      })

      setTransferInstructions(result.transferInstructions)
      
      if (result.transferInstructions) {
        toast.success("Instrucciones generadas", {
          description: "Realiza la transferencia con los datos mostrados",
        })
      } else {
        toast.info("Payment Intent creado", {
          description: "Las instrucciones pueden tardar unos momentos en generarse. Revisa la consola para más detalles.",
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      toast.error("Error al generar instrucciones", {
        description: errorMessage,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copiado al portapapeles")
  }

  if (!transferInstructions) {
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
            <Building2 className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                Pago por Transferencia Bancaria (SPEI)
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Recibirás los datos bancarios para realizar la transferencia. 
                El pago se confirmará automáticamente en 1-2 días hábiles.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button onClick={handleGenerateInstructions} disabled={isProcessing} className="min-w-[200px]">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Building2 className="mr-2 h-4 w-4" />
                Generar Datos de Transferencia
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // Si no hay instrucciones pero se generó el payment intent, mostrar mensaje informativo
  if (!transferInstructions || Object.keys(transferInstructions).length === 0) {
    return (
      <div className="space-y-6">
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Pago SPEI Creado</h3>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm text-blue-800">
              Se ha creado el pago exitosamente, pero las instrucciones SPEI completas no están disponibles en modo de prueba.
            </p>
            
            <div className="p-3 bg-white border rounded-lg">
              <p className="text-xs font-medium text-gray-700 mb-2">En producción verás:</p>
              <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                <li>CLABE interbancaria (18 dígitos)</li>
                <li>Nombre del banco receptor</li>
                <li>Referencia de pago</li>
                <li>Monto exacto a transferir</li>
              </ul>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>Nota:</strong> SPEI en modo test de Stripe tiene limitaciones. 
                Para probar completamente, necesitas usar el ambiente de producción.
              </p>
            </div>
          </div>
        </Card>

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            Cerrar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold text-green-900">Instrucciones de Transferencia</h3>
        </div>
        
        <div className="space-y-3">
          {/* Mostrar toda la información disponible */}
          {transferInstructions?.financial_addresses && transferInstructions.financial_addresses.length > 0 && (
            <>
              <div>
                <Label className="text-sm font-medium text-gray-700">CLABE</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 p-2 bg-white border rounded text-sm font-mono">
                    {transferInstructions.financial_addresses[0]?.spei?.clabe ||                   
                     "No disponible"}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const clabe = transferInstructions.financial_addresses?.[0]?.spei?.clabe
                      if (clabe) {
                        copyToClipboard(clabe)
                      }
                    }}
                    disabled={!transferInstructions.financial_addresses?.[0]?.spei?.clabe}
                    className="cursor-pointer"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

               <Label className="text-sm font-medium text-gray-700 mt-3">Referencia</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 p-2 bg-white border rounded text-sm font-mono">
                    {transferInstructions?.reference ||
                    
                     "No disponible"}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const reference = transferInstructions?.reference
                      if (reference && typeof reference === 'string') {
                        copyToClipboard(reference)
                      }
                    }}
                    disabled={!transferInstructions?.reference}
                    className="cursor-pointer"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Banco</Label>
                <p className="p-2 bg-white border rounded text-sm mt-1">
                  {transferInstructions.financial_addresses[0]?.spei?.bank_name || "Banco Destinatario"}
                </p>
              </div>
            </>
          )}

          <div>
            <Label className="text-sm font-medium text-gray-700">Monto a Transferir</Label>
            <p className="p-2 bg-white border rounded text-sm font-bold mt-1">
              ${amount.toLocaleString()} MXN
            </p>
          </div>

        </div>

        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Importante:</strong> Realiza la transferencia con los datos exactos mostrados. 
            El pago se confirmará automáticamente en 1-2 días hábiles.
          </p>
        </div>
      </Card>

      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cerrar
        </Button>
      </div>
    </div>
  )
}