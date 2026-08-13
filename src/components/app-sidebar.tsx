import { Link, useLocation } from "react-router-dom";
import { BookOpen, LineChart, PanelLeft, PanelLeftClose, PlusCircle, Shield, User, Wallet, X } from "lucide-react";
import { Wordmark } from "@/components/wordmark";
import { LogoMark } from "@/components/logo-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { NetworkSwitcher } from "@/components/network-switcher";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { useSidebar } from "@/components/sidebar-context";
import { useIsOwner } from "@/hooks/useOwner";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/markets", label: "Markets", icon: LineChart },
  { to: "/create", label: "Create Market", icon: PlusCircle },
  { to: "/portfolio", label: "Portfolio", icon: Wallet },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/docs", label: "Docs", icon: BookOpen },
];

function NavLinks({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const location = useLocation();
  const { isOwner } = useIsOwner();
  const items = isOwner ? [...NAV_ITEMS, { to: "/admin", label: "Admin", icon: Shield }] : NAV_ITEMS;

  return (
    <nav className="flex flex-col gap-1 px-3">
      {items.map(({ to, label, icon: Icon }) => {
        const active = location.pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            className={cn(
              "flex items-center gap-3 rounded-sm px-3 py-2 font-mono text-sm transition-colors",
              active ? "bg-accent/10 text-accent" : "text-muted hover:bg-surface2 hover:text-ink",
            )}
          >
            <Icon size={16} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppSidebar() {
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useSidebar();

  return (
    <>
      {/* Desktop rail */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-surface transition-all md:flex",
          collapsed ? "w-20" : "w-64",
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-4">
          <Link to="/">{collapsed ? <LogoMark size={20} /> : <Wordmark />}</Link>
        </div>
        <div className="flex-1 py-4">
          <NavLinks collapsed={collapsed} />
        </div>
        <div className="flex flex-col gap-3 border-t border-line p-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <NetworkSwitcher />
              <ThemeToggle />
            </div>
          )}
          <WalletConnectButton />
          <button
            type="button"
            onClick={toggleCollapsed}
            className="flex items-center justify-center gap-2 rounded-sm border border-line py-1.5 text-muted hover:border-accent hover:text-accent"
          >
            {collapsed ? <PanelLeft size={14} /> : <PanelLeftClose size={14} />}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-surface">
            <div className="flex items-center justify-between border-b border-line px-4 py-4">
              <Link to="/" onClick={() => setMobileOpen(false)}>
                <Wordmark />
              </Link>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 py-4">
              <NavLinks collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="flex flex-col gap-3 border-t border-line p-4">
              <div className="flex items-center gap-2">
                <NetworkSwitcher />
                <ThemeToggle />
              </div>
              <WalletConnectButton />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
