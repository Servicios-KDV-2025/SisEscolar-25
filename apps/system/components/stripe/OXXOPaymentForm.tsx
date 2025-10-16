"use client"

import { useState } from "react"
import { Button } from "@repo/ui/components/shadcn/button" 
import { Label } from "@repo/ui/components/shadcn/label"
import { Card } from "@repo/ui/components/shadcn/card"
import { Loader2, Store, Copy, CheckCircle, Download } from "lucide-react"
import { toast } from "sonner"
import { useAction } from "convex/react"
import { api } from "@repo/convex/convex/_generated/api"
import { Id } from "@repo/convex/convex/_generated/dataModel"

interface OXXOPaymentFormProps {
  billingId: Id<"billing">
  amount: number
  schoolId: Id<"school">
  studentId: Id<"student">
  tutorId: Id<"user">
  studentName: string
  paymentType: string
  customerEmail: string
  customerName?: string
  onSuccess?: () => void
  onCancel: () => void
}

export function OXXOPaymentForm({
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
}: OXXOPaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [oxxoDetails, setOxxoDetails] = useState<any>(null)

  const createPaymentIntent = useAction(api.functions.stripePayments.createPaymentIntentWithOXXO)

  const handleGenerateOXXO = async () => {
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

      setOxxoDetails(result)
      
      toast.success("Ficha OXXO generada", {
        description: "Paga en cualquier tienda OXXO con el número de referencia",
      })
    } catch (error: any) {
      toast.error("Error al generar ficha OXXO", {
        description: error.message,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copiado al portapapeles")
  }

  const handlePrintVoucher = () => {
    if (oxxoDetails?.hostedVoucherUrl) {
      window.open(oxxoDetails.hostedVoucherUrl, '_blank')
    }
  }

  if (!oxxoDetails) {
    return (
      <div className="space-y-6 overflow-hidden">
        <div>
          <Label className="text-sm md:text-base font-semibold">Información del Pago</Label>
          <div className="mt-2 p-3 md:p-4 bg-gray-50 rounded-lg space-y-1">
            <p className="text-xs md:text-sm break-words">
              <span className="font-medium">Estudiante:</span> {studentName}
            </p>
            <p className="text-xs md:text-sm break-words">
              <span className="font-medium">Concepto:</span> {paymentType}
            </p>
            <p className="text-base md:text-lg font-bold text-primary">
              Total: ${amount.toLocaleString()} MXN
            </p>
          </div>
        </div>

        <div className="p-3 md:p-4 border rounded-lg bg-orange-50 border-orange-200 overflow-hidden">
          <div className="flex items-start gap-2">
            <Store className="h-4 w-4 md:h-5 md:w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-orange-900">
                Pago en OXXO
              </p>
              <p className="text-xs text-orange-700 mt-1">
                Genera tu ficha de pago y paga en cualquier tienda OXXO. 
                El pago se confirmará automáticamente en minutos.
              </p>
              <ul className="text-xs text-orange-700 mt-2 space-y-1 list-disc pl-4 md:pl-5">
                <li>Válido por 3 días</li>
                <li>Paga en efectivo o con tarjeta en OXXO</li>
                <li>Confirmación automática</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-4 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            disabled={isProcessing}
            className="w-full sm:w-auto text-xs md:text-sm"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleGenerateOXXO} 
            disabled={isProcessing} 
            className="w-full sm:w-auto sm:min-w-[200px] text-xs md:text-sm"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
                <span className="truncate">Generando...</span>
              </>
            ) : (
              <>
                <Store className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                <span className="truncate">Generar Ficha OXXO</span>
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 overflow-hidden">
      <Card className="p-4 md:p-6 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-orange-600 flex-shrink-0" />
          <h3 className="font-bold text-orange-900 text-base md:text-lg">Ficha de Pago OXXO</h3>
        </div>
        
        <div className="space-y-4">
          {/* Número de referencia OXXO */}
          <div className="bg-white p-3 md:p-4 rounded-lg border-2 border-orange-300">
            <Label className="text-xs md:text-sm font-medium text-gray-700 mb-2 block">
              Número de Referencia
            </Label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <code className="flex-1 p-2 md:p-3 bg-orange-100 border-2 border-orange-300 rounded-lg text-sm md:text-lg font-bold text-center break-all tracking-wide md:tracking-widest overflow-hidden">
                {oxxoDetails.oxxoNumber || "No disponible"}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(oxxoDetails.oxxoNumber)}
                disabled={!oxxoDetails.oxxoNumber}
                className="cursor-pointer flex-shrink-0"
              >
                <Copy className="h-4 w-4" />
                <span className="ml-2 sm:hidden">Copiar</span>
              </Button>
            </div>
          </div>

          {/* Monto */}
          <div>
            <Label className="text-xs md:text-sm font-medium text-gray-700">Monto a Pagar</Label>
            <p className="p-2 md:p-3 bg-white border rounded-lg text-base md:text-lg font-bold mt-1 text-center">
              ${amount.toLocaleString()} MXN
            </p>
          </div>

          {/* Fecha de expiración */}
          {oxxoDetails.expiresAt && (
            <div>
              <Label className="text-xs md:text-sm font-medium text-gray-700">Válido hasta</Label>
              <p className="p-2 md:p-3 bg-white border rounded-lg text-xs md:text-sm mt-1 text-center break-words">
                {new Date(oxxoDetails.expiresAt * 1000).toLocaleString('es-MX', {
                  dateStyle: 'long',
                  timeStyle: 'short'
                })}
              </p>
            </div>
          )}

          {/* Instrucciones */}
          <div className="bg-white p-3 md:p-4 rounded-lg border overflow-hidden">
            <h4 className="font-semibold text-xs md:text-sm mb-2">Instrucciones de pago:</h4>
            <ol className="text-xs text-gray-700 space-y-1.5 md:space-y-2 list-decimal pl-4 md:pl-5">
              <li>Acude a cualquier tienda OXXO</li>
              <li>Indica al cajero que quieres hacer un pago con OXXOPay</li>
              <li>Dicta el número de referencia o muestra el código de barras</li>
              <li>Realiza el pago en efectivo o con tarjeta</li>
              <li>Conserva tu comprobante</li>
            </ol>
          </div>

          {/* Botón para ver/imprimir voucher */}
          {oxxoDetails.hostedVoucherUrl && (
            <Button 
              variant="outline" 
              className="w-full text-xs md:text-sm" 
              onClick={handlePrintVoucher}
            >
              <Download className="mr-2 h-3 w-3 md:h-4 md:w-4" />
              <span className="truncate">Ver/Imprimir Ficha Completa</span>
            </Button>
          )}

          {/* Advertencias */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg overflow-hidden">
            <p className="text-xs text-yellow-800">
              <strong>Importante:</strong> 
            </p>
            <ul className="text-xs text-yellow-800 mt-1 space-y-1 list-disc pl-4 md:pl-5">
              <li>El monto debe ser exacto</li>
              <li>Esta ficha expira en 3 días</li>
              <li>El pago se confirma automáticamente en minutos</li>
              <li>Guarda tu comprobante de pago</li>
            </ul>
          </div>
        </div>
      </Card>

      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button variant="outline" onClick={onCancel} className="text-xs md:text-sm">
          Cerrar
        </Button>
      </div>
    </div>
  )
}