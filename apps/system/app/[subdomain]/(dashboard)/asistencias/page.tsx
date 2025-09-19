'use client';

import React, { useState } from "react";
import AttendanceManager from "components/attendance/attendanceManager";
import AttendanceHistory from "components/attendance/attendanceHisotry";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@repo/ui/components/shadcn/tabs";
import { ClipboardList } from "@repo/ui/icons";

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState('register');

  return (
    <div className="container mx-auto py-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border mb-4">
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList  className="w-full bg-muted/50 p-1 rounded-xl border">
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
          <AttendanceManager />
        </TabsContent>

        <TabsContent value="history">
          <AttendanceHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};
