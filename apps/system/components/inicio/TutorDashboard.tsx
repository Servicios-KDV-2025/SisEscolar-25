"use client";

import { StudentCard } from "./StudentCard";
import { RecentActivityCard } from "./RecentActivityCard";
import { UpcomingEventsCard } from "./UpcomingEventsCard";
import { TutorQuickActions } from "./TutorQuickActions";

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

interface FormattedEvent {
  _id: string;
  day: string;
  month: string;
  name: string;
  description: string;
  daysUntil: number;
  daysUntilText: string;
}

type Activity = any; // Los tipos ya están definidos en RecentActivityCard

interface TutorDashboardProps {
  studentsWithStats: StudentWithStats[];
  recentActivity: Activity[] | undefined;
  formattedUpcomingEvents: FormattedEvent[];
  getRelativeTime: (timestamp: number) => string;
}

export function TutorDashboard({
  studentsWithStats,
  recentActivity,
  formattedUpcomingEvents,
  getRelativeTime,
}: TutorDashboardProps) {
  const borderColors = [
    'border-l-blue-500',
    'border-l-purple-500',
    'border-l-green-500',
    'border-l-orange-500',
    'border-l-pink-500',
    'border-l-cyan-500',
  ];

  const badgeColors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-green-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-cyan-500',
  ];

  return (
    <div className="w-full space-y-6">
      {/* Children Cards */}
      {studentsWithStats.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            No tienes estudiantes asignados
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {studentsWithStats.map((student, index) => {
            const borderColor = borderColors[index % borderColors.length];
            const badgeColor = badgeColors[index % badgeColors.length];

            return (
              <StudentCard
                key={student._id}
                student={student}
                borderColor={borderColor}
                badgeColor={badgeColor}
              />
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <TutorQuickActions />

      {/* Recent Activity and Upcoming Events */}
      <div className="grid gap-4 md:grid-cols-2">
        <RecentActivityCard
          activities={recentActivity}
          getRelativeTime={getRelativeTime}
        />
        <UpcomingEventsCard events={formattedUpcomingEvents} />
      </div>
    </div>
  );
}

