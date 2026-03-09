import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Search, MapPin, ChevronRight, Star, Menu, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ServiceFlowModal from "@/components/customer/ServiceFlowModal";

interface Question {
  id: string;
  label: string;
  subtitle?: string;
  type: "radio" | "checkbox" | "textarea" | "location" | "select";
  options: string[];
  required: boolean;
  hasOther?: boolean;
  placeholder?: string;
}

interface CategoryFull {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  base_credit_cost: number;
  questions: Question[];
  hero_image: string | null;
  parent_slug: string | null;
}

const fallbackImage = "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=400&fit=crop";

const regionTabs = ["Ontario", "Quebec", "British Columbia", "Alberta", "Atlantic"];
const regionsList: Record<string, string[]> = {
  Ontario: ["Toronto", "Ottawa", "Mississauga", "Brampton", "Hamilton", "London", "Markham", "Vaughan", "Kitchener", "Windsor"],
  Quebec: ["Montreal", "Quebec City", "Laval", "Gatineau", "Longueuil", "Sherbrooke", "Saguenay", "Lévis"],
  "British Columbia": ["Vancouver", "Surrey", "Burnaby", "Richmond", "Kelowna", "Victoria", "Abbotsford", "Coquitlam"],
  Alberta: ["Calgary", "Edmonton", "Red Deer", "Lethbridge", "St. Albert", "Medicine Hat", "Grande Prairie"],
  Atlantic: ["Halifax", "Moncton", "Saint John", "Fredericton", "Charlottetown", "St. John's", "Sydney"],
};

