"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card";
import { TrendingUp, FileText, Calendar } from "@repo/ui/icons";

type GradeActivity = {
  type: 'grade';
  _id: string;
  studentName: string;
  subject: string;
  assignmentName: string;
  score: number;
  maxScore: number;
  createdAt: number;
};

type AssignmentActivity = {
  type: 'assignment';
  _id: string;
  subject: string;
  assignmentName: string;
  dueDate: number;
  createdAt: number;
};

type EventActivity = {
  type: 'event';
  _id: string;
  eventName: string;
  description: string;
  eventDate: number;
  createdAt: number;
};

type Activity = GradeActivity | AssignmentActivity | EventActivity;

interface RecentActivityCardProps {
  activities: (Activity | null)[] | undefined;
  getRelativeTime: (timestamp: number) => string;
}

export function RecentActivityCard({ activities, getRelativeTime }: RecentActivityCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
        <CardDescription>Últimas actualizaciones</CardDescription>
      </CardHeader>
      <CardContent>
        {!activities || activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay actividad reciente
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, idx) => {
              if (!activity) return null;

              const isGrade = activity.type === 'grade';
              const isEvent = activity.type === 'event';

              const iconBg = isGrade
                ? 'bg-green-100'
                : isEvent
                ? 'bg-blue-100'
                : 'bg-orange-100';

              const iconColor = isGrade
                ? 'text-green-600'
                : isEvent
                ? 'text-blue-600'
                : 'text-orange-600';

              const Icon = isGrade ? TrendingUp : isEvent ? Calendar : FileText;

              const act = activity as GradeActivity | AssignmentActivity | EventActivity;

              return (
                <div key={`${act._id}-${idx}`} className="flex items-start gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${iconBg}`}>
                    <Icon className={`h-4 w-4 ${iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {isGrade
                        ? 'Nueva calificación registrada'
                        : isEvent
                        ? 'Evento programado'
                        : 'Asignación publicada'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isGrade
                        ? `${(act as GradeActivity).studentName} - ${(act as GradeActivity).subject}: ${(act as GradeActivity).score}/${(act as GradeActivity).maxScore}`
                        : isEvent
                        ? `${(act as EventActivity).eventName}${(act as EventActivity).description ? ': ' + (act as EventActivity).description : ''}`
                        : `${(act as AssignmentActivity).subject}: ${(act as AssignmentActivity).assignmentName}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getRelativeTime(act.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

