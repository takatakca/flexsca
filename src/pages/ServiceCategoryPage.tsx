import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Search, MapPin, ChevronRight, Star, Menu, User, Loader2, FileText, CheckCircle, MessageSquare, X } from "lucide-react";
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

const reviews = [
  { rating: 5, text: "Absolutely fantastic service! The professional was knowledgeable, punctual, and delivered exactly what I needed. Highly recommend QMAPS!", author: "Sarah M." },
  { rating: 5, text: "Finding a quality professional has never been easier. The platform made the whole process smooth and stress-free.", author: "Michael T." },
  { rating: 4, text: "Great experience overall. Got connected with multiple professionals quickly and found the perfect match for my project.", author: "Jennifer L." },
];

// Category-specific related content images
const categoryRelatedImages: Record<string, { services: string[]; guides: string[]; priceGuides: string[] }> = {
  default: {
    services: [
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=400&h=250&fit=crop",
    ],
    guides: [
      "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1563986768609-322da13575f2?w=400&h=250&fit=crop",
    ],
    priceGuides: [
      "https://images.unsplash.com/photo-1553729459-afe8f2e2ed65?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=250&fit=crop",
    ],
  },
  financial: {
    services: [
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=250&fit=crop",
    ],
    guides: [
      "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop",
    ],
    priceGuides: [
      "https://images.unsplash.com/photo-1553729459-afe8f2e2ed65?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=250&fit=crop",
    ],
  },
  event: {
    services: [
      "https://images.unsplash.com/photo-1555244162-803834f70033?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=250&fit=crop",
    ],
    guides: [
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=250&fit=crop",
    ],
    priceGuides: [
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=250&fit=crop",
    ],
  },
  legal: {
    services: [
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1521791055366-0d553872125f?w=400&h=250&fit=crop",
    ],
    guides: [
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=250&fit=crop",
    ],
    priceGuides: [
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1521791055366-0d553872125f?w=400&h=250&fit=crop",
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=250&fit=crop",
    ],
  },
};

function getCategoryTheme(slug: string, parentSlug: string | null): string {
  const s = parentSlug || slug;
  if (s.includes("financial") || s.includes("tax") || s.includes("budget") || s.includes("valuation") || s.includes("pension") || s.includes("venture")) return "financial";
  if (s.includes("event") || s.includes("catering") || s.includes("coach") || s.includes("venue") || s.includes("entertainment")) return "event";
  if (s.includes("legal") || s.includes("lawyer") || s.includes("employment")) return "legal";
  return "default";
}

