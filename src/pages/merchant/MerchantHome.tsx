import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Store, TrendingUp, BarChart3, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function MerchantHome() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const quickActions = [
    { label: "Manage Profile", icon: Store, path: "/merchant/marketplace", color: "bg-primary/10 text-primary" },
    { label: "View Insights", icon: BarChart3, path: "/merchant/optimization", color: "bg-emerald-500/10 text-emerald-600" },
    { label: "Boost Listing", icon: TrendingUp, path: "/merchant/optimization", color: "bg-amber-500/10 text-amber-600" },
  ];

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome back!</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your business on QMAPS</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="text-xs text-muted-foreground mt-1">Profile Views</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="text-xs text-muted-foreground mt-1">Customer Leads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="h-4 w-4 fill-warning text-warning" />
              <span className="text-2xl font-bold">0.0</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="text-xs text-muted-foreground mt-1">Reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Quick Actions</h2>
        <div className="space-y-2">
          {quickActions.map((a) => (
            <button
              key={a.label}
              onClick={() => navigate(a.path)}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors"
            >
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${a.color}`}>
                <a.icon className="h-5 w-5" />
              </div>
              <span className="flex-1 text-left font-medium text-foreground">{a.label}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      {/* Setup Progress */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground mb-2">Complete your profile</h3>
          <p className="text-sm text-muted-foreground mb-3">
            A complete profile helps customers find and trust your business.
          </p>
          <Button onClick={() => navigate("/merchant/marketplace")} className="w-full">
            Go to Marketplace Profile
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
