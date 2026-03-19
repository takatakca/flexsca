import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Store, Settings, CreditCard, HelpCircle, LogOut, ChevronRight, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function MerchantMenu() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const initial = user?.email?.charAt(0).toUpperCase() || "M";

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const sections = [
    {
      title: "Business",
      items: [
        { label: "Marketplace Profile", icon: Store, path: "/merchant/marketplace" },
        { label: "Account Settings", icon: Settings, path: "/merchant/menu" },
        { label: "Billing & Payments", icon: CreditCard, path: "/merchant/menu" },
      ],
    },
    {
      title: "Support",
      items: [
        { label: "Help Center", icon: HelpCircle, path: "/help" },
        { label: "Switch to Pro Dashboard", icon: User, path: "/app/leads" },
      ],
    },
  ];

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Profile header */}
      <div className="flex items-center gap-3">
        <Avatar className="h-14 w-14">
          <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">{initial}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-foreground">{user?.email}</p>
          <p className="text-sm text-muted-foreground">Merchant Account</p>
        </div>
      </div>

      <Separator />

      {sections.map((section) => (
        <div key={section.title}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{section.title}</p>
          <div className="space-y-1">
            {section.items.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <item.icon className="h-5 w-5 text-muted-foreground" />
                <span className="flex-1 text-left text-sm font-medium text-foreground">{item.label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      ))}

      <Separator />

      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
        <LogOut className="h-5 w-5" />
        <span className="text-sm font-medium">Sign Out</span>
      </button>
    </div>
  );
}