export default function ServiceCategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<CategoryFull | null>(null);
  const [parentCategory, setParentCategory] = useState<CategoryFull | null>(null);
  const [childCategories, setChildCategories] = useState<CategoryFull[]>([]);
  const [siblingCategories, setSiblingCategories] = useState<CategoryFull[]>([]);
  const [allCategories, setAllCategories] = useState<CategoryFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceSearch, setServiceSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [showFlow, setShowFlow] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setParentCategory(null);
    setSiblingCategories([]);

    Promise.all([
      supabase.from("service_categories").select("*").eq("slug", slug || "").eq("is_active", true).single(),
      supabase.from("service_categories").select("*").eq("parent_slug", slug || "").eq("is_active", true).order("sort_order"),
      supabase.from("service_categories").select("*").eq("is_active", true).order("sort_order"),
    ]).then(async ([categoryRes, childRes, allRes]) => {
      const mapCat = (c: any): CategoryFull => ({ ...c, questions: (c.questions as unknown as Question[]) || [] });

      if (categoryRes.data) {
        const cat = mapCat(categoryRes.data);
        setCategory(cat);
        setServiceSearch(cat.name);

        // Fetch parent category if this is a child
        if (cat.parent_slug) {
          const { data: parentData } = await supabase.from("service_categories").select("*").eq("slug", cat.parent_slug).eq("is_active", true).single();
          if (parentData) setParentCategory(mapCat(parentData));

          // Fetch siblings
          if (allRes.data) {
            setSiblingCategories(allRes.data.filter((c: any) => c.parent_slug === cat.parent_slug).map(mapCat));
          }
        }
      }
      if (childRes.data) setChildCategories(childRes.data.map(mapCat));
      if (allRes.data) setAllCategories(allRes.data.map(mapCat));
      setLoading(false);
    });
  }, [slug]);

  const handleStartRequest = () => {
    if (category) {
      setShowLoading(true);
      setTimeout(() => { setShowLoading(false); setShowFlow(true); }, 1500);
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
  const isParent = childCategories.length > 0;
  const isChild = !!category.parent_slug;
  const theme = getCategoryTheme(category.slug, category.parent_slug);
  const images = categoryRelatedImages[theme] || categoryRelatedImages.default;

  // Build "All services" tags — for child categories show siblings, for parents show children
  const tagCategories = isChild ? siblingCategories : isParent ? childCategories : allCategories.filter((c) => !c.parent_slug).slice(0, 12);

  // Dynamic related services from siblings (excluding current)
  const relatedFromSiblings = siblingCategories.filter((c) => c.slug !== slug).slice(0, 3);
  const relatedServicesData = relatedFromSiblings.length > 0
    ? relatedFromSiblings.map((c, i) => ({ title: c.name, image: c.hero_image || images.services[i] || fallbackImage, slug: c.slug }))
    : [
        { title: "Catering", image: images.services[0], slug: "catering" },
        { title: "Wedding Catering", image: images.services[1], slug: "wedding-catering" },
        { title: "Private Chef Services", image: images.services[2], slug: "private-chef-services" },
      ];

  // Breadcrumb
  const breadcrumbParts: { label: string; to?: string }[] = [{ label: "Business", to: "/" }];
  if (parentCategory) {
    breadcrumbParts.push({ label: parentCategory.name, to: `/services/${parentCategory.slug}` });
  } else if (isChild && category.parent_slug) {
    breadcrumbParts.push({ label: category.parent_slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()), to: `/services/${category.parent_slug}` });
  }
  breadcrumbParts.push({ label: name });

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
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t px-4 py-4 space-y-3 bg-background">
            <Link to="/post-job" className="block text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>Find a Pro</Link>
            <Link to="/about" className="block text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>About</Link>
            <Link to="/help" className="block text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>Help</Link>
            <Button size="sm" className="w-full" onClick={() => { setMobileMenuOpen(false); navigate("/auth/welcome"); }}>Join as a Pro</Button>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative bg-primary text-primary-foreground">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${category.hero_image || fallbackImage})` }}
        />
        <div className="relative max-w-7xl mx-auto px-4 py-14 md:py-20">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
            Find {name}<br className="sm:hidden" /> {isParent ? "professionals" : "experts"} near you
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
        <nav className="text-xs text-muted-foreground flex items-center flex-wrap gap-1">
          {breadcrumbParts.map((part, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span>/</span>}
              {part.to ? (
                <Link to={part.to} className="hover:text-foreground">{part.label}</Link>
              ) : (
                <span className="text-primary font-medium">{part.label}</span>
              )}
            </span>
          ))}
        </nav>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Description */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Need help finding {name.match(/^[aeiou]/i) ? "an" : "a"} {name} professional?
          </h2>
          <p className="text-muted-foreground mb-4">
            You can find the best {name} professionals on QMAPS. Start your search and get free quotes now!
          </p>
          <p className="text-muted-foreground mb-4 text-sm">
            First time looking for {name.match(/^[aeiou]/i) ? "an" : "a"} {name} professional and not sure where to start? Tell us about your project and we'll send you a list of {name} professionals to review. There's no pressure to hire, so you can compare profiles, read previous reviews and ask for more information before you make your decision.
          </p>
          <p className="text-muted-foreground mb-6 text-sm">Best of all – it's completely free!</p>
          <Button onClick={handleStartRequest} className="rounded-full px-6">
            Find {name.match(/^[aeiou]/i) ? "an" : "a"} {name} professional today
          </Button>
        </section>

        {/* Popular Categories (parent pages with children) */}
        {isParent && childCategories.length > 0 && (
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

        {/* For leaf (child) categories, show all sections */}
        {!isParent && (
          <>
            {/* 3-Step How It Works */}
            <section className="mb-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card border border-border rounded-xl p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"><FileText className="h-6 w-6 text-primary" /></div>
                  <h3 className="font-bold text-foreground mb-2">Tell us what you need</h3>
                  <p className="text-sm text-muted-foreground">Tell QMAPS what {name} service you need. We'll help you find professionals who can do the work for you.</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="h-6 w-6 text-primary" /></div>
                  <h3 className="font-bold text-foreground mb-2">Receive Free Quotes</h3>
                  <p className="text-sm text-muted-foreground">You'll receive free quotes from the best professionals. Compare profiles, read reviews and ask for more information.</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"><MessageSquare className="h-6 w-6 text-primary" /></div>
                  <h3 className="font-bold text-foreground mb-2">Choose your {name}</h3>
                  <p className="text-sm text-muted-foreground">Pick the professional that's right for your needs. With access to reviews, profiles and pricing, find the perfect match.</p>
                </div>
              </div>
              <div className="text-center mt-6">
                <Button onClick={handleStartRequest} className="rounded-full px-6">Find {name.match(/^[aeiou]/i) ? "an" : "a"} {name} professional near you</Button>
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

            {/* Related Services — dynamic from siblings */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6 underline decoration-1 underline-offset-4">Related services</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedServicesData.map((s) => (
                  <div
                    key={s.title}
                    onClick={() => s.slug && navigate(`/services/${s.slug}`)}
                    className="rounded-xl overflow-hidden border border-border group cursor-pointer"
                  >
                    <div className="aspect-[16/10] overflow-hidden">
                      <img src={s.image} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    </div>
                    <div className="p-4"><h3 className="font-semibold text-foreground text-sm">{s.title}</h3></div>
                  </div>
                ))}
              </div>
            </section>

            {/* Related Service Guides */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6 underline decoration-1 underline-offset-4">Related service guides</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: `What to expect when hiring ${name.match(/^[aeiou]/i) ? "an" : "a"} ${name}`, image: images.guides[0] },
                  { title: `How to find the best ${name} for your project`, image: images.guides[1] },
                ].map((g) => (
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
                {[
                  { title: `How much does ${name} cost?`, image: images.priceGuides[0] },
                  { title: `${name} pricing guide for businesses`, image: images.priceGuides[1] },
                  { title: `Average ${name} rates in Canada`, image: images.priceGuides[2] },
                ].map((p) => (
                  <div key={p.title} className="rounded-xl overflow-hidden border border-border group cursor-pointer">
                    <div className="aspect-[16/10] overflow-hidden"><img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" /></div>
                    <div className="p-4"><h3 className="font-semibold text-foreground text-sm">{p.title}</h3></div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* All services tags */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">All services</h2>
          <div className="flex flex-wrap gap-2">
            {tagCategories.map((cat) => (
              <Link key={cat.id} to={`/services/${cat.slug}`} className={`px-4 py-2 border rounded-full text-sm transition-colors ${cat.slug === slug ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}>
                {cat.name}
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12 border-t">
          <h2 className="text-2xl font-bold text-foreground mb-2">Get quotes from {name} near you</h2>
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
