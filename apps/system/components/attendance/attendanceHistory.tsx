"use client";

import { api } from "@repo/convex/convex/_generated/api";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/shadcn/table";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import {
  BookOpen,
  CheckCircle,
  FileCheck,
  FileX,
  Filter,
  X,
  XCircle,
  Loader2,
  Save,
  MessageCircleMore,
  MessageCircleDashed,
} from "@repo/ui/icons";
import { useQuery, useMutation } from "convex/react";
import { UserRole } from 'hooks/usePermissions';
import { useMemo, useState, useEffect } from "react";
import { toast } from "@repo/ui/sonner";
import { ClassCatalog } from 'stores/classCatalogStore';
import { User } from 'stores/userStore';
import { useCrudToastMessages } from "../../hooks/useCrudToastMessages";

type AttendanceRecord = NonNullable<ReturnType<
  typeof useQuery<typeof api.functions.attendance.getAttendanceHistory>
>>[0];

type AttendanceState = "present" | "absent" | "justified" | "unjustified";

const CharacterCounter = ({ current, max, }: {
  current: number;
  max: number;
}) => (
  <div className="text-xs mt-1 text-right text-gray-500">
    {current}/{max} caracteres
  </div>
);

interface CommentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord | null;
  onSave: (recordId: Id<"attendance">, newComment: string) => void;
  isSaving: boolean;
  canUpdateAttendance: boolean;
  currentRole: UserRole | null
}

function CommentEditModal({
  isOpen,
  onClose,
  record,
  onSave,
  isSaving,
  canUpdateAttendance,
  currentRole,
}: CommentEditModalProps) {
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (record) setComment(record.comments || "");
  }, [record]);

  const handleSave = () => {
    if (!record || isSaving) return;
    onSave(record._id, comment);
  };

  if (!record) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Comentario</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="comment" className="text-muted-foreground">
            Comentario para:{" "}
            <span className="font-semibold text-primary">
              {record.student.name} {record.student.lastName}
            </span>
          </Label>
          <Textarea
            id="comment"
            value={comment}
            maxLength={300}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Añade una nota..."
            rows={5}
            className="mt-2"
            disabled={!canUpdateAttendance}
          />
          {(currentRole === 'tutor' || currentRole === 'auditor') ? (<></>) : <CharacterCounter current={comment.length} max={300} />
          }
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {canUpdateAttendance ? 'Cancelar' : 'Cerrar'}
          </Button>
          {canUpdateAttendance &&
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar
            </Button>
          }
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AttendanceFilters {
  classCatalogId?: Id<"classCatalog">;
  attendanceState?: AttendanceState;
  specificDate?: number;
}

type CurrentSchoolType = {
  userSchoolId: Id<"userSchool">;
  school: {
    _id: Id<"school">;
    _creationTime: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    imgUrl: string;
    status: "active" | "inactive";
    createdAt: number;
    updatedAt: number;
    subdomain: string;
    shortName: string;
    cctCode: string;
    description: string;
  };
  role: ("superadmin" | "admin" | "auditor" | "teacher" | "tutor")[];
  status: "active" | "inactive";
  department: "secretary" | "direction" | "schoolControl" | "technology" | undefined;
  createdAt: number;
  updatedAt: number;
} | null

type AttendanceHistoryProps = {
  currentUser: User | null;
  currentSchool: CurrentSchoolType;
  classCatalogs: ClassCatalog[] | undefined;
  isLoading: boolean;
  currentRole: UserRole | null
  canUpdateAttendance: boolean
}

