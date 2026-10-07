import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Seo } from "@/seo/Seo";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export default function PostJob() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("service_categories")
      .select("id, name, slug, icon")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        if (data) setCategories(data);
        setLoading(false);
      });
  }, []);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="What do you need help with? | FLEX'S"
        description="Tell us what you need and we'll connect you with top professionals"
        path="/post-job"
      />
      {/* Header */}
      <div className="sticky top-0 z-10 bg-primary text-primary-foreground px-4 py-4 pb-6">
        <button onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold mb-1">What do you need help with?</h1>
        <p className="text-primary-foreground/80 text-sm">
          Tell us what you need and we'll connect you with top professionals
        </p>
      </div>

      {/* Search */}
      <div className="px-4 -mt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for a service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl bg-card shadow-md border-0 h-12"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 pt-6 pb-8">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Popular services
        </h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No services found. Try a different search.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate(`/post-job/${cat.slug}`)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary hover:bg-accent transition-colors text-center"
              >
                <span className="text-3xl">{cat.icon}</span>
                <span className="text-sm font-medium text-foreground leading-tight">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
