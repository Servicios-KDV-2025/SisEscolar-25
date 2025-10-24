"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card";
import { Badge } from "@repo/ui/components/shadcn/badge";

interface StudentWithStats {
  _id: string;
  name: string;
  lastName?: string;
  enrollment: string;
  status: string;
  enrollmentsCount: number;
  averageScore: number;
  attendanceRate: number;
  pendingAssignments: number;
  gradeName: string;
  groupName: string;
}

interface StudentCardProps {
  student: StudentWithStats;
  borderColor: string;
  badgeColor: string;
}

export function StudentCard({ student, borderColor, badgeColor }: StudentCardProps) {
  return (
    <Card className={`border-l-4 ${borderColor}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>
              {student.name} {student.lastName || ""}
            </CardTitle>
            <CardDescription>
              {student.enrollment} • {student.gradeName} - {student.groupName}
            </CardDescription>
          </div>
          <Badge className={`${badgeColor} text-white`}>
            {student.status === "active" ? "Activo" : "Inactivo"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p
              className={`text-2xl font-bold ${
                student.averageScore >= 6 ? "text-green-600" : "text-red-600"
              }`}
            >
              {student.averageScore > 0 ? student.averageScore.toFixed(1) : "N/A"}
            </p>
            <p className="text-xs text-muted-foreground">Promedio</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {student.attendanceRate > 0 ? `${student.attendanceRate}%` : "N/A"}
            </p>
            <p className="text-xs text-muted-foreground">Asistencia</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{student.enrollmentsCount}</p>
            <p className="text-xs text-muted-foreground">Materias</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{student.pendingAssignments}</p>
            <p className="text-xs text-muted-foreground">Asignaciones Pendientes</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

