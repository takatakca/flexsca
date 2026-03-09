import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, ArrowRight, CheckCircle, MessageSquare, FileText, Star, ChevronRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

const howItWorks = [
  {
    icon: FileText,
    title: "Tell us what you need",
    description: "Answer a few quick questions about the service you're looking for.",
  },
  {
    icon: MessageSquare,
    title: "Get matched with pros",
    description: "We'll connect you with up to 5 qualified local professionals.",
  },
  {
    icon: CheckCircle,
    title: "Compare & hire",
    description: "Read reviews, compare quotes, and hire the best professional for you.",
  },
];

const footerLinks = {
  "For Customers": [
    { label: "How it works", href: "/about" },
    { label: "Browse services", href: "/post-job" },
    { label: "Help Center", href: "/help" },
  ],
  "For Professionals": [
    { label: "Join as a Pro", href: "/auth/welcome" },
    { label: "How FLEXS works", href: "/about" },
    { label: "Pricing", href: "/about" },
  ],
  Company: [
    { label: "About us", href: "/about" },
    { label: "Affiliates", href: "/affiliates" },
    { label: "Cookie Policy", href: "/cookies" },
  ],
};

export default function Index() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase
      .from("service_categories")
      .select("id, name, slug, icon")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        if (data) setCategories(data);
      });
  }, []);

  const filtered = search
    ? categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : categories;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/post-job?q=${encodeURIComponent(search.trim())}`);
    } else {
      navigate("/post-job");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="text-2xl font-extrabold tracking-tight text-foreground">
            QMAPS
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/post-job" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Find a Pro
            </Link>
            <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link to="/help" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Help
            </Link>
            <Button size="sm" onClick={() => navigate("/auth/welcome")}>
              Join as a Pro
            </Button>
          </nav>

          {/* Mobile menu toggle */}
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background px-4 py-4 space-y-3">
            <Link to="/post-job" className="block text-sm font-medium text-foreground" onClick={() => setMobileMenuOpen(false)}>
              Find a Pro
            </Link>
            <Link to="/about" className="block text-sm font-medium text-foreground" onClick={() => setMobileMenuOpen(false)}>
              About
            </Link>
            <Link to="/help" className="block text-sm font-medium text-foreground" onClick={() => setMobileMenuOpen(false)}>
              Help
            </Link>
            <Button size="sm" className="w-full" onClick={() => { setMobileMenuOpen(false); navigate("/auth/welcome"); }}>
              Join as a Pro
            </Button>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Find the right professional for any job
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Get free quotes from trusted local pros. Compare, hire, and get the job done.
          </p>
          <form onSubmit={handleSearch} className="mt-8 mx-auto flex max-w-xl gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="What service do you need?"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 h-12 rounded-xl bg-background text-foreground border-0 shadow-lg"
              />
            </div>
            <Button type="submit" size="lg" variant="secondary" className="h-12 rounded-xl px-6 font-semibold">
              Search
            </Button>
          </form>
        </div>
      </section>

      {/* Popular Services */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Popular services</h2>
          <Button variant="ghost" size="sm" className="gap-1 text-primary" onClick={() => navigate("/post-job")}>
            View all <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {filtered.slice(0, 20).map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/services/${cat.slug}`)}
              className="group flex flex-col items-center gap-3 p-4 sm:p-5 rounded-xl bg-card border border-border hover:border-primary hover:shadow-md transition-all text-center"
            >
              <span className="text-3xl sm:text-4xl">{cat.icon || "🔧"}</span>
              <span className="text-sm font-medium text-foreground leading-tight group-hover:text-primary transition-colors">
                {cat.name}
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 && search && (
          <p className="text-center text-muted-foreground py-8">
            No services found for "{search}". <button className="text-primary underline" onClick={() => setSearch("")}>Clear search</button>
          </p>
        )}
      </section>

      {/* How it works */}
      <section className="bg-secondary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-10">
            How QMAPS works
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {howItWorks.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground mb-4">
                  <step.icon className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground max-w-xs">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">Are you a professional?</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Join FLEXS to receive leads, grow your business, and connect with customers in your area.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" className="rounded-xl h-12 px-8 gap-2" onClick={() => navigate("/auth/welcome")}>
            Join as a Professional <ArrowRight className="h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" className="rounded-xl h-12 px-8 gap-2" onClick={() => navigate("/post-job")}>
            <Search className="h-4 w-4" /> Find a Professional
          </Button>
        </div>
      </section>

      {/* Reviews / Trust */}
      <section className="bg-secondary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-8">
            Trusted by thousands
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { name: "Sarah M.", text: "Found an amazing accountant within hours. The whole process was so easy!", rating: 5 },
              { name: "James K.", text: "As a plumber, FLEXS has helped me grow my client base significantly.", rating: 5 },
              { name: "Emma L.", text: "Great platform for finding reliable local professionals. Highly recommend!", rating: 5 },
            ].map((review, i) => (
              <div key={i} className="rounded-xl bg-card border border-border p-6">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-sm text-foreground mb-3">"{review.text}"</p>
                <p className="text-xs font-semibold text-muted-foreground">{review.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-extrabold text-foreground mb-4">QMAPS</h3>
              <p className="text-xs text-muted-foreground">
                Connecting customers with trusted local professionals.
              </p>
            </div>
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h4 className="text-sm font-semibold text-foreground mb-3">{title}</h4>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link to={link.href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} QMAPS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