function PopularRegions() {
  const [tab, setTab] = useState("Ontario");
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-foreground">Popular Regions</h2>
        <Button variant="ghost" size="sm" className="text-primary gap-1">View All <ChevronRight className="h-4 w-4" /></Button>
      </div>
      <div className="flex gap-2 flex-wrap mb-4">
        {regionTabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${tab === t ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="border border-border rounded-lg overflow-hidden">
        {(regionsList[tab] || []).map((r) => (
          <button key={r} className="w-full text-left px-4 py-3 text-sm text-foreground hover:bg-muted/50 border-b border-border last:border-b-0 transition-colors">{r}</button>
        ))}
      </div>
    </div>
  );
}

const relatedServices = [
  { title: "Web Design", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop" },
  { title: "Social Media Marketing", image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=250&fit=crop" },
  { title: "Email Marketing Services", image: "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=400&h=250&fit=crop" },
];

const relatedGuides = [
  { title: "A complete social media marketing guide for all businesses", image: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=400&h=250&fit=crop" },
  { title: "How to get more followers on social media", image: "https://images.unsplash.com/photo-1563986768609-322da13575f2?w=400&h=250&fit=crop" },
];

const relatedPriceGuides = [
  { title: "How much does social media management cost?", image: "https://images.unsplash.com/photo-1553729459-afe8f2e2ed65?w=400&h=250&fit=crop" },
  { title: "How much does website design cost?", image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=400&h=250&fit=crop" },
  { title: "How much does logo design cost?", image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=250&fit=crop" },
];

const reviews = [
  { rating: 5, text: "Absolutely fantastic service! The professional was knowledgeable, punctual, and delivered exactly what I needed. Highly recommend QMAPS!", author: "Sarah M." },
  { rating: 5, text: "Finding a quality professional has never been easier. The platform made the whole process smooth and stress-free.", author: "Michael T." },
  { rating: 4, text: "Great experience overall. Got connected with multiple professionals quickly and found the perfect match for my project.", author: "Jennifer L." },
];

export default function ServiceCategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<CategoryFull | null>(null);
  const [childCategories, setChildCategories] = useState<CategoryFull[]>([]);
  const [allCategories, setAllCategories] = useState<CategoryFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceSearch, setServiceSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [showFlow, setShowFlow] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      supabase
        .from("service_categories")
        .select("*")
        .eq("slug", slug || "")
        .eq("is_active", true)
        .single(),
      // Get child categories for this parent
      supabase
        .from("service_categories")
        .select("*")
        .eq("parent_slug", slug || "")
        .eq("is_active", true)
        .order("sort_order"),
      // Get sibling categories (same parent) for "All services"
      supabase
        .from("service_categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order"),
    ]).then(([categoryRes, childRes, allRes]) => {
      if (categoryRes.data) {
        const c = categoryRes.data as any;
        setCategory({
          ...c,
          questions: (c.questions as unknown as Question[]) || [],
        });
      }
      if (childRes.data) {
        setChildCategories(childRes.data.map((c: any) => ({
          ...c,
          questions: (c.questions as unknown as Question[]) || [],
        })));
      }
      if (allRes.data) {
        setAllCategories(allRes.data.map((c: any) => ({
          ...c,
          questions: (c.questions as unknown as Question[]) || [],
        })));
      }
      setLoading(false);
    });
  }, [slug]);

  const handleStartRequest = () => {
    if (category) {
      setShowLoading(true);
      setTimeout(() => {
        setShowLoading(false);
        setShowFlow(true);
      }, 1500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Service category not found</p>
        <Button onClick={() => navigate("/")}>Back to Home</Button>
      </div>
    );
  }

  const name = category.name;

  // Determine sibling categories for "All services" tags
  const siblingCategories = category.parent_slug
    ? allCategories.filter((c) => c.parent_slug === category.parent_slug)
    : childCategories.length > 0
    ? childCategories
    : allCategories.filter((c) => !c.parent_slug).slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      {/* Loading Modal */}
      {showLoading && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center">
          <div className="bg-card rounded-2xl p-12 shadow-xl flex flex-col items-center gap-4 min-w-[300px]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-semibold text-foreground">Please wait...</p>
          </div>
        </div>
      )}

      {/* Flow Modal */}
      {showFlow && category && (
        <ServiceFlowModal
          categoryId={category.id}
          categoryName={category.name}
          categorySlug={category.slug}
          questions={category.questions}
          onClose={() => setShowFlow(false)}
        />
      )}

      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary">QMAPS</Link>
          <nav className="hidden md:flex items-center gap-6">
            <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">Explore <ChevronRight className="h-4 w-4 rotate-90" /></button>
            <Link to="/auth/login" className="text-sm text-muted-foreground hover:text-foreground">Login</Link>
            <Link to="/auth/welcome" className="bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-full hover:bg-primary/90 flex items-center gap-2">
              <User className="h-4 w-4" /> Join as a Professional
            </Link>
          </nav>
          <button className="md:hidden"><Menu className="h-6 w-6" /></button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-primary text-primary-foreground">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${category.hero_image || fallbackImage})` }}
        />
        <div className="relative max-w-7xl mx-auto px-4 py-14 md:py-20">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
            Find {name}<br className="sm:hidden" /> professionals near you
          </h1>
          <div className="max-w-xl mx-auto bg-card rounded-lg shadow-lg p-4 md:p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">What service do you need?</label>
              <Input value={serviceSearch} onChange={(e) => setServiceSearch(e.target.value)} placeholder={name} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Where do you need it?</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={locationSearch} onChange={(e) => setLocationSearch(e.target.value)} placeholder="Enter your postcode" className="w-full pl-10" />
              </div>
            </div>
            <Button onClick={handleStartRequest} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold h-11">Continue</Button>
          </div>
        </div>
      </section>

      {/* Press bar */}
      <div className="border-b py-5">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-6 sm:gap-12 flex-wrap opacity-30">
          <span className="text-lg font-bold tracking-tight font-serif">CBC</span>
          <span className="text-lg font-bold tracking-tight italic">Globe&Mail</span>
          <span className="text-lg font-bold tracking-widest uppercase font-serif">TORONTO STAR</span>
          <span className="text-lg font-bold tracking-widest uppercase">MACLEAN'S</span>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <nav className="text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Business</Link>
          <span className="mx-1">/</span>
          <Link to="/" className="hover:text-foreground">Services</Link>
          <span className="mx-1">/</span>
          <span className="text-primary font-medium">{name}</span>
        </nav>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Description */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Need help finding a {name} professional?</h2>
          <p className="text-muted-foreground mb-4">
            You can find the best {name} professionals on QMAPS. Start your search and get free quotes now!
          </p>
          <p className="text-muted-foreground mb-4 text-sm">
            First time looking for a {name} professional and not sure where to start? Tell us about your project and we'll send you a list of {name} professionals to review. There's no pressure to hire, so you can compare profiles, read previous reviews and ask for more information before you make your decision.
          </p>
          <p className="text-muted-foreground mb-6 text-sm">Best of all – it's completely free!</p>
          <Button onClick={handleStartRequest} className="rounded-full px-6">Find a {name} professional today</Button>
        </section>

        {/* Popular Categories (child categories with images) */}
        {childCategories.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-8">Popular Categories</h2>
            <div className="space-y-4">
              {childCategories.map((child) => (
                <button
                  key={child.id}
                  onClick={() => navigate(`/services/${child.slug}`)}
                  className="group w-full text-left rounded-xl overflow-hidden border border-border hover:border-primary hover:shadow-lg transition-all"
                >
                  <div className="relative aspect-[16/7] sm:aspect-[16/5] overflow-hidden">
                    <img
                      src={child.hero_image || fallbackImage}
                      alt={child.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                      <h3 className="text-lg sm:text-xl font-bold text-white">{child.name}</h3>
                    </div>
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">Start here →</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 3-Step How It Works */}
        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"><Search className="h-6 w-6 text-primary" /></div>
              <h3 className="font-bold text-foreground mb-2">Tell us what you need</h3>
              <p className="text-sm text-muted-foreground">Tell QMAPS what {name} service you need. We'll help you find professionals who can do the work for you.</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"><Star className="h-6 w-6 text-primary" /></div>
              <h3 className="font-bold text-foreground mb-2">Receive Free Quotes</h3>
              <p className="text-sm text-muted-foreground">You'll receive free quotes from the best professionals. Compare profiles, read reviews and ask for more information.</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"><ChevronRight className="h-6 w-6 text-primary" /></div>
              <h3 className="font-bold text-foreground mb-2">Choose your {name}</h3>
              <p className="text-sm text-muted-foreground">Pick the professional that's right for your needs. With access to reviews, profiles and pricing, find the perfect match.</p>
            </div>
          </div>
          <div className="text-center mt-6">
            <Button onClick={handleStartRequest} className="rounded-full px-6">Find a {name} professional near you</Button>
          </div>
        </section>

        {/* Popular Regions */}
        <section className="mb-12"><PopularRegions /></section>

        {/* Pick the best */}
        <section className="mb-12 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Pick the best</h2>
          <div className="flex items-center justify-center gap-1 mb-3">{[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-warning text-warning" />)}</div>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-6">
            Compare quotes from top {name} professionals near you on QMAPS. Get responses from trusted pros, read real reviews, compare prices and choose the best one.
          </p>
          <Button onClick={handleStartRequest} className="rounded-full px-8">Get quotes from {name} near you</Button>
        </section>

        {/* Average Price */}
        <section className="mb-12 bg-muted/50 rounded-xl p-6 md:p-8">
          <h2 className="text-xl font-bold text-foreground mb-2">The average price of {name} is</h2>
          <p className="text-3xl font-bold text-primary">C${category.base_credit_cost * 50}</p>
          <p className="text-sm text-muted-foreground mt-2">Prices vary based on location, project scope, and professional experience.</p>
        </section>

        {/* Reviews */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">Reviews</h2>
          <div className="flex items-center gap-2 mb-6">
            <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-warning text-warning" />)}</div>
            <span className="text-sm text-muted-foreground">4.89/560</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((r, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6">
                <div className="flex gap-0.5 mb-3">{[...Array(r.rating)].map((_, j) => <Star key={j} className="h-4 w-4 fill-warning text-warning" />)}</div>
                <p className="text-sm text-foreground mb-4">"{r.text}"</p>
                <p className="text-xs font-semibold text-muted-foreground">— {r.author}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related Services */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 underline decoration-1 underline-offset-4">Related services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedServices.map((s) => (
              <div key={s.title} className="rounded-xl overflow-hidden border border-border group cursor-pointer">
                <div className="aspect-[16/10] overflow-hidden"><img src={s.image} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" /></div>
                <div className="p-4"><h3 className="font-semibold text-foreground text-sm">{s.title}</h3></div>
              </div>
            ))}
          </div>
        </section>

        {/* Related Service Guides */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 underline decoration-1 underline-offset-4">Related service guides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedGuides.map((g) => (
              <div key={g.title} className="rounded-xl overflow-hidden border border-border group cursor-pointer">
                <div className="aspect-[16/9] overflow-hidden"><img src={g.image} alt={g.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" /></div>
                <div className="p-4"><h3 className="font-semibold text-foreground text-sm">{g.title}</h3></div>
              </div>
            ))}
          </div>
        </section>

        {/* Related Price Guides */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 underline decoration-1 underline-offset-4">Related price guides</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPriceGuides.map((p) => (
              <div key={p.title} className="rounded-xl overflow-hidden border border-border group cursor-pointer">
                <div className="aspect-[16/10] overflow-hidden"><img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" /></div>
                <div className="p-4"><h3 className="font-semibold text-foreground text-sm">{p.title}</h3></div>
              </div>
            ))}
          </div>
        </section>

        {/* All services tags */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">All services</h2>
          <div className="flex flex-wrap gap-2">
            {siblingCategories.map((cat) => (
              <Link key={cat.id} to={`/services/${cat.slug}`} className={`px-4 py-2 border rounded-full text-sm transition-colors ${cat.slug === slug ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}>
                {cat.name}
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">QMAPS FAQs</h2>
          <div className="space-y-4">
            {[
              { q: `How does QMAPS work for customers?`, a: `Simply tell us what service you need and where you're located. We'll match you with qualified professionals who will reach out with quotes.` },
              { q: `How do I hire the best ${name}?`, a: `Compare profiles, read reviews from previous customers, and ask professionals any questions you have.` },
              { q: `How much do ${name} services cost?`, a: `Prices vary based on project scope, location, and experience. Get quotes from multiple professionals to compare.` },
              { q: `What services does QMAPS provide?`, a: `QMAPS connects customers with professionals across hundreds of service categories.` },
            ].map((faq, i) => (
              <details key={i} className="border border-border rounded-lg">
                <summary className="px-4 py-3 cursor-pointer font-medium text-foreground hover:bg-muted/50">{faq.q}</summary>
                <p className="px-4 py-3 text-muted-foreground text-sm border-t">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12 border-t">
          <h2 className="text-2xl font-bold text-foreground mb-2">Get quotes from {name} professionals near you</h2>
          <p className="text-muted-foreground mb-6">Tell us about your project and we'll connect you with trusted professionals.</p>
          <Button onClick={handleStartRequest} size="lg">Get Started</Button>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
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
              <div className="flex gap-3 mt-2">
                <span className="text-sm opacity-70">𝕏</span>
                <span className="text-sm opacity-70">f</span>
                <span className="text-sm opacity-70">in</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm opacity-70 mb-6">
            <span>🇨🇦</span><span>Canada</span><ChevronRight className="h-3 w-3" />
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
