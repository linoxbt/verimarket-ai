import { Outlet } from "react-router-dom";
import { SiteHeader } from "@/components/site-header";

export function MarketingLayout() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Outlet />
    </div>
  );
}
