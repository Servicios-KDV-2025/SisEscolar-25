"use client"
import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/shadcn/tabs"
import { Backpack, Settings, History } from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "@repo/convex/convex/_generated/api"
import { useUser } from "@clerk/nextjs"
import { useUserWithConvex } from "../../../../stores/userStore"
import { useCurrentSchool } from "../../../../stores/userSchoolsStore"
import PaymentHistoryComponent from "./payment-history"
import BillingConfigPage from "components/billingConfigs/BillingConfigPage"
import BillingPage from "components/billing/BillingPage"

export default function Colegiaturas() {
  const [selectedSchoolCycle, setSelectedSchoolCycle] = useState<string>("")

  // Hooks para obtener datos del usuario y escuela
  const { user: clerkUser } = useUser()
  const { currentUser } = useUserWithConvex(clerkUser?.id)
  const { currentSchool } = useCurrentSchool(currentUser?._id)

  // Obtener ciclos escolares
  const schoolCycles = useQuery(
    api.functions.schoolCycles.getAllSchoolCycles,
    currentSchool?.school._id ? { schoolId: currentSchool.school._id } : "skip"
  )

  // Establecer el ciclo activo por defecto cuando se cargan los datos
  useEffect(() => {
    if (schoolCycles && schoolCycles.length > 0 && !selectedSchoolCycle) {
      const activeCycle = schoolCycles.find(cycle => cycle.isActive)
      if (activeCycle) {
        setSelectedSchoolCycle(activeCycle.id)
      } else if (schoolCycles[0]) {BillingConfigPage
        setSelectedSchoolCycle(schoolCycles[0]!.id)
      }
    }
  }, [schoolCycles, selectedSchoolCycle])

  return (
    <div className="space-y-4 md:space-y-8 p-4 md:p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Backpack className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">Sistema de Pagos</h1>
                  <p className="text-lg text-muted-foreground">
                    Administra configuraciones, pagos e historial de pagos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="pagos" className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 gap-2 md:gap-6 h-auto ">
          <TabsTrigger 
            value="configuracion" 
            className="flex items-center justify-center gap-2 p-3 md:p-2 h-auto md:h-10 text-sm md:text-base "
          >
            <Settings className="h-4 w-4 md:h-4 md:w-4 flex-shrink-0" />
            <span className="truncate">Configuración de Cobros</span>
          </TabsTrigger>
          <TabsTrigger 
            value="pagos" 
            className="flex items-center justify-center gap-2 p-3 md:p-2 h-auto md:h-10 text-sm md:text-base"
          >
            <Backpack className="h-4 w-4 md:h-4 md:w-4 flex-shrink-0" />
            <span className="truncate">Cobros</span>
          </TabsTrigger>
          <TabsTrigger 
            value="historial" 
            className="flex items-center justify-center gap-2 p-3 md:p-2 h-auto md:h-10 text-sm md:text-base"
          >
            <History className="h-4 w-4 md:h-4 md:w-4 flex-shrink-0" />
            <span className="truncate">Historial de Pagos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuracion" className="mt-4 md:mt-6">
          <BillingConfigPage/>
        </TabsContent>

        <TabsContent value="pagos" className="mt-4 md:mt-6">
          <BillingPage selectedSchoolCycle={selectedSchoolCycle} setSelectedSchoolCycle={setSelectedSchoolCycle} />
        </TabsContent>

        <TabsContent value="historial" className="mt-4 md:mt-6">
          <PaymentHistoryComponent
            selectedSchoolCycle={selectedSchoolCycle}
            setSelectedSchoolCycle={setSelectedSchoolCycle}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
