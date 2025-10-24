"use client"

import { useState } from "react"
import { Button } from "@repo/ui/components/shadcn/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { useAction } from "convex/react"
import { api } from "@repo/convex/convex/_generated/api"
import { toast } from "sonner"
import { CheckCircle, AlertCircle, Loader2, ExternalLink } from "lucide-react"
import { Id } from "@repo/convex/convex/_generated/dataModel"

interface StripeConnectOnboardingProps {
  schoolId: Id<"school">
  schoolEmail: string
}

export function StripeConnectOnboarding ({ schoolId, schoolEmail }: StripeConnectOnboardingProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  
  const createAccount = useAction(api.functions.stripeConnect.createConnectedAccount)
  const createOnboardingLink = useAction(api.functions.stripeConnect.createAccountLink)
  const checkStatus = useAction(api.functions.stripeConnect.checkAccountStatus)
  const createDashboardLink = useAction(api.functions.stripeConnect.createLoginLink)

  const [accountStatus, setAccountStatus] = useState<{
    hasAccount: boolean
    isComplete: boolean
    chargesEnabled: boolean
    payoutsEnabled: boolean
    detailsSubmitted: boolean
    requireAction: boolean
    hasExternalAccount: boolean
  } | null>(null)

  const handleCreateAccount = async () => {
    setIsCreating(true)
    try {
      const result = await createAccount({
        schoolId,
        email: schoolEmail,
      })
      
      toast.success("Cuenta creada", {
        description: result.message,
      })

      // Abrir el onboarding
      await handleStartOnboarding()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      toast.error("Error al crear cuenta", {
        description: errorMessage,
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleStartOnboarding = async () => {
    try {
      const result = await createOnboardingLink({
        schoolId,
        returnUrl: `${window.location.origin}/configuracion/pagos?success=true`,
        refreshUrl: `${window.location.origin}/configuracion/pagos`,
      })

      // Abrir en nueva ventana
      window.open(result.url, "_blank")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      toast.error("Error al crear link de onboarding", {
        description: errorMessage,
      })
    }
  }

  const handleCheckStatus = async () => {
    setIsCheckingStatus(true)
    try {
      const status = await checkStatus({ schoolId })
      setAccountStatus(status)
      
      if (status.isComplete) {
        toast.success("¡Cuenta verificada!", {
          description: "Tu cuenta de Stripe está lista para recibir pagos.",
        })
      } else if (status.hasAccount) {
        toast.info("Configuración pendiente", {
          description: "Necesitas completar la configuración de tu cuenta.",
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      toast.error("Error al verificar estado", {
        description: errorMessage,
      })
    } finally {
      setIsCheckingStatus(false)
    }
  }

  const handleOpenDashboard = async () => {
    try {
      const result = await createDashboardLink({ schoolId })
      window.open(result.url, "_blank")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      toast.error("Error al abrir dashboard", {
        description: errorMessage,
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Pagos - Stripe Connect</CardTitle>
        <CardDescription>
          Configura tu cuenta de Stripe para recibir pagos directamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!accountStatus && (
          <div className="flex gap-2">
            <Button onClick={handleCheckStatus} disabled={isCheckingStatus}>
              {isCheckingStatus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar Estado"
              )}
            </Button>
          </div>
        )}

        {accountStatus && !accountStatus.hasAccount && (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
              <p className="text-sm text-blue-900">
                Aún no tienes una cuenta de Stripe conectada. Crea una para empezar a recibir pagos.
              </p>
            </div>
            <Button onClick={handleCreateAccount} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                "Crear Cuenta de Stripe"
              )}
            </Button>
          </div>
        )}

        {accountStatus && accountStatus.hasAccount && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Estado de cuenta</span>
                  {accountStatus.isComplete ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Activa
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Pendiente
                    </Badge>
                  )}
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pagos habilitados</span>
                  {accountStatus.chargesEnabled ? (
                    <Badge className="bg-green-100 text-green-800">Sí</Badge>
                  ) : (
                    <Badge variant="secondary">No</Badge>
                  )}
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Retiros habilitados</span>
                  {accountStatus.payoutsEnabled ? (
                    <Badge className="bg-green-100 text-green-800">Sí</Badge>
                  ) : (
                    <Badge variant="secondary">No</Badge>
                  )}
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Detalles enviados</span>
                  {accountStatus.detailsSubmitted ? (
                    <Badge className="bg-green-100 text-green-800">Sí</Badge>
                  ) : (
                    <Badge variant="secondary">No</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {accountStatus.requireAction && (
                <Button onClick={handleStartOnboarding}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Completar Configuración
                </Button>
              )}
              
              {accountStatus.isComplete && (
                <Button variant="outline" onClick={handleOpenDashboard}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir Dashboard de Stripe
                </Button>
              )}

              <Button variant="outline" onClick={handleCheckStatus} disabled={isCheckingStatus}>
                {isCheckingStatus ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Actualizar Estado"
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}