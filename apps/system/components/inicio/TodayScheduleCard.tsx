"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card";
import { Badge } from "@repo/ui/components/shadcn/badge";

interface ClassScheduleItem {
  classId: string;
  className: string;
  subject: string;
  group: string;
  grade: string;
  startTime: string;
  endTime: string;
  classroom: string;
  status: string;
}

interface TodayScheduleCardProps {
  todaySchedule: ClassScheduleItem[];
  todayDateFormatted: string;
  convertTo12HourFormat: (time: string) => string;
}

export function TodayScheduleCard({
  todaySchedule,
  todayDateFormatted,
  convertTo12HourFormat,
}: TodayScheduleCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Horario de Hoy</CardTitle>
        <CardDescription>{todayDateFormatted}</CardDescription>
      </CardHeader>
      <CardContent>
        {todaySchedule.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No tienes clases programadas para hoy
          </div>
        ) : (
          <div className="space-y-3">
            {todaySchedule.map((clase, index) => {
              const borderColor =
                clase.status === "current"
                  ? "border-blue-500 bg-blue-50"
                  : "border";
              const lineColor =
                clase.status === "completed"
                  ? "bg-gray-400"
                  : clase.status === "current"
                  ? "bg-blue-500"
                  : "bg-purple-500";

              return (
                <div
                  key={`${clase.classId}-${index}`}
                  className={`flex items-center gap-4 rounded-lg border p-4 ${borderColor}`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-medium">
                      {convertTo12HourFormat(clase.startTime)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {convertTo12HourFormat(clase.endTime)}
                    </span>
                  </div>
                  <div className={`h-12 w-1 rounded-full ${lineColor}`} />
                  <div className="flex-1">
                    <h4 className="font-semibold">
                      {clase.subject} {clase.grade}
                      {clase.group}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {clase.classroom}
                    </p>
                  </div>
                  {clase.status === "completed" && (
                    <Badge variant="outline">Completada</Badge>
                  )}
                  {clase.status === "current" && (
                    <Badge className="bg-blue-500 text-white">En curso</Badge>
                  )}
                  {clase.status === "pending" && (
                    <Badge variant="secondary">Pendiente</Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

