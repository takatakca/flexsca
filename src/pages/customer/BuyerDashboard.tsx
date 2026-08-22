import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CustomerLead {
  id: string;
  category: string;
  status: string;
  created_at: string;
  location_text: string;
}

interface SuggestedCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<CustomerLead[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollIndex, setScrollIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth/welcome");
        return;
      }

      // Fetch customer's leads by email
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();

      if (profile?.email) {
        const { data: customerLeads } = await supabase
          .from("leads")
          .select("id, category, status, created_at, location_text")
          .eq("customer_email", profile.email)
          .order("created_at", { ascending: false });

        if (customerLeads) setLeads(customerLeads);
      }

      // Fetch suggested categories
      const { data: cats } = await supabase
        .from("service_categories")
        .select("id, name, slug, icon")
        .eq("is_active", true)
        .order("sort_order")
        .limit(8);

      if (cats) setSuggestions(cats);
      setLoading(false);
    };

    fetchData();
  }, [navigate]);

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "new":
        return { text: "Your request is being reviewed. We'll match you with professionals shortly.", color: "bg-blue-50 text-blue-700" };
      case "contacted":
        return { text: "Professionals have been notified. You should hear back soon!", color: "bg-green-50 text-green-700" };
      case "won":
        return { text: "You've been matched! Check your email for professional details.", color: "bg-green-50 text-green-700" };
      default:
        return { text: `Your request has been rejected. Please email team@flexs.ca for more information.`, color: "bg-red-50 text-red-600" };
    }
  };

  const handleScrollLeft = () => setScrollIndex((p) => Math.max(0, p - 1));
  const handleScrollRight = () => setScrollIndex((p) => Math.min(suggestions.length - 4, p + 1));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="text-xl font-bold text-foreground tracking-tight">
            FLEX'S
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <button className="text-sm font-medium text-primary border-b-2 border-primary pb-0.5">
              My requests
            </button>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                C
              </div>
              <span className="text-sm font-medium text-foreground">Customer</span>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Title + CTA */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 md:mb-0">Your requests</h1>
          <Button
            variant="outline"
            onClick={() => navigate("/post-job")}
            className="w-fit border-primary text-primary hover:bg-primary/5"
          >
            Place new request
          </Button>
        </div>

        {/* Request cards */}
        {leads.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">You haven't placed any requests yet.</p>
            <Button onClick={() => navigate("/post-job")}>Place your first request</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {leads.map((lead) => {
              const statusInfo = getStatusMessage(lead.status);
              return (
                <div
                  key={lead.id}
                  className="bg-background rounded-xl border border-border p-6 text-center"
                >
                  <h3 className="text-lg font-bold text-foreground mb-1">{lead.category}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                  </p>
                  <div className={`rounded-lg px-4 py-3 text-sm mb-4 ${statusInfo.color}`}>
                    {statusInfo.text}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/post-job`)}
                  >
                    View request
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Mobile: Place new request link */}
        <div className="md:hidden text-center mb-10">
          <button
            onClick={() => navigate("/post-job")}
            className="text-primary font-medium text-sm underline"
          >
            Place new request
          </button>
        </div>

        {/* You may also need */}
        {suggestions.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">You may also need</h2>
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={handleScrollLeft}
                  disabled={scrollIndex === 0}
                  className="h-9 w-9 rounded-full border border-border flex items-center justify-center disabled:opacity-30 hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={handleScrollRight}
                  disabled={scrollIndex >= suggestions.length - 4}
                  className="h-9 w-9 rounded-full border border-border flex items-center justify-center disabled:opacity-30 hover:bg-muted transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Desktop grid / Mobile stack */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {suggestions.slice(scrollIndex, scrollIndex + 4).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/services/${cat.slug}`)}
                  className="bg-background rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow text-left"
                >
                  <div className="h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-5xl">
                    {cat.icon}
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-medium text-foreground">{cat.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* CTA Banner */}
        <div className="bg-primary/5 rounded-xl p-6 text-center mb-8">
          <p className="text-primary font-medium">
            Are you a small business?{" "}
            <button
              onClick={() => navigate("/auth/welcome")}
              className="underline font-semibold"
            >
              Register now to start selling your services through FLEX'S.
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
