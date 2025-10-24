"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card";
import { BookOpen, Users, ClipboardCheck, Clock } from "@repo/ui/icons";

interface TeacherStatsCardsProps {
  activeClassesCount: number;
  uniqueGroupsCount: number;
  uniqueStudentsCount: number;
  pendingAssignmentsCount: number;
  nextClass: {
    startTime: string;
    subject?: string;
    grade?: string;
    group?: string;
  } | null | undefined;
  convertTo12HourFormat: (time: string) => string;
}

export function TeacherStatsCards({
  activeClassesCount,
  uniqueGroupsCount,
  uniqueStudentsCount,
  pendingAssignmentsCount,
  nextClass,
  convertTo12HourFormat,
}: TeacherStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Mis Clases
          </CardTitle>
          <BookOpen className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{activeClassesCount}</div>
          <p className="text-xs text-muted-foreground">
            {uniqueGroupsCount} grupo{uniqueGroupsCount !== 1 ? "s" : ""} activo
            {uniqueGroupsCount !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Estudiantes
          </CardTitle>
          <Users className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{uniqueStudentsCount || 0}</div>
          <p className="text-xs text-muted-foreground">En todos los grupos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Asignaciones Pendientes
          </CardTitle>
          <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{pendingAssignmentsCount}</div>
          <p className="text-xs text-muted-foreground">Por calificar</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Próxima Clase
          </CardTitle>
          <Clock className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {nextClass ? convertTo12HourFormat(nextClass.startTime) : "Sin clases"}
          </div>
          <p className="text-xs text-muted-foreground">
            {nextClass
              ? `${nextClass.subject} ${nextClass.grade}${nextClass.group}`
              : "No hay clases programadas"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

