import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  name: string;
  slug: string;
  icon: string | null;
}

export default function ProLanding() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase
      .from("service_categories")
      .select("name, slug, icon")
      .eq("is_active", true)
      .order("sort_order")
      .limit(20)
      .then(({ data }) => {
        if (data) setCategories(data);
      });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/auth/welcome");
  };

  // Split categories into two columns
  const half = Math.ceil(categories.length / 2);
  const col1 = categories.slice(0, half);
  const col2 = categories.slice(half);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4">
          <Link to="/" className="text-xl font-bold text-primary italic">FLEXS</Link>
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pt-16 pb-10 max-w-lg mx-auto w-full">
        <h1 className="text-3xl font-bold text-foreground leading-tight mb-3">
          Secure jobs and grow your business
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          1000's of local and remote clients are already looking for your services
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="What Service do you provide?"
            className="flex-1 h-11 rounded-lg"
          />
          <Button type="submit" className="h-11 px-4 rounded-lg">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        {/* Popular services */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Popular services</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <div className="space-y-2">
              {col1.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => navigate("/auth/welcome")}
                  className="flex items-center gap-2 text-sm text-primary hover:underline w-full text-left"
                >
                  <span>{cat.icon || "🔧"}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {col2.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => navigate("/auth/welcome")}
                  className="flex items-center gap-2 text-sm text-primary hover:underline w-full text-left"
                >
                  <span>{cat.icon || "🔧"}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
