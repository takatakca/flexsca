import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, MapPin, ChevronRight, Star, Menu, User, X, CheckCircle, MessageSquare, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

/* ── Static data for sections ── */

const categoryImages: Record<string, string> = {
  "house-cleaning": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=400&fit=crop",
  "plumbing": "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&h=400&fit=crop",
  "electrical-work": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&h=400&fit=crop",
  "painting-decorating": "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=600&h=400&fit=crop",
  "garden-maintenance": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=400&fit=crop",
  "removals": "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=600&h=400&fit=crop",
  "dog-walking": "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=400&fit=crop",
  "personal-training": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=400&fit=crop",
  "photography": "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=600&h=400&fit=crop",
  "accounting": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop",
  "copywriting": "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&h=400&fit=crop",
  "advertising-media-buying": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=400&fit=crop",
  "web-development": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop",
  "mobile-software-development": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=400&fit=crop",
  "general-software-development": "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=400&fit=crop",
  "database-development": "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&h=400&fit=crop",
  "software-testing": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop",
  "digital-marketing-services": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
  "email-marketing": "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=600&h=400&fit=crop",
  "ppc-specialists": "https://images.unsplash.com/photo-1553729459-afe8f2e2ed65?w=600&h=400&fit=crop",
  "financial-and-tax": "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&h=400&fit=crop",
  "financial-planning": "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=600&h=400&fit=crop",
  "general-accounting": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop",
  "event-and-travel-services": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop",
  "debt-recovery": "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=400&fit=crop",
  "employment-law": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=400&fit=crop",
  "coding-tuition": "https://images.unsplash.com/photo-1515879218367-8466d910auj7?w=600&h=400&fit=crop",
  "ip-patent-lawyer": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=400&fit=crop",
  "script-writer": "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&h=400&fit=crop",
};

const fallbackImage = "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop";

const regionTabs = ["Ontario", "Quebec", "British Columbia", "Alberta", "Atlantic"];
const regions: Record<string, string[]> = {
  Ontario: ["Toronto", "Ottawa", "Mississauga", "Brampton", "Hamilton", "London", "Markham", "Vaughan", "Kitchener", "Windsor"],
  Quebec: ["Montreal", "Quebec City", "Laval", "Gatineau", "Longueuil", "Sherbrooke", "Saguenay", "Lévis", "Trois-Rivières"],
  "British Columbia": ["Vancouver", "Surrey", "Burnaby", "Richmond", "Kelowna", "Victoria", "Abbotsford", "Coquitlam", "Langley"],
  Alberta: ["Calgary", "Edmonton", "Red Deer", "Lethbridge", "St. Albert", "Medicine Hat", "Grande Prairie", "Airdrie"],
  Atlantic: ["Halifax", "Moncton", "Saint John", "Fredericton", "Charlottetown", "St. John's", "Sydney", "Dartmouth"],
};

const reviews = [
  { rating: 5, text: "Absolutely fantastic service! The professional was knowledgeable, punctual, and delivered exactly what I needed. Highly recommend QMAPS!", author: "Sarah M.", count: "4,899" },
  { rating: 5, text: "Finding a quality professional has never been easier. The platform made the whole process smooth and stress-free.", author: "Michael T.", count: "3,214" },
  { rating: 4, text: "Great experience overall. Got connected with multiple professionals quickly and found the perfect match for my project.", author: "Jennifer L.", count: "2,670" },
];

