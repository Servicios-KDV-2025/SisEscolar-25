import { AppSidebar } from "@repo/ui/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@repo/ui/components/shadcn/sidebar";
import { SiteHeader } from "@repo/ui/components/site-header";
import { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function EscuelaLayout({
  children,
}: {
  children: ReactNode;
}) {

  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            <div className="flex flex-1 flex-col gap-4 p-4">
              {children}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
