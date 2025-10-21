"use client"

import { Button } from "@repo/ui/components/shadcn/button"
import { cn } from "lib/utils"
import { CreditCard, X, Minus, Plus, Banknote } from "@repo/ui/icons"

interface FloatingBillingProps {
  selectedCount: number
  totalBase: number
  totalDiscounts: number
  totalFees: number
  totalSelected: number
  onRealizarPagos: () => void
  onClear: () => void
  isProcessing?: boolean
  className?: string
}

export function FloatingBilling({
  selectedCount,
  totalBase,
  totalDiscounts,
  totalFees,
  totalSelected,
  onRealizarPagos,
  onClear,
  isProcessing = false,
  className,
}: FloatingBillingProps) {
  if (selectedCount === 0) return null

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50",
        "animate-in slide-in-from-bottom-5 duration-300",
        className,
      )}
      role="region"
      aria-label="Resumen de pagos seleccionados"
      aria-live="polite"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="lg:hidden py-4 space-y-4">

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-primary tabular-nums">
                  <Banknote/>
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {selectedCount === 1 ? "1 pago" : `${selectedCount} pagos`}
                </p>
                <p className="text-xs text-muted-foreground">{selectedCount === 1 ? "seleccionado" : `seleccionado`}</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              disabled={isProcessing}
              className="h-10 w-10 p-0 flex-shrink-0"
              aria-label="Limpiar selección"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2 bg-muted/30 rounded-lg p-4 border border-border/50">

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">Monto base</span>
              <span className="font-semibold tabular-nums text-foreground">
                ${formatCurrency(totalBase)}
              </span>
            </div>

            {totalDiscounts > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <Minus className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="font-medium">Descuentos</span>
                </div>
                <span className="font-semibold text-emerald-600 tabular-nums">
                  ${formatCurrency(totalDiscounts)}
                </span>
              </div>
            )}

            {totalFees > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-rose-600">
                  <Plus className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="font-medium">Recargos</span>
                </div>
                <span className="font-semibold text-rose-600 tabular-nums">
                  ${formatCurrency(totalFees)}
                </span>
              </div>
            )}

            <div className="pt-2.5 mt-2.5 border-t border-border flex items-baseline justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold tabular-nums text-foreground">
                  ${formatCurrency(totalSelected)}
                </span>
                <span className="text-xs font-medium text-muted-foreground mb-0.5">MXN</span>
              </div>
            </div>
          </div>
          <Button
            onClick={onRealizarPagos}
            disabled={isProcessing}
            size="lg"
            className="w-full h-12 px-8 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white hover:from-gray-800 hover:via-blue-900 hover:to-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-semibold text-base group relative overflow-hidden"

            aria-label={`Procesar ${selectedCount > 1 ? "pagos" : "pago"}`}
          >
            {isProcessing ? (
              <>
                <div className="h-4 w-4 mr-2 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5 mr-2" />
                <span>Realizar {selectedCount > 1 ? "pagos" : "pago"}</span>
              </>
            )}
          </Button>
        </div>

        <div className="hidden lg:flex items-center justify-between py-5 gap-8">

          <div className="flex items-center gap-8">

            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                <span className="text-base font-bold text-primary tabular-nums">
                  {selectedCount}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {selectedCount === 1 ? "1 pago" : `${selectedCount} pagos`}
                </p>
                <p className="text-xs text-muted-foreground">{selectedCount === 1 ? "seleccionado" : `seleccionado`}</p>
              </div>
            </div>

            <div className="h-12 w-px bg-border" aria-hidden="true" />

            <div className="flex items-center gap-6">

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Monto Base
                </p>
                <p className="text-lg font-bold tabular-nums text-foreground">
                  ${formatCurrency(totalBase)}
                </p>
              </div>

              {totalDiscounts > 0 && (
                <>
                  <div className="h-8 w-px bg-border" aria-hidden="true" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Minus className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                      <p className="text-xs text-emerald-600 uppercase tracking-wider font-medium">
                        Descuentos
                      </p>
                    </div>
                    <p className="text-lg font-bold text-emerald-600 tabular-nums">
                      ${formatCurrency(totalDiscounts)}
                    </p>
                  </div>
                </>
              )}
              {totalFees > 0 && (
                <>
                  <div className="h-8 w-px bg-border" aria-hidden="true" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Plus className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
                      <p className="text-xs text-rose-600 uppercase tracking-wider font-medium">
                        Recargos
                      </p>
                    </div>
                    <p className="text-lg font-bold text-rose-600 tabular-nums">
                      ${formatCurrency(totalFees)}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">

            <div className="text-right space-y-1 min-w-[200px]">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Total a pagar
              </p>
              <div className="flex items-baseline justify-end gap-2">
                <span className="text-3xl font-black tabular-nums text-foreground tracking-tight">
                  ${formatCurrency(totalSelected)}
                </span>
                <span className="text-sm font-semibold text-muted-foreground">MXN</span>
              </div>
            </div>

            <div className="flex items-center gap-3">

              

              <Button
                onClick={onRealizarPagos}
                disabled={isProcessing}
                size="lg"
                className="h-12 px-8 text-base font-semibold"
                aria-label={`Procesar ${selectedCount > 1 ? "pagos" : "pago"}`}
              >
                {isProcessing ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    <span>Realizar {selectedCount > 1 ? "pagos" : "pago"}</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={onClear}
                disabled={isProcessing}
                className="h-12 px-4"
                aria-label="Limpiar selección"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}