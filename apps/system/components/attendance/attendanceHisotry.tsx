'use client'

import { useUser } from "@clerk/nextjs"
import { api } from "@repo/convex/convex/_generated/api"
import { Id } from "@repo/convex/convex/_generated/dataModel"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { Button } from "@repo/ui/components/shadcn/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card"
import { Input } from "@repo/ui/components/shadcn/input"
import { Label } from "@repo/ui/components/shadcn/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/shadcn/table"
import { Calendar, Download, Filter, Search } from "@repo/ui/icons"
import { useQuery } from "convex/react"
import { useMemo, useState } from "react"
import { useClassCatalog } from "stores/classCatalogStore"
import { useCurrentSchool } from "stores/userSchoolsStore"
import { useUserWithConvex } from "stores/userStore"

type AttendanceState = 'present' | 'absent' | 'justified' | 'unjustified'

interface AttendanceFilters {
  studentName?: string
  classCatalogId?: Id<'classCatalog'>
  attendanceState?: AttendanceState
  dateFrom?: number
  dateTo?: number
}

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

  // Preparar filtros para el query
  const filters: AttendanceFilters | undefined = useMemo(() => {
    const filters: AttendanceFilters = {}

    if(searchTerm) filters.studentName = searchTerm
    if(filterClass !== 'all') filters.classCatalogId = filterClass as Id<'classCatalog'>
    if(filterState !== 'all') filters.attendanceState = filterState as AttendanceState
    if(dateFrom) filters.dateFrom = Math.floor(new Date(dateFrom).getTime() / 1000)
    if(dateTo) filters.dateTo = Math.floor(new Date(dateFrom).getTime() / 1000)

    return Object.keys(filters).length > 0 ? filters : undefined
  }, [searchTerm, filterClass, filterState, dateFrom, dateTo])

  // Obtener hisotrial se asistencias
  const attendanceHistory = useQuery(
    api.functions.attendance.getAttendanceHistory,
    currentSchool ? {
      schoolId: currentSchool.school._id,
      filters: filters
    } : 'skip'
  )

  // Preparar filtros para estadisticas
  const statsFilters = useMemo(() => ({
    classCatalogId: filterClass !== 'all' ? filterClass as Id<'classCatalog'> : undefined,
    dateFrom: dateFrom ? Math.floor(new Date(dateFrom).getTime() / 1000) : undefined,
    dateTo: dateTo ? Math.floor(new Date(dateFrom).getTime() / 1000) : undefined
  }), [filterClass, dateFrom, dateTo])

  // Obtener estadisitcas
  const attendanceState = useQuery(
    api.functions.attendance.getAttendanceStatistics,
    currentSchool ? {
      schoolId: currentSchool.school._id
    } : 'skip'
  )

  // Formatear fecha para mostrar
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  // Formatear fecha y hora para últimas actualizaciones
  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStateBadgeVariant = (state: AttendanceState) => {
    switch (state) {
      case 'present': return 'bg-green-100 text-green-800 border-green-200'
      case 'absent': return 'bg-red-100 text-red-800 border-red-200'
      case 'justified': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'unjustified': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return state
    }
  }

  const getStateTranslation = (state: AttendanceState) => {
    switch (state) {
      case 'present': return 'Presente'
      case 'absent': return 'Ausente'
      case 'justified': return 'Justificado'
      case 'unjustified': return 'Injustificado'
      default: return state
    }
  }

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

            {/* <div className="flex items-end" >
              <Button variant={'outline'} className="w-full bg-transparent">
                <Download className="h-5 w-5"/>
                Exportar
              </Button>
            </div> */}
          </div>

          {/* Estadisticas rápidas */}
          {attendanceState && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{attendanceState.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{attendanceState.present}</div>
                <div className="text-sm text-muted-foreground">Presesntes</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{attendanceState.absent}</div>
                <div className="text-sm text-muted-foreground">Ausentes</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{attendanceState.justified}</div>
                <div className="text-sm text-muted-foreground">Justificados</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{attendanceState.unjustified}</div>
                <div className="text-sm text-muted-foreground">Injustificados</div>
              </div>
            </div>
          )}
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
            <Badge variant={'secondary'}>{attendanceHistory?.length || 0} registros</Badge>
          </CardTitle>
          <CardDescription>Registros de asistencia en formato de tabal</CardDescription>
            
        </CardHeader>
        <CardContent>
          {attendanceHistory?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron registros con los filtros aplicados
            </div>
          ) : (
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
                  {attendanceHistory && attendanceHistory.length > 0 ? (
                    attendanceHistory.map((record) => (
                      <TableRow key={record?._id}>
                        <TableCell className="font-medium">
                          {record?.student.name} {record?.student.lastName}
                        </TableCell>
                        <TableCell>{record?.student.enrollment}</TableCell>
                        <TableCell>{record?.classCatalog.name}</TableCell>
                        <TableCell>{record?.date !== undefined ? formatDate(record.date) : '-'}</TableCell>
                        <TableCell>
                          <Badge className={getStateBadgeVariant(record?.attendanceState ?? 'absent')}>
                            {getStateTranslation(record?.attendanceState ?? 'absent')}
                          </Badge>
                        </TableCell>
                        <TableCell>{record?.comments || '-'}</TableCell>
                        <TableCell>{record?.createdBy}</TableCell>
                        <TableCell>
                          {record?.updateAt ? formatDate(record.updateAt) : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}