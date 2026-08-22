import { TrendingUp, Zap, Eye, BarChart3, ArrowRight, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function MerchantOptimization() {
  const features = [
    { title: "Boost Your Listing", desc: "Appear at the top of search results for your category", icon: TrendingUp, locked: true },
    { title: "Featured Placement", desc: "Get featured on category pages and homepage", icon: Zap, locked: true },
    { title: "Enhanced Profile", desc: "Stand out with a premium profile badge and priority support", icon: Eye, locked: true },
    { title: "Analytics Dashboard", desc: "Track views, clicks, and customer engagement", icon: BarChart3, locked: false },
  ];

  return (
    <div className="px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Optimization</h1>
        <p className="text-sm text-muted-foreground mt-1">Grow your visibility on FLEX'S</p>
      </div>

      {/* Analytics preview */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground mb-3">Performance Overview</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-bold text-primary">0</p>
              <p className="text-xs text-muted-foreground">Views</p>
            </div>
            <div>
              <p className="text-xl font-bold text-primary">0</p>
              <p className="text-xs text-muted-foreground">Clicks</p>
            </div>
            <div>
              <p className="text-xl font-bold text-primary">0%</p>
              <p className="text-xs text-muted-foreground">CTR</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade features */}
      <div className="space-y-3">
        {features.map((f) => (
          <Card key={f.title}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{f.title}</h3>
                    {f.locked && <Badge variant="secondary" className="text-xs"><Lock className="h-3 w-3 mr-1" />Upgrade</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button className="w-full" size="lg">Upgrade Now</Button>
    </div>
  );
}
