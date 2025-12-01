"use client"

import { Suspense } from "react"
import { PaymentSuccessContent } from "../../../../../components/pagos/PaymentSuccessContent"

export default function PagoCorrectoPagina() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-pulse">Cargando...</div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  )
}
