"use client";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
import { Backpack, Banknote, ClockAlert, TriangleAlert, Filter, AlertTriangle, CheckCircle, Clock, DollarSign, User, CreditCard, AlertCircle } from "lucide-react";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Input } from "@repo/ui/components/shadcn/input";
import { Select,SelectTrigger,SelectValue,SelectContent,SelectItem } from "@repo/ui/components/shadcn/select";
import { Search } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@repo/ui/components/shadcn/accordion";
import { Button } from "@repo/ui/components/shadcn/button";



interface Estudiante {
    id: string
    nombre: string
    grado: string
    grupo: string
    matricula: string
    padre: string
    telefono: string
    metodoPago: string
    fechaVencimiento: string
    montoColegiatura: number
    diasRetraso: number
    estado: "al-dia" | "retrasado" | "moroso"
  }
  
  const estudiantesMock: Estudiante[] = [
    {
      id: "1",
      nombre: "Ana García López",
      grado: "3° Primaria",
      grupo: "A",
      matricula: "EST001",
      padre: "Carlos García Mendoza",
      telefono: "555-0123",
      metodoPago: "Transferencia Bancaria",
      fechaVencimiento: "2024-01-05",
      montoColegiatura: 2500,
      diasRetraso: 0,
      estado: "al-dia",
    },
    {
      id: "2",
      nombre: "Luis Martínez Ruiz",
      grado: "5° Primaria",
      grupo: "B",
      matricula: "EST002",
      padre: "María Ruiz Hernández",
      telefono: "555-0456",
      metodoPago: "Efectivo",
      fechaVencimiento: "2024-01-05",
      montoColegiatura: 2500,
      diasRetraso: 12,
      estado: "retrasado",
    },
    {
      id: "3",
      nombre: "Sofia Hernández Cruz",
      grado: "1° Secundaria",
      grupo: "A",
      matricula: "EST003",
      padre: "Roberto Hernández Silva",
      telefono: "555-0789",
      metodoPago: "Tarjeta de Crédito",
      fechaVencimiento: "2024-01-05",
      montoColegiatura: 3200,
      diasRetraso: 45,
      estado: "moroso",
    },
    {
      id: "4",
      nombre: "Diego Ramírez Torres",
      grado: "2° Secundaria",
      grupo: "C",
      matricula: "EST004",
      padre: "Laura Torres Vega",
      telefono: "555-0321",
      metodoPago: "Transferencia Bancaria",
      fechaVencimiento: "2024-01-05",
      montoColegiatura: 3200,
      diasRetraso: 0,
      estado: "al-dia",
    },
    {
      id: "5",
      nombre: "Isabella Morales Jiménez",
      grado: "6° Primaria",
      grupo: "A",
      matricula: "EST005",
      padre: "Fernando Morales Castro",
      telefono: "555-0654",
      metodoPago: "Efectivo",
      fechaVencimiento: "2024-01-05",
      montoColegiatura: 2800,
      diasRetraso: 8,
      estado: "retrasado",
    },
  ]

