"use client";

import { useUser } from "@clerk/nextjs";
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
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { useClassCatalog } from "stores/classCatalogStore";
import { useCurrentSchool } from "stores/userSchoolsStore";
import { useUserWithConvex } from "stores/userStore";

type AttendanceRecord = NonNullable<
  ReturnType<
    typeof useQuery<typeof api.functions.attendance.getAttendanceHistory>
  >
>[0];
type AttendanceState = "present" | "absent" | "justified" | "unjustified";

const CharacterCounter = ({
  current,
  max,
}: {
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
}

function CommentEditModal({
  isOpen,
  onClose,
  record,
  onSave,
  isSaving,
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
          />
          <CharacterCounter current={comment.length} max={300} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar
          </Button>
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

export default function AttendanceHistory() {
  const { user: clerkUser } = useUser();
  const { currentUser } = useUserWithConvex(clerkUser?.id);
  const { currentSchool, isLoading } = useCurrentSchool(currentUser?._id);
  const { classCatalogs } = useClassCatalog(currentSchool?.school._id);

  const [filterClass, setFilterClass] = useState("all");
  const [filterState, setFilterState] = useState("all");
  const [specificDate, setSpecificDate] = useState("");

  const [editingRowId, setEditingRowId] = useState<Id<"attendance"> | null>(
    null
  );
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
  const attendanceHistory = useQuery(
    api.functions.attendance.getAttendanceHistory,
    currentSchool
      ? {
          schoolId: currentSchool.school._id,
          filters: filters,
        }
      : "skip"
  );

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
    setEditingRowId(null);
    try {
      await updateState({ recordId, newState, updatedBy: currentUser._id });
      toast.success("Estado actualizado.");
    } catch (error) {
      toast.error("Error al cambiar el estado. " + error);
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
      toast.success("Comentario guardado.");
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Error al guardar el comentario. " + error);
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

  const getStateBadgeVariant = (state: AttendanceState) => {
    switch (state) {
      case "present":
        return "bg-green-100 text-green-800 border-green-200";
      case "absent":
        return "bg-red-100 text-red-800 border-red-200";
      case "justified":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "unjustified":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return state;
    }
  };

  const getStateTranslation = (state: AttendanceState) => {
    switch (state) {
      case "present":
        return "Presente";
      case "absent":
        return "Ausente";
      case "justified":
        return "Justificado";
      case "unjustified":
        return "Injustificado";
      default:
        return state;
    }
  };

  if (isLoading) {
    return <div className="text-center py-10">Cargando escuala</div>;
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {attendanceStats && (
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
                      <TableRow key={record._id} className={isRecordPending ? "opacity-50" : ""}>
                        <TableCell className="font-medium">{record.student.name} {record.student.lastName}</TableCell>
                        <TableCell>{record.student.enrollment}</TableCell>
                        <TableCell>{record.classCatalog.name}</TableCell>
                        <TableCell>{formatDate(record.date)}</TableCell>
                        <TableCell className="w-[150px]">
                          {/* ✅ CORRECCIÓN: Se usa la nueva variable 'isRecordPending' */}
                          {isRecordPending ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                            </div>
                          ) : editingRowId === record._id ? (
<Select
  // 1. Usamos 'value' para que el componente sea controlado
  value={record.attendanceState}
  onValueChange={(value: AttendanceState) =>
    handleStateChange(record._id, value)
  }
  // 2. Usamos 'onOpenChange' para salir del modo de edición de forma segura
  onOpenChange={(isOpen) => {
    if (!isOpen) {
      setEditingRowId(null);
    }
  }}
>
  <SelectTrigger autoFocus className="w-full">
    <SelectValue placeholder="Seleccionar..." />
  </SelectTrigger>
  <SelectContent position="popper">
    <SelectItem value="present">Presente</SelectItem>
    <SelectItem value="absent">Ausente</SelectItem>
    <SelectItem value="justified">Justificado</SelectItem>
    <SelectItem value="unjustified">Injustificado</SelectItem>
  </SelectContent>
</Select>
                          ) : (
                            <Badge
                              className={`cursor-pointer hover:ring-2 hover:ring-offset-2 ${getStateBadgeVariant(record.attendanceState)}`}
                              onClick={() => !isRecordPending && setEditingRowId(record._id)}
                            >
                              {getStateTranslation(record.attendanceState)}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="flex justify-center">
                          {record.comments ? (
                            <div>
                              <MessageCircleMore onClick={() => handleCommentClick(record)} 
                              className="h-7.5 w-7.5 rounded-lg justify-end p-0.5 cursor-pointer hover:bg-gray-400 hover:text-white transition-colors"
                              />
                            </div>
                          ) : (
                            <div><MessageCircleDashed onClick={() => handleCommentClick(record)} className="h-7.5 w-7.5 rounded-lg justify-end p-0.5 cursor-pointer hover:bg-gray-400 hover:text-white transition-colors"/></div>
                          )}
                        </TableCell>
                        <TableCell>{record.createdBy}</TableCell>
                        <TableCell>{record.updateAt ? formatDateTime(record.updateAt) : "-"}</TableCell>
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
      />
    </div>
  );
}
