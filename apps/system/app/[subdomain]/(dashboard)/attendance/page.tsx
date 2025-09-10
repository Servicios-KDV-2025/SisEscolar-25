'use client';

import React, { useState } from "react";
import AttendanceManager from "components/attendance/attendanceManager";
import AttendanceHistory from "components/attendance/attendanceHisotry";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@repo/ui/components/shadcn/tabs";


export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState('register');

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gestión de Asistencia</h1>
        <p className="text-muted-foreground">
          Registra y consulta la asistencia de los estudiantes
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="register">Registrar Asistencia</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
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
