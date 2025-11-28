'use client';

import { useEffect, useState } from "react";
import AttendanceManager from "components/attendance/attendanceManager";
import AttendanceHistory from "components/attendance/attendanceHistory";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@repo/ui/components/shadcn/tabs";
import { ClipboardList } from "@repo/ui/icons";
import { useUser } from '@clerk/nextjs';
import { useUserWithConvex } from 'stores/userStore';
import { useCurrentSchool } from 'stores/userSchoolsStore';
import { ClassCatalog, useClassCatalogWithPermissions } from 'stores/classCatalogStore';
import { usePermissions } from 'hooks/usePermissions';
import { GeneralDashboardSkeleton } from 'components/skeletons/GeneralDashboardSkeleton';

export default function AttendancePage() {
  const { user: clerkUser } = useUser()
  const { currentUser, isLoading: userLoading } = useUserWithConvex(clerkUser?.id)
  const { currentSchool, isLoading: schoolLoading } = useCurrentSchool(currentUser?._id)
  const [clasCat, setClasCat] = useState<ClassCatalog[]>();
  const [clasCatLoading, setClasCatLoading] = useState(false);

  const {
    getStudentFilters,
    canCreateAttendance,
    canUpdateAttendance,
    currentRole,
    isLoading: permissionsLoading,
  } = usePermissions(currentSchool?.school._id);

  const { classCatalogs, isLoading: classCatalogLoading } = useClassCatalogWithPermissions(
    currentSchool?.school._id,
    getStudentFilters
  );

  useEffect(() => {
    setClasCatLoading(true);
    if (classCatalogs) {
      setClasCat(classCatalogs);
      setClasCatLoading(false);
    }
    setClasCatLoading(false);
  }, [currentRole, classCatalogs])

  const [activeTab, setActiveTab] = useState('register');

  const isLoading =
    userLoading ||
    schoolLoading ||
    permissionsLoading ||
    classCatalogLoading;

  useEffect(() => {
    if (currentRole === 'tutor' || currentRole === 'auditor') {
      setActiveTab('history');
    }
  }, [currentRole]);

  if (isLoading) {
    return <GeneralDashboardSkeleton nc={0} />;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border mb-6">
        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <ClipboardList className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">Asistencias</h1>
                  <p className="text-lg text-muted-foreground">
                    Registra y consulta la asistencia de los estudiantes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        {(canCreateAttendance) ?
          (<>
            <TabsList className="w-full bg-muted/50 p-1 rounded-xl border">
              <TabsTrigger
                value="register"
              >
                <span className="font-semibold">Registrar Asistencia</span>
              </TabsTrigger>
              <TabsTrigger
                value="history"
              >
                <span className="font-semibold">Historial</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="register">
              <AttendanceManager
                currentUser={currentUser}
                currentSchool={currentSchool}
                classCatalogs={clasCat}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="history">
              <AttendanceHistory
                currentUser={currentUser}
                currentSchool={currentSchool}
                classCatalogs={clasCat}
                isLoading={isLoading}
                currentRole={currentRole}
                canUpdateAttendance={canUpdateAttendance}
              />
            </TabsContent>
          </>) : (
            <TabsContent value="history">
              <AttendanceHistory
                currentUser={currentUser}
                currentSchool={currentSchool}
                classCatalogs={clasCat}
                isLoading={isLoading}
                currentRole={currentRole}
                canUpdateAttendance={canUpdateAttendance}
              />
            </TabsContent>
          )
        }
      </Tabs>
    </div >
  );
};
