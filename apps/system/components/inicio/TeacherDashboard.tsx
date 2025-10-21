"use client";

import { TeacherStatsCards } from "./TeacherStatsCards";
import { TeacherQuickActions } from "./TeacherQuickActions";
import { TodayScheduleCard } from "./TodayScheduleCard";

interface NextClass {
  startTime: string;
  subject?: string;
  grade?: string;
  group?: string;
}

type NextClassType = NextClass | null | undefined;

interface ClassScheduleItem {
  classId: string;
  className: string;
  subject: string;
  group: string;
  grade: string;
  startTime: string;
  endTime: string;
  classroom: string;
  status: string; // Changed from 'pending' | 'current' | 'completed' to string for flexibility
}

interface TeacherDashboardProps {
  activeClassesCount: number;
  uniqueGroupsCount: number;
  uniqueStudentsCount: number;
  pendingAssignmentsCount: number;
  nextClass: NextClassType;
  todaySchedule: ClassScheduleItem[];
  todayDateFormatted: string;
  convertTo12HourFormat: (time: string) => string;
}

export function TeacherDashboard({
  activeClassesCount,
  uniqueGroupsCount,
  uniqueStudentsCount,
  pendingAssignmentsCount,
  nextClass,
  todaySchedule,
  todayDateFormatted,
  convertTo12HourFormat,
}: TeacherDashboardProps) {
  return (
    <>
      {/* Stats Cards */}
      <TeacherStatsCards
        activeClassesCount={activeClassesCount}
        uniqueGroupsCount={uniqueGroupsCount}
        uniqueStudentsCount={uniqueStudentsCount}
        pendingAssignmentsCount={pendingAssignmentsCount}
        nextClass={nextClass}
        convertTo12HourFormat={convertTo12HourFormat}
      />

      {/* Quick Actions */}
      <TeacherQuickActions />

      {/* Today's Schedule */}
      <TodayScheduleCard
        todaySchedule={todaySchedule}
        todayDateFormatted={todayDateFormatted}
        convertTo12HourFormat={convertTo12HourFormat}
      />
    </>
  );
}

