import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, TrendingUp, Store, MessageSquare, Bell, Menu } from "lucide-react";

const tabs = [
  { path: "/merchant", label: "Home", icon: Home, exact: true },
  { path: "/merchant/optimization", label: "Optimization", icon: TrendingUp },
  { path: "/merchant/marketplace", label: "Marketplace", icon: Store },
  { path: "/merchant/messages", label: "Messages", icon: MessageSquare },
  { path: "/merchant/notifications", label: "Notifications", icon: Bell },
  { path: "/merchant/menu", label: "Menu", icon: Menu },
];

export default function MerchantLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background/95 backdrop-blur pb-safe">
        <div className="flex h-16">
          {tabs.map(({ path, label, icon: Icon, exact }) => {
            const active = isActive(path, exact);
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
