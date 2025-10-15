import { SidebarInset, SidebarProvider } from "@repo/ui/components/shadcn/sidebar";
import { Toaster } from "@repo/ui/components/shadcn/sonner";
import { SchoolErrorBoundary } from "../../../components/SchoolErrorBoundary";
import { SchoolValidator } from "../../../components/SchoolValidator";
import { SmartActiveRoleWrapper } from "../../../components/SmartActiveRoleWrapper";
import { ReactNode } from "react";
import { AppSidebar } from "components/menu/app-sidebar";
import { SiteHeader } from "components/menu/site-header";

export const dynamic = "force-dynamic";

export default async function EscuelaLayout({
  children,
}: {
  children: ReactNode;
  params: { subdomain: string };
}) {

  return (
    <SchoolErrorBoundary>
      <SchoolValidator>
        <SmartActiveRoleWrapper>
          <div className="[--header-height:calc(--spacing(14))]">
            <SidebarProvider className="flex flex-col">
              <SiteHeader />
              <div className="flex flex-1">
                <AppSidebar />
                <SidebarInset className="flex-1 overflow-x-hidden">
                  <div className="flex flex-1 flex-col gap-4 p-4 overflow-x-hidden">
                    {children}
                    <Toaster richColors />
                  </div>
                </SidebarInset>
              </div>
            </SidebarProvider>
          </div>
        </SmartActiveRoleWrapper>
      </SchoolValidator>
    </SchoolErrorBoundary>
  );
}