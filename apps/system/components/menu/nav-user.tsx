"use client";

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  User,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@repo/ui/components/shadcn/dropdown-menu";
import { Button } from "@repo/ui/components/shadcn/button";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Gem } from "@repo/ui/icons";
import { useClerk } from "@clerk/nextjs";
import { useActiveRole } from "../../hooks/useActiveRole";

type UserRole = 'superadmin' | 'admin' | 'auditor' | 'teacher' | 'tutor';

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { signOut } = useClerk();
  const { activeRole, availableRoles, setActiveRole } = useActiveRole();

  // Debug: verificar qué roles están disponibles
  console.log("NavUser - availableRoles:", availableRoles);
  console.log("NavUser - activeRole:", activeRole);
  console.log(
    "NavUser - should show role change:",
    availableRoles && availableRoles.length > 1
  );

  // Si no hay roles disponibles, mostrar un estado por defecto
  if (!availableRoles || availableRoles.length === 0) {
    console.log("NavUser - no roles available, showing default state");
  } else if (availableRoles.length === 1) {
    console.log("NavUser - only one role available, hiding role change option");
  } else {
    console.log(
      "NavUser - multiple roles available, showing role change option"
    );
  }

  const handleSignOut = async () => {
    await signOut({ redirectUrl: "/" });
  };

  const handleRoleChange = (role: string) => {
    console.log("Changing role to:", role, "from available:", availableRoles);
    setActiveRole(role as UserRole);
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      superadmin: "Superadmin",
      admin: "Admin",
      auditor: "Auditor",
      teacher: "Profesor",
      tutor: "Tutor",
    };
    return labels[role as keyof typeof labels] || role;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 p-2 h-auto ">
        
          <div className="flex flex-col items-start text-left">
            <span className="text-sm font-medium">Hola, {user.name}</span>
            {/* {activeRole && availableRoles && availableRoles.length > 0 && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    {getRoleLabel(activeRole)}
                  </Badge>
                )} */}
          </div>
          <Avatar className="h-8 w-8 rounded-full">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="rounded-lg">
              {user.name
                .split(" ")
                .map((word) => word.charAt(0))
                .join("")
                .toUpperCase()
                .slice(0, 2) || "U"}
            </AvatarFallback>
          </Avatar>
          <ChevronsUpDown className="ml-2 h-4 w-4" />
              
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 rounded-lg"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center flex-col gap-1 px-1 py-1.5 text-left text-sm">
              <span className="truncate text-xs">{user.email}</span>
              {activeRole && availableRoles && availableRoles.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {getRoleLabel(activeRole)}
                </Badge>
              )}
            
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <CreditCard />
            Suscripción
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <BadgeCheck />
            Perfil
          </DropdownMenuItem>
          {/* <DropdownMenuItem>
                <Gem />
                Cambio de Rol
              </DropdownMenuItem> */}
          {/* Solo mostrar opción de cambio de rol si hay más de un rol disponible */}
          {availableRoles && availableRoles.length > 1 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Gem className="size-4 mr-2 text-muted-foreground" /> Cambio de
                Rol
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent
                  sideOffset={5} 
                  className="w-fit lg:w-44 max-h-48 overflow-y-auto ml-2.5">
                  {[...new Set(availableRoles)].map((role) => (
                    <DropdownMenuItem
                      key={role}
                      onClick={() => handleRoleChange(role)}
                      className={activeRole === role ? "bg-accent" : ""}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{getRoleLabel(role)}</span>
                        {activeRole === role && (
                          <Badge variant="default" className="text-xs bg-white-300 text-gray-700 ml-3 flex items-center justify-center p-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </Badge>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          )}
          <DropdownMenuItem>
            <Bell />
            Notificaciones
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => window.Clerk.openUserProfile()}>
            <User />
             Administrar perfil
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer hover:bg-muted/50"
          onClick={handleSignOut}
        >
          <LogOut />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
