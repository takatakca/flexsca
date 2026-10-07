import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ClipboardList, MessageSquare, Bell, LayoutDashboard, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const tabs = [
  { path: "/app/dashboard", label: "Overview", icon: LayoutDashboard },
  { path: "/app/leads", label: "Leads", icon: ClipboardList },
  { path: "/app/responses", label: "Responses", icon: MessageSquare },
  { path: "/app/notifications", label: "Updates", icon: Bell },
  { path: "/app/reminders", label: "Reminders", icon: Bell },
];

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/app/dashboard")) return "Overview";
  if (pathname.startsWith("/app/leads")) return "Leads";
  if (pathname.startsWith("/app/responses")) return "Responses";
  if (pathname.startsWith("/app/notifications")) return "Notifications";
  if (pathname.startsWith("/app/admin")) return "Operations";
  if (pathname.startsWith("/app/reminders")) return "Reminders";
  if (pathname.startsWith("/app/settings")) return "Settings";
  return "FLEXS";
}

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const title = getPageTitle(location.pathname);
  const initial = user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur px-4">
        <button
          onClick={() => navigate("/app/settings")}
          className="flex items-center"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
              {initial}
            </AvatarFallback>
          </Avatar>
        </button>

        <h1 className="text-lg font-bold text-foreground">{title}</h1>

        <button aria-label="Settings" onClick={() => navigate("/app/settings")}>
          <Settings className="h-5 w-5 text-muted-foreground" />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto md:ml-56">
        <Outlet />
      </main>

      {/* Bottom tab bar */}
      <nav aria-label="Professional navigation" className="sticky bottom-0 z-30 border-t bg-background/95 backdrop-blur pb-safe md:fixed md:top-14 md:left-0 md:bottom-0 md:w-56 md:border-t-0 md:border-r">
        <div className="flex h-16 md:h-auto md:flex-col md:p-3 md:gap-2">
          {tabs.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname.startsWith(path);
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors md:flex-row md:justify-start md:p-3 md:gap-3 md:rounded-lg ${
                  isActive
                    ? "text-primary md:bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
