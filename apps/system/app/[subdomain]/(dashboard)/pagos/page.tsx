"use client";
import { useState, useEffect } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/shadcn/tabs";
import { Backpack, Settings, History } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@repo/convex/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useUserWithConvex } from "../../../../stores/userStore";
import { useCurrentSchool } from "../../../../stores/userSchoolsStore";
import Pagos from "./pagos";
import PaymentHistoryComponent from "./payment-history";
import StripeConfigPage from "./escuela";
import { Button } from "@repo/ui/components/shadcn/button";
import Link from "next/link";
import BillingConfig from "components/billings/BillingConfig"

export default function Colegiaturas() {
  const [selectedSchoolCycle, setSelectedSchoolCycle] = useState<string>("");
  const [showStripeConfig, setShowStripeConfig] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [buttonText, setButtonText] = useState<string>("Consultar Plataforma de Pagos");
  const [textOpacity, setTextOpacity] = useState<number>(1);

  // Hooks para obtener datos del usuario y escuela
  const { user: clerkUser } = useUser();
  const { currentUser } = useUserWithConvex(clerkUser?.id);
  const { currentSchool } = useCurrentSchool(currentUser?._id);

  // Obtener ciclos escolares
  const schoolCycles = useQuery(
    api.functions.schoolCycles.getAllSchoolCycles,
    currentSchool?.school._id ? { schoolId: currentSchool.school._id } : "skip"
  );

  // Establecer el ciclo activo por defecto cuando se cargan los datos
  useEffect(() => {
    if (schoolCycles && schoolCycles.length > 0 && !selectedSchoolCycle) {
      const activeCycle = schoolCycles.find((cycle) => cycle.isActive);
      if (activeCycle) {
        setSelectedSchoolCycle(activeCycle.id);
      } else if (schoolCycles[0]) {
        setSelectedSchoolCycle(schoolCycles[0]!.id);
      }
    }
  }, [schoolCycles, selectedSchoolCycle]);

  // Manejar el toggle con animación de salida
  const handleToggleStripeConfig = () => {
    if (showStripeConfig) {
      // Si está abierto, activar animación de cierre
      setIsClosing(true);
      // Fade out del texto
      setTextOpacity(0);
      // Cambiar el texto mientras está invisible
      setTimeout(() => {
        setButtonText("Consultar Plataforma de Pagos");
        // Fade in del nuevo texto
        setTextOpacity(1);
      }, 150); // Tiempo del fade-out
      setTimeout(() => {
        setShowStripeConfig(false);
        setIsClosing(false);
      }, 400);
    } else {
      setShowStripeConfig(true);
      setTextOpacity(0);
      setTimeout(() => {
        setButtonText("Ocultar");
        setTextOpacity(1);
      }, 150); 
    }
  };

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
                  <h1 className="text-4xl font-bold tracking-tight">
                    Sistema de Pagos
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Administra configuraciones, pagos e historial de pagos.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button       
                onClick={handleToggleStripeConfig}
                className={`transition-all duration-700 ease-in-out hover:scale-105 cursor-pointer ${
                  showStripeConfig ? "w-[160px]" : "w-[320px]"
                }`}
                variant="outline"
                size="lg"
              >
                <Settings
                  className={`
      h-4 w-4 md:h-4 md:w-4 flex-shrink-0 transition-transform duration-1900
      ${showStripeConfig ? "rotate-180" : ""}
    `}
                />
                <span 
                  className="truncate transition-opacity duration-300"
                  style={{ opacity: textOpacity }}
                >
                  {buttonText}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showStripeConfig && (
        <div
          className={`
    ${
      isClosing
        ? "animate-out slide-out-to-top-8 fade-out duration-400 ease-out"
        : "animate-in slide-in-from-top-8 fade-in duration-400 ease-out"
    }
  `}
        >
          <div className="pt-4">
            <StripeConfigPage />
          </div>
        </div>
      )}
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
          <BillingConfig/>
        </TabsContent>

        <TabsContent value="pagos" className="mt-4 md:mt-6">
          <Pagos
            selectedSchoolCycle={selectedSchoolCycle}
            setSelectedSchoolCycle={setSelectedSchoolCycle}
          />
        </TabsContent>

        <TabsContent value="historial" className="mt-4 md:mt-6">
          <PaymentHistoryComponent
            selectedSchoolCycle={selectedSchoolCycle}
            setSelectedSchoolCycle={setSelectedSchoolCycle}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
