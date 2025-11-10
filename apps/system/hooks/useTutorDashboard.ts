import React from "react";
import { useQuery } from "convex/react";
import { api } from "@repo/convex/convex/_generated/api";
import type { Id } from "@repo/convex/convex/_generated/dataModel";

interface UseTutorDashboardProps {
  currentSchool: {
    school: {
      _id: Id<"school">;
    };
  } | null;
  currentUser: {
    _id: Id<"user">;
  } | null;
  currentRole: string | null;
  ciclosEscolares: Array<{
    _id: Id<"schoolCycle">;
    status: string;
  }> | undefined;
}

export function useTutorDashboard({
  currentSchool,
  currentUser,
  currentRole,
  ciclosEscolares,
}: UseTutorDashboardProps) {
  const isTutor = currentRole === "tutor";

  // Get tutor's students
  const tutorStudents = useQuery(
    api.functions.student.getStudentsByTutor,
    currentSchool && currentUser && isTutor
      ? {
          schoolId: currentSchool.school._id as Id<"school">,
          tutorId: currentUser._id as Id<"user">,
        }
      : "skip"
  );

  // Get student enrollments
  const tutorStudentsEnrollments = useQuery(
    api.functions.studentsClasses.getStudentClassesBySchoolWithRoleFilter,
    currentSchool && currentUser && isTutor
      ? {
          schoolId: currentSchool.school._id as Id<"school">,
          canViewAll: false,
          tutorId: currentUser._id as Id<"user">,
        }
      : "skip"
  );

  // Get attendance records
  const tutorAttendance = useQuery(
    api.functions.attendance.getAttendanceWithRoleFilter,
    currentSchool && currentUser && isTutor
      ? {
          schoolId: currentSchool.school._id as Id<"school">,
          canViewAll: false,
          tutorId: currentUser._id as Id<"user">,
        }
      : "skip"
  );

  // Get assignment statistics
  const tutorStudentsAssignmentStats = useQuery(
    api.functions.assignment.getTutorStudentsAssignmentStats,
    currentSchool && currentUser && isTutor
      ? {
          schoolId: currentSchool.school._id as Id<"school">,
          tutorId: currentUser._id as Id<"user">,
        }
      : "skip"
  );

  // Get active cycle
  const activeCycle = React.useMemo(() => {
    return ciclosEscolares?.find((c) => c.status === "active");
  }, [ciclosEscolares]);

  // Get upcoming events
  const upcomingEvents = useQuery(
    api.functions.calendar.getUpcomingEvents,
    currentSchool && activeCycle && isTutor
      ? {
          schoolId: currentSchool.school._id as Id<"school">,
          schoolCycleId: activeCycle._id as Id<"schoolCycle">,
          limit: 5,
        }
      : "skip"
  );

  // Get recent activity
  const recentActivity = useQuery(
    api.functions.grades.getTutorStudentsRecentActivity,
    currentSchool && currentUser && isTutor
      ? {
          schoolId: currentSchool.school._id as Id<"school">,
          tutorId: currentUser._id as Id<"user">,
          limit: 5,
        }
      : "skip"
  );

  // Calculate student statistics
  const studentsWithStats = React.useMemo(() => {
    if (!tutorStudents || tutorStudents.length === 0) return [];
    if (!tutorStudentsEnrollments)
      return tutorStudents.map((student) => ({
        ...student,
        enrollmentsCount: 0,
        averageScore: 0,
        groupName: "Sin grupo",
        gradeName: "Sin grado",
        attendanceRate: 0,
        pendingAssignments: 0,
        studentClassIds: [] as string[],
      }));

    return tutorStudents.map((student) => {
      const studentEnrollments = tutorStudentsEnrollments.filter(
        (enrollment) => enrollment && enrollment.student && enrollment.student._id === student._id
      );

      const enrollmentsWithAverage = studentEnrollments.filter((e) => e && e.averageScore !== undefined && e.averageScore !== null);
      const averageScore =
        enrollmentsWithAverage.length > 0
          ? enrollmentsWithAverage.reduce((sum, e) => {
              return sum + (e && e.averageScore ? e.averageScore : 0);
            }, 0) / enrollmentsWithAverage.length
          : 0;

      const studentClassIds: string[] = [];
      studentEnrollments.forEach((e) => {
        if (e && e._id) {
          studentClassIds.push(e._id);
        }
      });

      let attendanceRate = 0;
      if (tutorAttendance && tutorAttendance.length > 0 && studentClassIds.length > 0) {
        const studentAttendanceRecords = tutorAttendance.filter((attendance) => studentClassIds.includes(attendance.studentClassId));

        if (studentAttendanceRecords.length > 0) {
          const presentCount = studentAttendanceRecords.filter((a) => a.attendanceState === "present" || a.attendanceState === "justified").length;
          attendanceRate = Math.round((presentCount / studentAttendanceRecords.length) * 100);
        }
      }

      let pendingAssignments = 0;
      if (tutorStudentsAssignmentStats && tutorStudentsAssignmentStats.length > 0) {
        const studentStats = tutorStudentsAssignmentStats.find((stat) => stat.studentId === student._id);
        pendingAssignments = studentStats?.pendingAssignments || 0;
      }

      return {
        ...student,
        enrollmentsCount: studentEnrollments.length,
        averageScore: Math.round(averageScore * 10) / 10,
        groupName: studentEnrollments[0]?.classCatalog?.group || "Sin grupo",
        gradeName: studentEnrollments[0]?.classCatalog?.grade || "Sin grado",
        attendanceRate,
        pendingAssignments,
        studentClassIds,
      };
    });
  }, [tutorStudents, tutorStudentsEnrollments, tutorAttendance, tutorStudentsAssignmentStats]);

  // Format upcoming events
  const formattedUpcomingEvents = React.useMemo(() => {
    if (!upcomingEvents || upcomingEvents.length === 0) return [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const formattedEvents = upcomingEvents.map((event) => {
      const eventDate = new Date(event.startDate);
      const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      
      const timeDiff = eventDay.getTime() - today.getTime();
      const daysUntil = Math.round(timeDiff / (1000 * 60 * 60 * 24));


      const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

      return {
        _id: event._id,
        day: eventDate.getDate().toString().padStart(2, "0"),
        month: months[eventDate.getMonth()] || "MES",
        name: event.eventType?.name || "Evento",
        description: event.description || event.eventType?.description || "",
        daysUntil,
        daysUntilText: daysUntil === 0 ? "Hoy" : daysUntil === 1 ? "Mañana" : daysUntil > 1 ? `En ${daysUntil} días` : "Pasado",
      };
    });


    return formattedEvents;
  }, [upcomingEvents]);

  return {
    studentsWithStats,
    recentActivity,
    formattedUpcomingEvents,
  };
}

