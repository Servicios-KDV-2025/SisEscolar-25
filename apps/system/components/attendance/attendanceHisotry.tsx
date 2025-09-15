'use client'

import { useUser } from "@clerk/nextjs"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { Button } from "@repo/ui/components/shadcn/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card"
import { Input } from "@repo/ui/components/shadcn/input"
import { Label } from "@repo/ui/components/shadcn/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/shadcn/table"
import { Calendar, Download, Filter, Search } from "@repo/ui/icons"
import { useState } from "react"
import { useClassCatalog } from "stores/classCatalogStore"
import { useCurrentSchool } from "stores/userSchoolsStore"
import { useUserWithConvex } from "stores/userStore"

export default function AttendanceHistory() {
  const { user: clerkUser } = useUser()
  const { currentUser } = useUserWithConvex(clerkUser?.id)
  const { currentSchool, isLoading } = useCurrentSchool(currentUser?._id)
  const { classCatalogs } = useClassCatalog(currentSchool?.school._id)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterClass, setFilterClass] = useState('all')
  const [filterState, setFilterState] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  if(isLoading) {
    return <div className="text-center py-10">Cargando escuala</div>
  }

  return(
    <div className="space-y-6">
      {/* filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5"/>
            Filtro de busqueda
          </CardTitle>
          <CardDescription>Filtra los registros de asistencia por diferentes criterios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar estudiante</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-0.5 h-4 w-4 text-muted-foreground"/>
                <Input 
                  id='search'
                  placeholder="Nombre o matricula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Clase</Label>
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger>
                  <SelectValue placeholder='Todas las clases'/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las Clases</SelectItem>
                  {classCatalogs.map((cc) => (
                    <SelectItem key={cc._id} value={cc._id}>
                      {cc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={filterState} onValueChange={setFilterState}>
                <SelectTrigger>
                  <SelectValue placeholder='Todos los estados'/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="present">Presente</SelectItem>
                  <SelectItem value="absent">Ausente</SelectItem>
                  <SelectItem value="justified">Justificado</SelectItem>
                  <SelectItem value="unjustified">Injustificado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-from" className="flex items-center gap-2">
                <Calendar className="h-4 w-4"/>
                Fecha desde:
              </Label>
              <Input id="date-to" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}/>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-from" className="flex items-center gap-2">
                <Calendar className="h-4 w-4"/>
                Fecha Hasta:
              </Label>
              <Input id="date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}/>
            </div>

            <div className="flex items-end" >
              <Button variant={'outline'} className="w-full bg-transparent">
                <Download className="h-5 w-5"/>
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5"/>
              Historial de Asistencia
            </span>
            <Badge variant={'secondary'}>2 registros</Badge>
          </CardTitle>
          <CardDescription>Registros de asistencia en formato de tabal</CardDescription>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Clase</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Comentario</TableHead>
                    <TableHead>Registrado por</TableHead>
                    <TableHead>Ultima actualización</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>{'name'} {'lastName'}</TableCell>
                    <TableCell>{'enrollment'}</TableCell>
                    <TableCell>{'classCatalog.name'}</TableCell>
                    <TableCell>{'date'}</TableCell>
                    <TableCell>{'attendanceState'}</TableCell>
                    <TableCell>{'comments'}</TableCell>
                    <TableCell>{'createdBy'}</TableCell>
                    <TableCell>{'updatedBy'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
        </CardHeader>
      </Card>
    </div>
  )
}