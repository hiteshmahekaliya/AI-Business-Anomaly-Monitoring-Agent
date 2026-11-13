import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  LayoutDashboard,
  Radar,
  Sparkles,
  Upload,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: "Upload Data", url: "/upload-data", icon: Upload },
  { title: "Anomaly Monitor", url: "/anomaly-monitor", icon: Radar },
  { title: "AI Insights", url: "/ai-insights", icon: Sparkles },
  { title: "Alerts", url: "/alerts", icon: Bell },
];

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 px-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Activity className="h-5 w-5" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-display text-sm font-semibold text-sidebar-foreground">
          Anomaly Agent
        </span>
        <span className="text-[11px] text-sidebar-foreground/60">
          Business Monitoring
        </span>
      </span>
    </Link>
  );
}

function NavLinks({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {navItems.map((item) => {
        const active = pathname === item.url;
        return (
          <Link
            key={item.url}
            to={item.url}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-foreground"
                : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter() {
  return (
    <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
     
<p className="text-[11px] font-medium uppercase tracking-wide text-sidebar-foreground/60">
  SYSTEM STATUS
</p>
<p className="mt-1 text-xs text-sidebar-foreground/70">
  CSV analysis active. IQR anomaly detection enabled.
</p>

    </div>
  );
}

export function AppSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 md:flex">
      <Brand />
      <NavLinks className="mt-8 flex-1" />
      <SidebarFooter />
    </aside>
  );
}

export function MobileNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-sidebar-border bg-sidebar px-4 py-3 md:hidden">
      <Brand />
      <NavLinks className="mt-3 flex-row gap-1 overflow-x-auto pb-1" />
    </header>
  );
}