export default function AttendanceHistory({
  currentUser,
  currentSchool,
  classCatalogs,
  isLoading,
  currentRole,
  canUpdateAttendance
}: AttendanceHistoryProps) {
  //   Mensajes de toast personalizados
  const toastMessages = useCrudToastMessages("Asistencia");

  const [filterClass, setFilterClass] = useState("all");
  const [filterState, setFilterState] = useState("all");
  const [specificDate, setSpecificDate] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(
    null
  );
  const [pendingChanges, setPendingChanges] = useState<Set<Id<"attendance">>>(
    new Set()
  );

  // Mutaciones de Convex
  const updateState = useMutation(
    api.functions.attendance.updateAttendanceState
  );
  const updateComment = useMutation(
    api.functions.attendance.updateAttendanceComment
  );

  // Preparar filtros para el query
  const filters: AttendanceFilters | undefined = useMemo(() => {
    const filters: AttendanceFilters = {};

    if (filterClass !== "all")
      filters.classCatalogId = filterClass as Id<"classCatalog">;
    if (filterState !== "all")
      filters.attendanceState = filterState as AttendanceState;
    if (specificDate)
      filters.specificDate = Math.floor(
        new Date(specificDate).getTime() / 1000
      );

    return Object.keys(filters).length > 0 ? filters : undefined;
  }, [filterClass, filterState, specificDate]);

  // Obtener hisotrial se asistencias
  const attHistory = useQuery(
    api.functions.attendance.getAttendanceHistory,
    currentSchool
      ? {
        schoolId: currentSchool.school._id,
        filters: filters,
      }
      : "skip"
  );

  const attendanceHistory = useMemo(() => {
    if (!attHistory) {
      return [];
    }

    return [...attHistory].sort((a, b) => {
      // Medidas de seguridad para evitar errores si un registro es nulo
      if (!a) return 1;
      if (!b) return -1;

      // --- Nivel 1: Ordenar por fecha (de más reciente a más antigua) ---
      const dateComparison = b.date - a.date;

      // Si las fechas son diferentes, ese es nuestro resultado y no necesitamos seguir.
      if (dateComparison !== 0) {
        return dateComparison;
      }

      // --- Nivel 2: Si las fechas son iguales, ordenar por nombre (A-Z) ---
      const nameA = a.student?.name || '';
      const nameB = b.student?.name || '';

      return nameA.localeCompare(nameB);
    });
  }, [attHistory]);

  // En tu JSX, asegúrate de usar 'sortedAttHistory' para renderizar la tabla.

  // Preparar filtros para estadisticas
  const statsFilters = useMemo(
    () => ({
      classCatalogId:
        filterClass !== "all" ? (filterClass as Id<"classCatalog">) : undefined,
      specificDate: specificDate
        ? Math.floor(new Date(specificDate).getTime() / 1000)
        : undefined,
    }),
    [filterClass, specificDate]
  );

  // Obtener estadisitcas
  const attendanceStats = useQuery(
    api.functions.attendance.getAttendanceStatistics,
    currentSchool
      ? {
        schoolId: currentSchool.school._id,
        ...statsFilters,
      }
      : "skip"
  );
  const handleStateChange = async (
    recordId: Id<"attendance">,
    newState: AttendanceState
  ) => {
    if (!currentUser) return;
    setPendingChanges((prev) => new Set(prev).add(recordId));

    try {
      await updateState({ recordId, newState, updatedBy: currentUser._id });
    
      toast.success(
        <span style={{ color: '#16a34a', fontWeight: 600 }}>
          {toastMessages.editSuccess}
        </span>,
        {
          className: 'bg-white border border-green-200',
          unstyled: false,
        }
      );
    } catch (error) {
    
      toast.error(
        <span style={{ color: '#dc2626' }}>
          {toastMessages.editError}
        </span>,
        {
          className: 'bg-white border border-red-200',
          unstyled: false,
          description: error instanceof Error ? error.message : undefined
        }
      );
    } finally {
      setPendingChanges((prev) => {
        const next = new Set(prev);
        next.delete(recordId);
        return next;
      });
    }
  };

  const handleCommentClick = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleSaveComment = async (
    recordId: Id<"attendance">,
    newComment: string
  ) => {
    if (!currentUser) return;
    setPendingChanges((prev) => new Set(prev).add(recordId));
    try {
      await updateComment({ recordId, newComment, updatedBy: currentUser._id });
    
      toast.success(
        <span style={{ color: '#16a34a', fontWeight: 600 }}>
          Comentario guardado exitosamente
        </span>,
        {
          className: 'bg-white border border-green-200',
          unstyled: false,
        }
      );
      setIsModalOpen(false);
    } catch (error) {
   
      toast.error(
        <span style={{ color: '#dc2626' }}>
          Error al guardar el comentario
        </span>,
        {
          className: 'bg-white border border-red-200',
          unstyled: false,
          description: error instanceof Error ? error.message : undefined
        }
      );
    } finally {
      setPendingChanges((prev) => {
        const next = new Set(prev);
        next.delete(recordId);
        return next;
      });
    }
  };

  // Formatear fecha para mostrar
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "UTC",
    });
  };

  // Formatear fecha y hora para últimas actualizaciones
  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Limpiar filtro de fecha
  const clearDateFilter = () => {
    setSpecificDate("");
  };

  const getAttendanceStatusStyles = (
    state: AttendanceState,
    options: { textOnly?: boolean } = {} // Opción para pedir solo el texto
  ) => {
    const { textOnly = true } = options;

    switch (state) {
      case "present":
        return textOnly
          ? "text-green-800"
          : "bg-green-100 text-green-800";
      case "absent":
        return textOnly
          ? "text-red-800"
          : "bg-red-100 text-red-800 border-red-200";
      case "justified":
        return textOnly
          ? "text-yellow-800"
          : "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "unjustified":
        return textOnly
          ? "text-orange-800"
          : "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return textOnly ? "text-gray-800" : "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return <div className="text-center py-10">Cargando escuala</div>;
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {(currentRole !== 'tutor' && attendanceStats) && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 space-x-5">
          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total
              </CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold">{attendanceStats.total}</div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Presentes
              </CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <CheckCircle className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold">
                {attendanceStats.present}
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ausentes
              </CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <XCircle className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold">{attendanceStats.absent}</div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Justificados
              </CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <FileCheck className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold">
                {attendanceStats.justified}
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Injustificados
              </CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <FileX className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold">
                {attendanceStats.unjustified}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtro de busqueda
          </CardTitle>
          <CardDescription>
            Filtra los registros de asistencia por diferentes criterios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Clase</Label>
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas las clases" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las clases</SelectItem>
                  {classCatalogs?.map((cc) => (
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
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los estados" />
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
                Fecha específica
              </Label>
              <div className="relative">
                <Input
                  id="date-to"
                  type="date"
                  value={specificDate}
                  onChange={(e) => setSpecificDate(e.target.value)}
                />
                {specificDate && (
                  <Button
                    variant="ghost"
                    size={"icon"}
                    className="absolute right-1 top-1 h-6 w-6"
                    onClick={clearDateFilter}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-bold">
              Historial de Asistencia
            </span>
            <Badge variant={"secondary"}>
              {attendanceHistory?.length || 0} registros
            </Badge>
          </CardTitle>
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
                  {attendanceHistory?.map((record) => {
                    const isRecordPending = pendingChanges.has(record._id);

                    return (
                      <TableRow
                        key={record._id}
                        className={isRecordPending ? "opacity-50" : ""}
                      >
                        <TableCell className="font-medium">
                          {record.student.name} {record.student.lastName}
                        </TableCell>
                        <TableCell>{record.student.enrollment}</TableCell>
                        <TableCell>{record.classCatalog.name}</TableCell>
                        <TableCell>{formatDate(record.date)}</TableCell>
                        <TableCell className="w-[150px]">
                          {/* Si la fila se está guardando, mostramos el indicador de carga */}
                          {isRecordPending ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />{" "}
                              Guardando...
                            </div>
                          ) : (
                            <div>
                              <Select
                                value={record.attendanceState}
                                onValueChange={(value: AttendanceState) =>
                                  handleStateChange(record._id, value)
                                }
                                disabled={!canUpdateAttendance}
                              >
                                <SelectTrigger
                                  // Estas clases hacen que el botón se vea como una Badge
                                  className={`rounded-full ${getAttendanceStatusStyles(record.attendanceState)}`}
                                  onKeyDown={(e) => {
                                    if (e.key === "Escape") {
                                      // Cierra el menú si se presiona Escape
                                      (e.target as HTMLElement).blur();
                                    }
                                  }}
                                >
                                  {/* Muestra el valor seleccionado */}
                                  <SelectValue />
                                </SelectTrigger>

                                <SelectContent position="popper">
                                  <SelectItem value="present">
                                    Presente
                                  </SelectItem>
                                  <SelectItem value="absent">
                                    Ausente
                                  </SelectItem>
                                  <SelectItem value="justified">
                                    Justificado
                                  </SelectItem>
                                  <SelectItem value="unjustified">
                                    Injustificado
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="flex justify-center">
                          {record.comments ? (
                            <div>
                              <MessageCircleMore
                                onClick={() => handleCommentClick(record)}
                                className="h-7.5 w-7.5 rounded-lg justify-end p-0.5 cursor-pointer hover:bg-gray-400 hover:text-white transition-colors"
                              />
                            </div>
                          ) : (
                            <div>
                              <MessageCircleDashed
                                onClick={() => handleCommentClick(record)}
                                className="h-7.5 w-7.5 rounded-lg justify-end p-0.5 cursor-pointer hover:bg-gray-400 hover:text-white transition-colors"
                              />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{record.createdBy}</TableCell>
                        <TableCell>
                          {record.updateAt
                            ? formatDateTime(record.updateAt)
                            : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <CommentEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        record={selectedRecord}
        onSave={handleSaveComment}
        isSaving={
          selectedRecord ? pendingChanges.has(selectedRecord._id) : false
        }
        canUpdateAttendance={canUpdateAttendance}
        currentRole={currentRole}
      />
    </div>
  );
}