const relatedServices = [
  { title: "Web Design", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop" },
  { title: "Social Media Marketing", image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=250&fit=crop" },
  { title: "Email Marketing Services", image: "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=400&h=250&fit=crop" },
];

const relatedGuides = [
  { title: "A complete social media marketing guide for all businesses and budgets", image: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=400&h=250&fit=crop" },
  { title: "How to get more followers on social media in 2024", image: "https://images.unsplash.com/photo-1563986768609-322da13575f2?w=400&h=250&fit=crop" },
];

const relatedPriceGuides = [
  { title: "How much does social media management cost?", image: "https://images.unsplash.com/photo-1553729459-afe8f2e2ed65?w=400&h=250&fit=crop" },
  { title: "How much does website design cost?", image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=400&h=250&fit=crop" },
  { title: "How much does logo design cost?", image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=250&fit=crop" },
];

/* ── Popular Regions component ── */
function PopularRegions() {
  const [tab, setTab] = useState("Ontario");
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-foreground">Popular Regions</h2>
        <Button variant="ghost" size="sm" className="text-primary gap-1">
          View All <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex gap-2 flex-wrap mb-4">
        {regionTabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              tab === t
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="border border-border rounded-lg overflow-hidden">
        {(regions[tab] || []).map((r) => (
          <button key={r} className="w-full text-left px-4 py-3 text-sm text-foreground hover:bg-muted/50 border-b border-border last:border-b-0 transition-colors">
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Main Homepage ── */
export default function Index() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(serviceSearch.trim() ? `/post-job?q=${encodeURIComponent(serviceSearch.trim())}` : "/post-job");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4">
          <Link to="/" className="text-xl font-bold text-primary">QMAPS</Link>
          <nav className="hidden md:flex items-center gap-6">
            <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              Explore <ChevronRight className="h-4 w-4 rotate-90" />
            </button>
            <Link to="/auth/login" className="text-sm text-muted-foreground hover:text-foreground">Login</Link>
            <Link to="/auth/welcome" className="bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-full hover:bg-primary/90 flex items-center gap-2">
              <User className="h-4 w-4" /> Join as a Professional
            </Link>
          </nav>
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t px-4 py-4 space-y-3 bg-background">
            <Link to="/post-job" className="block text-sm font-medium text-foreground" onClick={() => setMobileMenuOpen(false)}>Find a Pro</Link>
            <Link to="/about" className="block text-sm font-medium text-foreground" onClick={() => setMobileMenuOpen(false)}>About</Link>
            <Link to="/help" className="block text-sm font-medium text-foreground" onClick={() => setMobileMenuOpen(false)}>Help</Link>
            <Button size="sm" className="w-full" onClick={() => { setMobileMenuOpen(false); navigate("/auth/welcome"); }}>Join as a Pro</Button>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=600&fit=crop)" }} />
        <div className="relative max-w-7xl mx-auto px-4 py-14 sm:py-20 text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Find Development and<br className="hidden sm:block" /> Software professionals near you
          </h1>
          <form onSubmit={handleSearch} className="mt-8 max-w-xl mx-auto bg-card rounded-lg shadow-lg p-4 sm:p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1 text-left">What service do you need?</label>
              <Input value={serviceSearch} onChange={(e) => setServiceSearch(e.target.value)} placeholder="Development and Software" className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1 text-left">Where do you need it?</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={locationSearch} onChange={(e) => setLocationSearch(e.target.value)} placeholder="Enter your postcode" className="pl-10 w-full" />
              </div>
            </div>
            <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold h-11">
              Continue
            </Button>
          </form>
        </div>
      </section>

      {/* ── Press / Trust bar ── */}
      <div className="border-b py-5">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-6 sm:gap-12 flex-wrap opacity-30">
          <span className="text-lg sm:text-xl font-bold tracking-tight font-serif">CBC</span>
          <span className="text-lg sm:text-xl font-bold tracking-tight italic">Globe&Mail</span>
          <span className="text-lg sm:text-xl font-bold tracking-widest uppercase font-serif">TORONTO STAR</span>
          <span className="text-lg sm:text-xl font-bold tracking-widest uppercase">MACLEAN'S</span>
        </div>
      </div>

      {/* ── Description section ── */}
      <section className="max-w-7xl mx-auto px-4 py-10 sm:py-14">
        <p className="text-xs text-muted-foreground mb-2">
          <Link to="/" className="hover:text-foreground">Business</Link>
          <span className="mx-1">/</span>
          <Link to="/" className="hover:text-foreground">technology</Link>
          <span className="mx-1">/</span>
          <span className="text-primary font-medium">Development and Software</span>
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
          Need help finding a Development and Software professional?
        </h2>
        <p className="text-muted-foreground mb-4 max-w-3xl">
          You can find the best Development and Software professionals on QMAPS. Start your search and get free quotes now!
        </p>
        <p className="text-muted-foreground mb-4 max-w-3xl text-sm">
          First time looking for a Development and Software professional and not sure where to start? Tell us about your project and we'll send you a list of professionals to review. There's no pressure to hire, so you can compare profiles, read previous reviews and ask for more information before you make your decision.
        </p>
        <p className="text-muted-foreground mb-6 text-sm">Best of all – it's completely free!</p>
        <Button onClick={() => navigate("/post-job")} className="rounded-full px-6">
          Find a Development and Software professional Today
        </Button>
      </section>

      {/* ── Popular Categories (large image cards) ── */}
      <section className="max-w-7xl mx-auto px-4 pb-10 sm:pb-14">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-8">Popular Categories</h2>
        <div className="space-y-4">
          {categories.slice(0, 10).map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/services/${cat.slug}`)}
              className="group w-full text-left rounded-xl overflow-hidden border border-border hover:border-primary hover:shadow-lg transition-all"
            >
              <div className="relative aspect-[16/7] sm:aspect-[16/5] overflow-hidden">
                <img
                  src={categoryImages[cat.slug] || fallbackImage}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-white">{cat.name}</h3>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                    Start here →
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── All services tags ── */}
      <section className="max-w-7xl mx-auto px-4 pb-10 sm:pb-14">
        <h2 className="text-2xl font-bold text-foreground mb-6">All services</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/services/${cat.slug}`}
              className="px-4 py-2 border border-border rounded-full text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="bg-secondary">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { icon: FileText, title: "Tell us what you need", desc: "Answer a few quick questions about the service you're looking for. We'll match you with qualified local professionals." },
              { icon: CheckCircle, title: "Receive Free Quotes", desc: "You'll receive free quotes from the best professionals. Compare profiles, read reviews and ask for more information." },
              { icon: MessageSquare, title: "Choose your professional", desc: "Pick the professional that's right for your needs. With access to reviews, profiles and pricing, find the perfect match." },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <step.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button onClick={() => navigate("/post-job")} className="rounded-full px-8">
              Find a professional near you
            </Button>
          </div>
        </div>
      </section>

      {/* ── Popular Regions ── */}
      <section className="max-w-7xl mx-auto px-4 py-10 sm:py-14">
        <PopularRegions />
      </section>

      {/* ── Pick the best ── */}
      <section className="max-w-7xl mx-auto px-4 pb-10 sm:pb-14 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-3">Pick the best</h2>
        <div className="flex items-center justify-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-warning text-warning" />)}
        </div>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-6">
          Compare quotes from top professionals near you on QMAPS. Get responses from trusted pros, read real reviews, compare prices and choose the best one for your needs.
        </p>
        <Button onClick={() => navigate("/post-job")} className="rounded-full px-8">
          Get quotes from professionals near you
        </Button>
      </section>

      {/* ── Reviews ── */}
      <section className="bg-secondary">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
          <h2 className="text-2xl font-bold text-foreground mb-2">Reviews</h2>
          <div className="flex items-center gap-2 mb-6">
            <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-warning text-warning" />)}</div>
            <span className="text-sm text-muted-foreground">4.89/560</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {reviews.map((r, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6">
                <div className="flex gap-0.5 mb-3">{[...Array(r.rating)].map((_, j) => <Star key={j} className="h-4 w-4 fill-warning text-warning" />)}</div>
                <p className="text-sm text-foreground mb-3">"{r.text}"</p>
                <p className="text-xs font-semibold text-muted-foreground">— {r.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Related services ── */}
      <section className="max-w-7xl mx-auto px-4 py-10 sm:py-14">
        <h2 className="text-2xl font-bold text-foreground mb-6 underline decoration-1 underline-offset-4">Related services</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {relatedServices.map((s) => (
            <div key={s.title} className="rounded-xl overflow-hidden border border-border group cursor-pointer">
              <div className="aspect-[16/10] overflow-hidden">
                <img src={s.image} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
              </div>
              <div className="p-4"><h3 className="font-semibold text-foreground text-sm">{s.title}</h3></div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Related service guides ── */}
      <section className="max-w-7xl mx-auto px-4 pb-10">
        <h2 className="text-2xl font-bold text-foreground mb-6 underline decoration-1 underline-offset-4">Related service guides</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {relatedGuides.map((g) => (
            <div key={g.title} className="rounded-xl overflow-hidden border border-border group cursor-pointer">
              <div className="aspect-[16/9] overflow-hidden">
                <img src={g.image} alt={g.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
              </div>
              <div className="p-4"><h3 className="font-semibold text-foreground text-sm">{g.title}</h3></div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Related price guides ── */}
      <section className="max-w-7xl mx-auto px-4 pb-10 sm:pb-14">
        <h2 className="text-2xl font-bold text-foreground mb-6 underline decoration-1 underline-offset-4">Related price guides</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {relatedPriceGuides.map((p) => (
            <div key={p.title} className="rounded-xl overflow-hidden border border-border group cursor-pointer">
              <div className="aspect-[16/10] overflow-hidden">
                <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
              </div>
              <div className="p-4"><h3 className="font-semibold text-foreground text-sm">{p.title}</h3></div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="text-center py-10 border-t">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-2">Get quotes from professionals near you</h2>
          <p className="text-muted-foreground mb-6">Tell us about your project and we'll connect you with trusted professionals.</p>
          <Button size="lg" onClick={() => navigate("/post-job")}>Get Started</Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">For Customers</h4>
              <ul className="space-y-2 text-sm opacity-70">
                <li><Link to="/post-job" className="hover:opacity-100">Find a Professional</Link></li>
                <li><Link to="/about" className="hover:opacity-100">How it works</Link></li>
                <li><Link to="/auth/login" className="hover:opacity-100">Login</Link></li>
                <li><Link to="/" className="hover:opacity-100">Mobile App</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Professionals</h4>
              <ul className="space-y-2 text-sm opacity-70">
                <li><Link to="/about" className="hover:opacity-100">How it works</Link></li>
                <li><Link to="/about" className="hover:opacity-100">Pricing</Link></li>
                <li><Link to="/auth/welcome" className="hover:opacity-100">Join as a Professional</Link></li>
                <li><Link to="/help" className="hover:opacity-100">Help centre</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">About</h4>
              <ul className="space-y-2 text-sm opacity-70">
                <li><Link to="/about" className="hover:opacity-100">About QMAPS</Link></li>
                <li><Link to="/" className="hover:opacity-100">Careers</Link></li>
                <li><Link to="/affiliates" className="hover:opacity-100">Affiliates</Link></li>
                <li><Link to="/" className="hover:opacity-100">Blog</Link></li>
                <li><Link to="/" className="hover:opacity-100">Press</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Need help?</h4>
              <Button onClick={() => navigate("/help")} variant="secondary" className="mb-4">Contact us</Button>
              <div className="flex gap-3 mt-4">
                <span className="text-sm opacity-70">f</span>
                <span className="text-sm opacity-70">in</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm opacity-70 mb-6">
            <span>🇨🇦</span> <span>Canada</span> <ChevronRight className="h-3 w-3" />
          </div>
          <div className="border-t border-background/20 pt-6 text-center text-xs opacity-50">
            <p>© {new Date().getFullYear()} QMAPS. All rights reserved.</p>
            <div className="flex justify-center gap-4 mt-2">
              <Link to="/">Terms & Conditions</Link>
              <Link to="/cookies">Cookie Policy</Link>
              <Link to="/">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
