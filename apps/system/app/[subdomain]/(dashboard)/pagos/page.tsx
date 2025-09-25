"use client"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/shadcn/tabs"
import { Backpack, Settings, History } from "lucide-react"
import PaymentConfig from "./payment-config"
import Pagos from "./pagos"
import PaymentHistoryComponent from "./payment-history"

export default function Colegiaturas() {
  const [selectedSchoolCycle, setSelectedSchoolCycle] = useState<string>("2024-2025")

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
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

      <Tabs defaultValue="pagos" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configuracion" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuración de Pagos
          </TabsTrigger>
          <TabsTrigger value="pagos" className="flex items-center gap-2">
            <Backpack className="h-4 w-4" />
            Pagos
          </TabsTrigger>
          <TabsTrigger value="historial" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historial de Pagos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuracion">
          <PaymentConfig selectedSchoolCycle={selectedSchoolCycle} setSelectedSchoolCycle={setSelectedSchoolCycle} />
        </TabsContent>

        <TabsContent value="pagos">
          <Pagos selectedSchoolCycle={selectedSchoolCycle} setSelectedSchoolCycle={setSelectedSchoolCycle} />
        </TabsContent>

        <TabsContent value="historial">
          <PaymentHistoryComponent
            selectedSchoolCycle={selectedSchoolCycle}
            setSelectedSchoolCycle={setSelectedSchoolCycle}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