export default function Colegiaturas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Calcular estadísticas
  const totalColegiaturas = estudiantesMock.length;
  const colegiaturasAlDia = estudiantesMock.filter(e => e.estado === "al-dia").length;
  const colegiaturasRetrasadas = estudiantesMock.filter(e => e.estado === "retrasado").length;
  const colegiaturasMorosas = estudiantesMock.filter(e => e.estado === "moroso").length;
  
  const calcularMontoPagar = (estudiante: Estudiante) => {
    if (estudiante.estado === "al-dia") {
      return estudiante.montoColegiatura
    } else if (estudiante.estado === "retrasado") {
      return estudiante.montoColegiatura + estudiante.diasRetraso * 150
    } else {
      return estudiante.montoColegiatura + estudiante.diasRetraso * 150
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "al-dia":
        return (
          <Badge  className="bg-transparent text-green-800 ">
            <CheckCircle className="w-4 h-4 mr-1 text-green-800 " />
            Al día
          </Badge>
        )
      case "retrasado":
        return (
          <Badge  className="bg-transparent text-yellow-800">
            <Clock className="w-4 h-4 mr-1 text-yellow-800" />
            Retrasado
          </Badge>
        )
      case "moroso":
        return (
          <Badge  className="bg-transparent text-red-500 ">
            <AlertTriangle className="w-4 h-4 mr-1 text-red-500 " />
            Moroso
          </Badge>
        )
      default:
        return null
    }
  }


  const handleDarDeBaja = (estudiante: Estudiante) => {
    if (confirm(`¿Estás seguro de que deseas dar de baja a ${estudiante.nombre}? Esta acción no se puede deshacer.`)) {
      // Aquí ira la logica para dar de baja al estudiante si es que se decide que se va a necesirar 
      alert(`${estudiante.nombre} ha sido dado de baja del sistema.`)
    }
  }
  return (
    // Header
    <div className="space-y-8 p-6">
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
                  <h1 className="text-4xl font-bold tracking-tight">
                    Colegiaturas
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Administra las colegiaturas de los alumnos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Tarjetas  */}
      <div className="grid grid-cols-1 md:grid-cols-4  gap-4">
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Colegiaturas
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Backpack className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">{totalColegiaturas}</div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Colegiaturas Pagadas
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Banknote className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">{colegiaturasAlDia}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Colegiaturas Pendientes
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <ClockAlert className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">{colegiaturasRetrasadas}</div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Colegiaturas Morosas
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <TriangleAlert className="h-4 w-4 " />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">{colegiaturasMorosas}</div>
          </CardContent>
        </Card>
      </div>
      {/* Filtros y Búsqueda*/}
      <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Filter className='h-5 w-5' />
                                Filtros y Búsqueda
                            </CardTitle>
                            <CardDescription>
                                Encuentra las colegiaturas por nombre, matrícula o estado de pago.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por nombre o matrícula..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Select
                                onValueChange={(v) => setStatusFilter(v === "all" ? null : v)}
                                value={statusFilter || ""}
                            >
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Filtrar estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    <SelectItem value="active">Pagadas</SelectItem>
                                    <SelectItem value="pending">Pendientes</SelectItem>
                                    <SelectItem value="overdue">Morosas</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>
            {/* Tabla de Colegiaturas */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Lista de las colegiaturas</span>
                        <Badge variant="outline">{estudiantesMock.length} colegiaturas</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                <Accordion type="single" collapsible className="space-y-2">
              {estudiantesMock.map((estudiante) => (
                <AccordionItem
                  key={estudiante.id}
                  value={estudiante.id}
                  className="border border-border rounded-lg bg-accent/50"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent/70 rounded-lg">
                    <div className="flex items-center justify-between w-full mr-4">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-start">
                          <h3 className="font-semibold text-foreground">{estudiante.nombre}</h3>
                          <p className="text-sm text-muted-foreground">
                            {estudiante.grado} - Grupo {estudiante.grupo} | {estudiante.matricula} 

                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {getEstadoBadge(estudiante.estado)}
                        <div className="text-right">
                            
                          <p className="font-semibold text-foreground">
                            ${calcularMontoPagar(estudiante).toLocaleString()}
                          </p>
                          {estudiante.diasRetraso > 0 && (
                            <p className="text-sm text-muted-foreground">{estudiante.diasRetraso} días de retraso</p>
                          )}
                        </div>
                            {/* {getEstadoBadge(estudiante.estado)} */}
                        
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-4 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      {/* Información del padre/tutor */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Información del Padre/Tutor
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="text-muted-foreground">Nombre:</span>{" "}
                            <span className="text-foreground">{estudiante.padre}</span>
                          </p>
                          <p>
                            <span className="text-muted-foreground">Teléfono:</span>{" "}
                            <span className="text-foreground">{estudiante.telefono}</span>
                          </p>
                        </div>
                      </div>

                      {/* Información de pago */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Información de Pago
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="text-muted-foreground">Método de pago:</span>{" "}
                            <span className="text-foreground">{estudiante.metodoPago}</span>
                          </p>
                          <p>
                            <span className="text-muted-foreground">Fecha de vencimiento:</span>{" "}
                            <span className="text-foreground">{estudiante.fechaVencimiento}</span>
                          </p>
                          <p>
                            <span className="text-muted-foreground">Colegiatura base:</span>{" "}
                            <span className="text-foreground">${estudiante.montoColegiatura.toLocaleString()}</span>
                          </p>
                        </div>
                      </div>

                      {/* Cálculo del pago */}
                      <div className="md:col-span-2">
                        <h4 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                          <DollarSign className="w-4 h-4" />
                          Cálculo del Pago
                        </h4>

                        {estudiante.estado === "al-dia" && (
                          <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="w-5 h-5 text-success" />
                              <span className="font-semibold text-success">Estudiante al día</span>
                            </div>
                            <p className="text-sm text-foreground">
                              El estudiante está al corriente con sus pagos. Monto a pagar:{" "}
                              <span className="font-bold">${estudiante.montoColegiatura.toLocaleString()}</span>
                            </p>
                          </div>
                        )}

                        {estudiante.estado === "retrasado" && (
                          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-5 h-5 text-warning" />
                              <span className="font-semibold text-warning">Pago retrasado</span>
                            </div>
                            <div className="space-y-2 text-sm text-foreground">
                              <p>Colegiatura base: ${estudiante.montoColegiatura.toLocaleString()}</p>
                              <p>
                                Penalización ({estudiante.diasRetraso} días × $150): $
                                {(estudiante.diasRetraso * 150).toLocaleString()}
                              </p>
                              <p className="font-bold text-lg">
                                Total a pagar: ${calcularMontoPagar(estudiante).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )}

                        {estudiante.estado === "moroso" && (
                          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <AlertCircle className="w-5 h-5 text-destructive" />
                              <span className="font-semibold text-destructive">Estudiante moroso</span>
                            </div>
                            <div className="space-y-3">
                              <p className="text-sm text-foreground">
                                El estudiante lleva <span className="font-bold">{estudiante.diasRetraso} días</span> sin
                                pagar la colegiatura.
                              </p>
                              <div className="space-y-2 text-sm text-foreground">
                                <p>Colegiatura base: ${estudiante.montoColegiatura.toLocaleString()}</p>
                                <p>
                                  Penalización ({estudiante.diasRetraso} días × $150): $
                                  {(estudiante.diasRetraso * 150).toLocaleString()}
                                </p>
                                <p className="font-bold text-lg text-destructive">
                                  Deuda total: ${calcularMontoPagar(estudiante).toLocaleString()}
                                </p>
                              </div>
                              <div className="pt-3 border-t border-destructive/20">
                                <p className="text-sm text-foreground mb-3">
                                  ¿Deseas dar de baja a este estudiante de la escuela?
                                </p>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDarDeBaja(estudiante)}
                                    className="bg-destructive text-white hover:bg-destructive/90"
                                    >
                                  <AlertTriangle className="w-4 h-4 mr-2 text-white" />
                                  Dar de baja
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

                </CardContent>
            </Card>

    </div>
  );
}
