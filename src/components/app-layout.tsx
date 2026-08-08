import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { Wordmark } from "@/components/wordmark";
import { SidebarProvider, useSidebar } from "@/components/sidebar-context";

function MobileTopBar() {
  const { setMobileOpen } = useSidebar();
  return (
    <div className="flex items-center justify-between border-b border-line px-4 py-3 md:hidden">
      <Wordmark />
      <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open menu">
        <Menu size={20} />
      </button>
    </div>
  );
}

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <div className="flex-1">
          <MobileTopBar />
          <main className="mx-auto max-w-5xl px-6 py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
