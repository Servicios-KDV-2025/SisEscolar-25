"use client";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
import { Backpack, Filter, AlertTriangle, CheckCircle, Clock, DollarSign, User, CreditCard, AlertCircle, User2, Mail, MapPin, Info } from "lucide-react";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Phone } from "lucide-react";
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
    email: string
    metodoPago: string
    fechaVencimiento: string
    montoColegiatura: number
    diasRetraso: number
    estado: "al-dia" | "retrasado" | "moroso"
    proximoVencimiento: string
  }
  
  // Datos mock para simular los hijos de un padre específico
  const hijosDelPadre: Estudiante[] = [
    {
      id: "1",
      nombre: "Ana García López",
      grado: "3° Primaria",
      grupo: "A",
      matricula: "EST001",
      padre: "Carlos García Mendoza",
      telefono: "555-0123",
      email: "carlos.garcia@email.com",
      metodoPago: "Transferencia Bancaria",
      fechaVencimiento: "2025-01-05",
      montoColegiatura: 2500,
      diasRetraso: 0,
      estado: "al-dia",
      proximoVencimiento: "2025-02-05",
    },
    {
      id: "2",
      nombre: "Luis García López",
      grado: "5° Primaria",
      grupo: "B",
      matricula: "EST006",
      padre: "Carlos García Mendoza",
      telefono: "555-0123",
      email: "carlos.garcia@email.com",
      metodoPago: "Transferencia Bancaria",
      fechaVencimiento: "2025-01-05",
      montoColegiatura: 2500,
      diasRetraso: 8,
      estado: "retrasado",
      proximoVencimiento: "2025-02-05",
    },
  ]

export default function Colegiaturas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const [estudiantes] = useState<Estudiante[]>(hijosDelPadre)
  const [padreInfo] = useState({
    nombre: "Carlos García Mendoza",
    telefono: "555-0123",
    email: "carlos.garcia@email.com",
    direccion: "Calle 123, Colonia 123, Ciudad 123, Estado 123",

  })




  
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

  const totalAdeudado = estudiantes
    .filter(estudiante => estudiante.estado === "retrasado" || estudiante.estado === "moroso")
    .reduce((total, estudiante) => {
      return total + calcularMontoPagar(estudiante)
    }, 0)

  
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
                    Administra las colegiaturas de tus hijos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-xl font-medium  ">
               Informacion del Contacto
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Info className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 gap-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-semibold text-foreground">{padreInfo.nombre}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-semibold text-foreground">{padreInfo.telefono}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold text-foreground">{padreInfo.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Dirección</p>
                  <p className="font-semibold text-foreground">{padreInfo.direccion}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      {/* Tarjetas  */}
      <div className="grid grid-cols-1 md:grid-cols-3  gap-4">
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hijos Inscritos
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <User2 className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">{estudiantes.length}</div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
             Cantidad a pagar
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">{totalAdeudado}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Colegiaturas Pendientes o Morosas
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">{estudiantes.filter(e => e.estado === "retrasado" || e.estado === "moroso").length}</div>
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
                        <Badge variant="outline">{estudiantes.length} colegiaturas</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                <Accordion type="single" collapsible className="space-y-2">
              {estudiantes.map((estudiante) => (
                <AccordionItem
                key={estudiante.id}
                value={estudiante.id}
                className="border border-border rounded-lg bg-accent/30"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-accent/50 rounded-lg">
                  <div className="flex items-center justify-between w-full mr-4">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-start">
                        <h3 className="text-lg font-semibold text-foreground">{estudiante.nombre}</h3>
                        <p className="text-sm text-muted-foreground">
                          {estudiante.grado} - Grupo {estudiante.grupo} | {estudiante.matricula}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">
                          ${calcularMontoPagar(estudiante).toLocaleString()}
                        </p>
                        {estudiante.diasRetraso > 0 && (
                          <p className="text-sm text-destructive">{estudiante.diasRetraso} días de retraso</p>
                        )}
                      </div>
                      {getEstadoBadge(estudiante.estado)}
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-6 pb-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                    {/* Información de pago */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Información de Pago
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Método de pago:</span>
                          <span className="text-foreground font-medium">{estudiante.metodoPago}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Último vencimiento:</span>
                          <span className="text-foreground font-medium">{estudiante.fechaVencimiento}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Próximo vencimiento:</span>
                          <span className="text-foreground font-medium">{estudiante.proximoVencimiento}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Colegiatura mensual:</span>
                          <span className="text-foreground font-medium">
                            ${estudiante.montoColegiatura.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Estado y cálculo */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Estado de Cuenta
                      </h4>

                      {estudiante.estado === "al-dia" && (
                        <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-5 h-5 text-success" />
                            <span className="font-semibold text-success">¡Al día!</span>
                          </div>
                          <p className="text-sm text-foreground mb-3">Tu hijo está al corriente con sus pagos.</p>
                          <p className="text-sm text-muted-foreground">
                            Próximo pago:{" "}
                            <span className="font-semibold text-foreground">
                              ${estudiante.montoColegiatura.toLocaleString()}
                            </span>
                          </p>
                        </div>
                      )}

                      {estudiante.estado === "retrasado" && (
                        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-5 h-5 text-warning" />
                            <span className="font-semibold text-warning">Pago pendiente</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <p className="text-foreground">
                              Colegiatura: ${estudiante.montoColegiatura.toLocaleString()}
                            </p>
                            <p className="text-foreground">
                              Recargo ({estudiante.diasRetraso} días): $
                              {(estudiante.diasRetraso * 150).toLocaleString()}
                            </p>
                            <p className="font-bold text-lg text-warning">
                              Total: ${calcularMontoPagar(estudiante).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}

                      {estudiante.estado === "moroso" && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-5 h-5 text-destructive" />
                            <span className="font-semibold text-destructive">Pago vencido</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <p className="text-foreground">
                              Lleva <span className="font-bold">{estudiante.diasRetraso} días</span> de retraso
                            </p>
                            <p className="text-foreground">
                              Colegiatura: ${estudiante.montoColegiatura.toLocaleString()}
                            </p>
                            <p className="text-foreground">
                              Recargos: ${(estudiante.diasRetraso * 150).toLocaleString()}
                            </p>
                            <p className="font-bold text-lg text-destructive">
                              Deuda total: ${calcularMontoPagar(estudiante).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botón de pago */}
                  {estudiante.estado !== "al-dia" && (
                  <div className="mt-6 pt-4 border-t border-border">
                    <Button
                      // onClick={() => handlePagar(estudiante)}
                      className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
                      size="lg"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pagar ${calcularMontoPagar(estudiante).toLocaleString()}
                    </Button>
                  </div>
                  )}
                </AccordionContent>
              </AccordionItem>
              ))}
 
            </Accordion>

                </CardContent>
            </Card>

            <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-foreground">¿Necesitas ayuda?</h3>
              <p className="text-sm text-muted-foreground">
                Si tienes dudas sobre tu estado de cuenta o necesitas asistencia con los pagos, contacta a la
                administración escolar.
              </p>
              <div className="flex justify-center gap-4 mt-4">
                <Button variant="outline" size="sm">
                  <Phone className="w-4 h-4 mr-2" />
                  Llamar
                </Button>
                <Button variant="outline" size="sm">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

    </div>
  );
}

