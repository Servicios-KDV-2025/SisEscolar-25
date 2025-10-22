"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { Settings, School, Bell } from "@repo/ui/icons";
import { User } from "lucide-react";

interface SchoolData {
  name: string;
  description: string;
  shortName: string;
  address: string;
  cctCode: string;
  imgUrl: string;
  _id: string | null;
  status: "active" | "inactive";
}

interface DashboardHeaderProps {
  schoolData: SchoolData;
  getHeaderMessage: string;
  getHeaderSubtitle: React.ReactNode;
  getHeaderDescription: React.ReactNode;
  getHeaderImage: string;
  currentRole: string | null;
}

export function DashboardHeader({
  schoolData,
  getHeaderMessage,
  getHeaderSubtitle,
  getHeaderDescription,
  getHeaderImage,
  currentRole,
}: DashboardHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
      <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
      <div className="relative p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl" />
              {getHeaderImage &&
              getHeaderImage !== "/avatars/default-school.jpg" &&
              getHeaderImage !== "/avatars/default-user.jpg" ? (
                <div className="relative w-[120px] h-[120px] rounded-2xl shadow-lg ring-1 ring-white/20 overflow-hidden">
                  <Image
                    src={getHeaderImage}
                    alt={
                      currentRole === "teacher" || currentRole === "tutor"
                        ? "Foto de perfil"
                        : "Logo de la escuela"
                    }
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="relative w-[100px] h-[100px] bg-primary/10 rounded-2xl shadow-lg ring-1 ring-white/20 flex items-center justify-center">
                  {currentRole === "teacher" || currentRole === "tutor" ? (
                    <User className="w-12 h-12 text-primary/70" />
                  ) : (
                    <School className="w-12 h-12 text-primary/70" />
                  )}
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold tracking-tight">
                  {getHeaderMessage}
                </h1>
                {currentRole !== "teacher" && currentRole !== "tutor" && (
                  <Badge
                    variant={
                      schoolData.status === "active" ? "secondary" : "destructive"
                    }
                    className="text-xs bg-green-600 text-white -mb-2"
                  >
                    {schoolData.status === "active" ? "Activa" : "Inactiva"}
                  </Badge>
                )}
              </div>
              {schoolData.address && (
                <div className="flex items-center gap-2 text-muted-foreground text-lg">
                  {getHeaderSubtitle}
                </div>
              )}
              <p className="text-base text-muted-foreground max-w-2xl">
                {getHeaderDescription}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {currentRole === "teacher" || currentRole === "tutor" ? (
              <Link href={`/perfil`}>
                <Button
                  size="lg"
                  className="bg-primary/10 text-primary gap-2 hover:bg-primary/40 hover:text-primary-foreground cursor-pointer "
                  variant="default"
                >
                  <Bell className="w-4 h-4" />
                  Notificaciones
                </Button>
              </Link>
            ) : (
              <Link href={`/perfil-institucional/`}>
                <Button size="lg" className="gap-2 cursor-pointer">
                  <Settings className="w-4 h-4" />
                  Configuración
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

