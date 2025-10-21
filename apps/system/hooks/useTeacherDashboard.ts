import React from "react";
import { useQuery } from "convex/react";
import { api } from "@repo/convex/convex/_generated/api";
import type { Id } from "@repo/convex/convex/_generated/dataModel";

interface UseTeacherDashboardProps {
  currentSchool: any;
  currentUser: any;
  currentRole: string | null;
  ciclosEscolares: any[] | undefined;
}

export function useTeacherDashboard({
  currentSchool,
  currentUser,
  currentRole,
  ciclosEscolares,
}: UseTeacherDashboardProps) {
  const isTeacher = currentRole === "teacher";

  // Get teacher's classes
  const teacherClasses = useQuery(
    api.functions.classCatalog.getAllClassCatalog,
    currentSchool && currentUser && isTeacher
      ? {
          schoolId: currentSchool.school._id,
          canViewAll: false,
          teacherId: currentUser._id,
        }
      : "skip"
  );

  // Get all student enrollments to count teacher's students
  const teacherStudentsEnrollments = useQuery(
    api.functions.studentsClasses.getStudentClassesBySchool,
    currentSchool && teacherClasses && teacherClasses.length > 0
      ? { schoolId: currentSchool.school._id }
      : "skip"
  );

  // Get assignments progress
  const teacherAssignmentsProgress = useQuery(
    api.functions.assignment.getTeacherAssignmentsProgress,
    currentSchool && currentUser && isTeacher
      ? {
          schoolId: currentSchool.school._id,
          canViewAll: false,
          teacherId: currentUser._id,
        }
      : "skip"
  );

  // Get teacher's schedule
  const teacherSchedule = useQuery(
    api.functions.classSchedule.getClassScheduleWithRoleFilter,
    currentSchool && currentUser && isTeacher
      ? {
          schoolId: currentSchool.school._id,
          canViewAll: false,
          teacherId: currentUser._id,
        }
      : "skip"
  );

  // Calculate active classes count in current cycle
  const activeTeacherClassesCount = React.useMemo(() => {
    if (!teacherClasses || teacherClasses.length === 0) return 0;
    const activeCycle = ciclosEscolares?.find((c) => c.status === "active");
    if (!activeCycle) return 0;
    return teacherClasses.filter((c) => c.schoolCycleId === activeCycle._id).length;
  }, [teacherClasses, ciclosEscolares]);

  // Calculate unique groups in current cycle
  const uniqueTeacherGroups = React.useMemo(() => {
    if (!teacherClasses || teacherClasses.length === 0) return 0;
    const activeCycle = ciclosEscolares?.find((c) => c.status === "active");
    if (!activeCycle) return 0;

    const activeTeacherClasses = teacherClasses.filter((c) => c.schoolCycleId === activeCycle._id);
    const uniqueGroups = new Set(
      activeTeacherClasses.filter((c) => c.group?._id).map((c) => c.group?._id as string)
    );

    return uniqueGroups.size;
  }, [teacherClasses, ciclosEscolares]);

  // Calculate unique students
  const teacherUniqueStudents = React.useMemo(() => {
    if (!teacherClasses || teacherClasses.length === 0) return 0;
    if (!teacherStudentsEnrollments || teacherStudentsEnrollments.length === 0) return 0;

    const activeCycle = ciclosEscolares?.find((c) => c.status === "active");
    if (!activeCycle) return 0;

    const activeTeacherClasses = teacherClasses.filter((c) => c.schoolCycleId === activeCycle._id);
    if (activeTeacherClasses.length === 0) return 0;

    const teacherClassIds = new Set(activeTeacherClasses.map((c) => c._id));

    const teacherEnrollments = teacherStudentsEnrollments.filter(
      (enrollment) => enrollment?.classCatalog?._id && teacherClassIds.has(enrollment.classCatalog._id) && enrollment?.status === "active"
    );

    const uniqueStudents = new Set<string>();
    teacherEnrollments.forEach((enrollment) => {
      if (enrollment?.student?._id) {
        uniqueStudents.add(enrollment.student._id);
      }
    });

    return uniqueStudents.size;
  }, [teacherClasses, teacherStudentsEnrollments, ciclosEscolares]);

  // Calculate pending assignments count
  const pendingAssignmentsCount = React.useMemo(() => {
    if (!teacherAssignmentsProgress || teacherAssignmentsProgress.length === 0) return 0;
    return teacherAssignmentsProgress.reduce((total, assignment) => {
      return total + (assignment.pendingCount || 0);
    }, 0);
  }, [teacherAssignmentsProgress]);

  // Calculate next class
  const nextClass = React.useMemo(() => {
    if (!teacherSchedule || teacherSchedule.length === 0) return null;

    type Schedule = { day: string; startTime: string; endTime: string; status: string };
    type ClassWithSchedule = {
      name: string;
      schedules?: Schedule[];
      subject?: { name?: string };
      group?: { name?: string; grade?: string };
      classroom?: { name?: string };
    };
    type ClassInfo = {
      className: string;
      subject?: string;
      group?: string;
      grade?: string;
      startTime: string;
      endTime: string;
      classroom?: string;
    };

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const dayMap: Record<number, string> = { 1: "lun.", 2: "mar.", 3: "mié.", 4: "jue.", 5: "vie." };
    const currentDayName = dayMap[currentDay];

    const todayClasses = (teacherSchedule as ClassWithSchedule[])
      .filter((classWithSchedule) => classWithSchedule?.schedules && classWithSchedule.schedules.length > 0)
      .flatMap(
        (classWithSchedule) =>
          classWithSchedule.schedules
            ?.filter((schedule) => schedule.day === currentDayName && schedule.status === "active")
            .map((schedule): ClassInfo => ({
              className: classWithSchedule.name,
              subject: classWithSchedule.subject?.name,
              group: classWithSchedule.group?.name,
              grade: classWithSchedule.group?.grade,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              classroom: classWithSchedule.classroom?.name,
            })) || []
      )
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const upcomingClass = todayClasses.find((cls) => cls.startTime > currentTime);

    if (upcomingClass) {
      return upcomingClass;
    }

    let nextDayNum = currentDay + 1;
    while (nextDayNum <= 5) {
      const nextDayName = dayMap[nextDayNum];
      if (!nextDayName) {
        nextDayNum++;
        continue;
      }

      const nextDayClasses = (teacherSchedule as ClassWithSchedule[])
        .flatMap(
          (classWithSchedule) =>
            classWithSchedule.schedules
              ?.filter((schedule) => schedule.day === nextDayName && schedule.status === "active")
              .map((schedule): ClassInfo => ({
                className: classWithSchedule.name,
                subject: classWithSchedule.subject?.name,
                group: classWithSchedule.group?.name,
                grade: classWithSchedule.group?.grade,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                classroom: classWithSchedule.classroom?.name,
              })) || []
        )
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      if (nextDayClasses.length > 0) {
        return nextDayClasses[0];
      }

      nextDayNum++;
    }

    if (currentDay >= 5) {
      const mondayClasses = (teacherSchedule as ClassWithSchedule[])
        .flatMap(
          (classWithSchedule) =>
            classWithSchedule.schedules
              ?.filter((schedule) => schedule.day === "lun." && schedule.status === "active")
              .map((schedule): ClassInfo => ({
                className: classWithSchedule.name,
                subject: classWithSchedule.subject?.name,
                group: classWithSchedule.group?.name,
                grade: classWithSchedule.group?.grade,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                classroom: classWithSchedule.classroom?.name,
              })) || []
        )
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      return mondayClasses.length > 0 ? mondayClasses[0] : null;
    }

    return null;
  }, [teacherSchedule]);

  // Calculate today's schedule
  const todaySchedule = React.useMemo(() => {
    if (!teacherSchedule || teacherSchedule.length === 0) return [];

    type Schedule = { day: string; startTime: string; endTime: string; status: string };
    type ClassWithSchedule = {
      _id?: string;
      name: string;
      schedules?: Schedule[];
      subject?: { name?: string };
      group?: { name?: string; grade?: string };
      classroom?: { name?: string };
    };

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const dayMap: Record<number, string> = { 1: "lun.", 2: "mar.", 3: "mié.", 4: "jue.", 5: "vie." };
    const currentDayName = dayMap[currentDay];
    if (!currentDayName) return [];

    const classes = (teacherSchedule as ClassWithSchedule[])
      .filter((classWithSchedule) => classWithSchedule?.schedules && classWithSchedule.schedules.length > 0)
      .flatMap((classWithSchedule) =>
        classWithSchedule.schedules
          ?.filter((schedule) => schedule.day === currentDayName && schedule.status === "active")
          .map((schedule) => ({
            classId: classWithSchedule._id || "",
            className: classWithSchedule.name,
            subject: classWithSchedule.subject?.name || "Sin materia",
            group: classWithSchedule.group?.name || "",
            grade: classWithSchedule.group?.grade || "",
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            classroom: classWithSchedule.classroom?.name || "Sin salón",
            status:
              currentTime < schedule.startTime
                ? "pending"
                : currentTime >= schedule.startTime && currentTime < schedule.endTime
                ? "current"
                : "completed",
          })) || []
      )
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    return classes;
  }, [teacherSchedule]);

  // Format today's date
  const todayDateFormatted = React.useMemo(() => {
    const now = new Date();
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    return `${days[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]} ${now.getFullYear()}`;
  }, []);

  return {
    activeTeacherClassesCount,
    uniqueTeacherGroups,
    teacherUniqueStudents,
    pendingAssignmentsCount,
    nextClass,
    todaySchedule,
    todayDateFormatted,
  };
}

