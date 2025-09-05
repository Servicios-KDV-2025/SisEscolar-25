"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { Button } from "@repo/ui/components/shadcn/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/shadcn/dialog"
import { Input } from "@repo/ui/components/shadcn/input"
import { Eye, Edit, Trash2, Plus, Clock, MapPin, User, Search } from "lucide-react"
import { cn } from "@repo/ui/lib/utils"

// Tipos de datos
interface Schedule {
  id: string
  day: string
  startTime: string
  endTime: string
  classroom: string
  professor: string
}

interface Class {
  id: string
  name: string
  description: string
  status: "active" | "inactive"
  credits: number
  schedules: Schedule[]
}

// Datos de ejemplo
const mockClasses: Class[] = [
  {
    id: "1",
    name: "Cálculo Diferencial",
    description: "Fundamentos del cálculo diferencial y sus aplicaciones",
    status: "active",
    credits: 4,
    schedules: [
      {
        id: "1",
        day: "Lunes",
        startTime: "08:00",
        endTime: "10:00",
        classroom: "Aula 101",
        professor: "Dr. García López",
      },
      {
        id: "2",
        day: "Miércoles",
        startTime: "08:00",
        endTime: "10:00",
        classroom: "Aula 101",
        professor: "Dr. García López",
      },
      {
        id: "3",
        day: "Viernes",
        startTime: "10:00",
        endTime: "12:00",
        classroom: "Lab 205",
        professor: "Dr. García López",
      },
    ],
  },
  {
    id: "2",
    name: "Programación Web",
    description: "Desarrollo de aplicaciones web modernas con React y Node.js",
    status: "active",
    credits: 3,
    schedules: [
      {
        id: "4",
        day: "Martes",
        startTime: "14:00",
        endTime: "16:00",
        classroom: "Lab 301",
        professor: "Ing. Martínez Silva",
      },
      {
        id: "5",
        day: "Jueves",
        startTime: "14:00",
        endTime: "17:00",
        classroom: "Lab 301",
        professor: "Ing. Martínez Silva",
      },
    ],
  },
  {
    id: "3",
    name: "Base de Datos",
    description: "Diseño y administración de sistemas de bases de datos",
    status: "inactive",
    credits: 3,
    schedules: [
      {
        id: "6",
        day: "Lunes",
        startTime: "16:00",
        endTime: "18:00",
        classroom: "Aula 203",
        professor: "Dra. Rodríguez Pérez",
      },
      {
        id: "7",
        day: "Miércoles",
        startTime: "16:00",
        endTime: "18:00",
        classroom: "Lab 102",
        professor: "Dra. Rodríguez Pérez",
      },
    ],
  },
  {
    id: "4",
    name: "Algoritmos y Estructuras",
    description: "Análisis de algoritmos y estructuras de datos avanzadas",
    status: "active",
    credits: 4,
    schedules: [
      {
        id: "8",
        day: "Martes",
        startTime: "10:00",
        endTime: "12:00",
        classroom: "Aula 105",
        professor: "Dr. Hernández Castro",
      },
      {
        id: "9",
        day: "Jueves",
        startTime: "08:00",
        endTime: "10:00",
        classroom: "Aula 105",
        professor: "Dr. Hernández Castro",
      },
      {
        id: "10",
        day: "Viernes",
        startTime: "14:00",
        endTime: "16:00",
        classroom: "Lab 204",
        professor: "Dr. Hernández Castro",
      },
    ],
  },
]

const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]

export default function AcademicDashboard() {
  const [classes, setClasses] = useState<Class[]>(mockClasses)
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)

  const filteredClasses = classes.filter((cls) => {
    const matchesFilter = filter === "all" || cls.status === filter
    const matchesSearch =
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getStatusBadge = (status: "active" | "inactive") => {
    return status === "active" ? (
      <Badge className="bg-primary text-primary-foreground">Activa</Badge>
    ) : (
      <Badge variant="destructive">Inactiva</Badge>
    )
  }

  const FilterButton = ({
    value,
    label,
    isActive,
  }: { value: "all" | "active" | "inactive"; label: string; isActive: boolean }) => (
    <Button
      variant={isActive ? "default" : "outline"}
      size="sm"
      onClick={() => setFilter(value)}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-medium transition-all",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {label}
    </Button>
  )

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground text-balance">Dashboard Académico</h1>
              <p className="text-muted-foreground text-pretty">Gestiona tus horarios de clase de manera eficiente</p>
            </div>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Clase
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar clases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <FilterButton value="all" label="Todas las clases" isActive={filter === "all"} />
            <FilterButton value="active" label="Activas" isActive={filter === "active"} />
            <FilterButton value="inactive" label="Inactivas" isActive={filter === "inactive"} />
          </div>
        </div>

        {/* Classes Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map((cls) => (
            <Card key={cls.id} className="group cursor-pointer transition-all hover:shadow-lg bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold text-card-foreground text-balance">
                      {cls.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(cls.status)}
                      <Badge variant="outline" className="text-xs">
                        {cls.credits} créditos
                      </Badge>
                    </div>
                  </div>
                </div>
                <CardDescription className="text-sm text-muted-foreground text-pretty">
                  {cls.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {cls.schedules.length} horario{cls.schedules.length !== 1 ? "s" : ""}
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedClass(cls)}
                          className="h-8 w-8 p-0 hover:bg-muted"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-popover">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-semibold text-popover-foreground text-balance">
                            {selectedClass?.name}
                          </DialogTitle>
                          <DialogDescription className="text-muted-foreground text-pretty">
                            {selectedClass?.description}
                          </DialogDescription>
                        </DialogHeader>

                        {selectedClass && (
                          <div className="space-y-6">
                            <div className="flex items-center gap-4">
                              {getStatusBadge(selectedClass.status)}
                              <Badge variant="outline">{selectedClass.credits} créditos</Badge>
                            </div>

                            <div className="space-y-4">
                              <h3 className="text-lg font-medium text-popover-foreground">Horarios por día</h3>

                              {daysOfWeek.map((day) => {
                                const daySchedules = selectedClass.schedules.filter((s) => s.day === day)

                                if (daySchedules.length === 0) return null

                                return (
                                  <div key={day} className="space-y-2">
                                    <h4 className="font-medium text-popover-foreground">{day}</h4>
                                    <div className="space-y-2">
                                      {daySchedules.map((schedule) => (
                                        <Card key={schedule.id} className="bg-muted/50 border-border">
                                          <CardContent className="p-4">
                                            <div className="grid gap-3 md:grid-cols-3">
                                              <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-primary" />
                                                <span className="text-sm font-medium">
                                                  {schedule.startTime} - {schedule.endTime}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-primary" />
                                                <span className="text-sm">{schedule.classroom}</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-primary" />
                                                <span className="text-sm">{schedule.professor}</span>
                                              </div>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      ))}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>

                            <div className="flex justify-center pt-4">
                              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                                <Plus className="mr-2 h-4 w-4" />
                                Agregar Horario
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredClasses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No se encontraron clases que coincidan con los filtros seleccionados.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
