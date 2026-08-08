import { Outlet } from "react-router-dom";
import { StatusTicker } from "@/components/status-ticker";
import { SiteHeader } from "@/components/site-header";

export function MarketingLayout() {
  return (
    <div className="min-h-screen">
      <StatusTicker />
      <SiteHeader />
      <Outlet />
    </div>
  );
}
