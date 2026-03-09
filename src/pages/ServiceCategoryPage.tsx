import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Search, MapPin, ChevronRight, Star, Menu, User } from "lucide-react";
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
}

const popularCities = [
  { name: "Toronto", image: "https://images.unsplash.com/photo-1517090504586-fde19ea6066f?w=400&h=300&fit=crop" },
  { name: "Montreal", image: "https://images.unsplash.com/photo-1519178614-68673b201f36?w=400&h=300&fit=crop" },
  { name: "Calgary", image: "https://images.unsplash.com/photo-1476231682828-37e571bc172f?w=400&h=300&fit=crop" },
];

const reviews = [
  {
    rating: 5,
    text: "Absolutely fantastic service! The professional was knowledgeable, punctual, and delivered exactly what I needed. Highly recommend QMAPS!",
    author: "Sarah M.",
  },
  {
    rating: 5,
    text: "Finding a quality professional has never been easier. The platform made the whole process smooth and stress-free.",
    author: "Michael T.",
  },
  {
    rating: 4,
    text: "Great experience overall. Got connected with multiple professionals quickly and found the perfect match for my project.",
    author: "Jennifer L.",
  },
];

export default function ServiceCategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<CategoryFull | null>(null);
  const [allCategories, setAllCategories] = useState<CategoryFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceSearch, setServiceSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [showFlow, setShowFlow] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase
        .from("service_categories")
        .select("*")
        .eq("slug", slug || "")
        .eq("is_active", true)
        .single(),
      supabase
        .from("service_categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order")
        .limit(7),
    ]).then(([categoryRes, allRes]) => {
      if (categoryRes.data) {
        setCategory({
          ...categoryRes.data,
          questions: (categoryRes.data.questions as unknown as Question[]) || [],
        });
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
      setShowFlow(true);
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

  const categoryDisplayName = category.name;

  return (
    <div className="min-h-screen bg-white">
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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary">
            QMAPS
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <button className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
              Explore <ChevronRight className="h-4 w-4 rotate-90" />
            </button>
            <Link to="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">
              Login
            </Link>
            <Link
              to="/auth/welcome"
              className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-primary/90 flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Join as a Professional
            </Link>
          </nav>
          <button className="md:hidden">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=600&fit=crop)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
            Find {categoryDisplayName} professionals near you
          </h1>

          {/* Search Form */}
          <div className="max-w-xl mx-auto bg-white rounded-lg shadow-lg p-4 md:p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What service do you need?
                </label>
                <Input
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  placeholder={categoryDisplayName}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Where do you need it?
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    placeholder="Enter your postcode"
                    className="w-full pl-10"
                  />
                </div>
              </div>
              <Button
                onClick={handleStartRequest}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <nav className="text-sm text-gray-500">
          <Link to="/" className="hover:text-gray-700">
            Business
          </Link>
          <span className="mx-2">/</span>
          <Link to="/" className="hover:text-gray-700">
            Services
          </Link>
          <span className="mx-2">/</span>
          <span className="text-primary font-medium">{categoryDisplayName}</span>
        </nav>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Description */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Need help finding an {categoryDisplayName} professional?
          </h2>
          <p className="text-gray-600 mb-4">
            You can find the best {categoryDisplayName} professionals on QMAPS. Start your
            search and get free quotes now!
          </p>
          <p className="text-gray-600 mb-6">
            First time looking for an {categoryDisplayName} professional and not sure where to
            start? Tell us about your project and we'll send you a list of {categoryDisplayName}{" "}
            professionals to review. There's no pressure to hire, so you can compare profiles, read
            previous reviews and ask for more information before you make your decision.
          </p>
          <p className="text-gray-600 mb-6">Best of all – it's completely free!</p>
          <Button onClick={handleStartRequest} className="bg-primary hover:bg-primary/90">
            Find a {categoryDisplayName} professional today
          </Button>
        </section>

        {/* Popular Categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {allCategories.slice(0, 6).map((cat) => (
              <Link
                key={cat.id}
                to={`/services/${cat.slug}`}
                className="group relative aspect-[4/3] rounded-lg overflow-hidden"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                  style={{
                    backgroundImage: `url(https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=300&fit=crop)`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <span className="text-white font-medium text-sm">{cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Popular Cities */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Cities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {popularCities.map((city) => (
              <div
                key={city.name}
                className="relative aspect-[16/9] rounded-lg overflow-hidden group cursor-pointer"
              >
                <img
                  src={city.image}
                  alt={city.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-semibold text-lg">{city.name}</h3>
                  <Button
                    size="sm"
                    className="mt-2 bg-primary/90 hover:bg-primary text-white text-xs"
                  >
                    Search {city.name}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Average Price */}
        <section className="mb-12 bg-gray-50 rounded-xl p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            The average price of {categoryDisplayName} is
          </h2>
          <p className="text-3xl font-bold text-primary">C${category.base_credit_cost * 50}</p>
          <p className="text-sm text-gray-500 mt-2">
            Prices vary based on location, project scope, and professional experience.
          </p>
        </section>

        {/* Reviews */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Reviews</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((review, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm mb-4">"{review.text}"</p>
                <p className="text-sm font-medium text-gray-900">— {review.author}</p>
              </div>
            ))}
          </div>
        </section>

        {/* All Services */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">All services</h2>
          <div className="flex flex-wrap gap-2">
            {allCategories.map((cat) => (
              <Link
                key={cat.id}
                to={`/services/${cat.slug}`}
                className="px-4 py-2 border border-gray-300 rounded-full text-sm text-gray-700 hover:border-primary hover:text-primary transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">FLEXS FAQs</h2>
          <div className="space-y-4">
            <details className="border border-gray-200 rounded-lg">
              <summary className="px-4 py-3 cursor-pointer font-medium text-gray-900 hover:bg-gray-50">
                How does FLEXS work for customers?
              </summary>
              <p className="px-4 py-3 text-gray-600 text-sm border-t">
                Simply tell us what service you need and where you're located. We'll match you with
                qualified professionals who will reach out with quotes and information about their
                services.
              </p>
            </details>
            <details className="border border-gray-200 rounded-lg">
              <summary className="px-4 py-3 cursor-pointer font-medium text-gray-900 hover:bg-gray-50">
                How do I hire the best {categoryDisplayName}?
              </summary>
              <p className="px-4 py-3 text-gray-600 text-sm border-t">
                Compare profiles, read reviews from previous customers, and ask professionals any
                questions you have. Take your time to find the right fit for your project.
              </p>
            </details>
            <details className="border border-gray-200 rounded-lg">
              <summary className="px-4 py-3 cursor-pointer font-medium text-gray-900 hover:bg-gray-50">
                How much do {categoryDisplayName} services cost?
              </summary>
              <p className="px-4 py-3 text-gray-600 text-sm border-t">
                Prices vary based on the scope of your project, your location, and the
                professional's experience. Get quotes from multiple professionals to compare pricing.
              </p>
            </details>
            <details className="border border-gray-200 rounded-lg">
              <summary className="px-4 py-3 cursor-pointer font-medium text-gray-900 hover:bg-gray-50">
                What services does FLEXS provide?
              </summary>
              <p className="px-4 py-3 text-gray-600 text-sm border-t">
                FLEXS connects customers with professionals across hundreds of service categories,
                from home improvement to business services. Whatever you need, we can help you find
                the right professional.
              </p>
            </details>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12 border-t border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Get quotes from {categoryDisplayName} professionals near you
          </h2>
          <p className="text-gray-600 mb-6">
            Tell us about your project and we'll connect you with trusted professionals.
          </p>
          <Button onClick={handleStartRequest} size="lg" className="bg-primary hover:bg-primary/90">
            Get Started
          </Button>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">For Customers</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/" className="hover:text-white">Find a Professional</Link></li>
                <li><Link to="/" className="hover:text-white">How it works</Link></li>
                <li><Link to="/" className="hover:text-white">Login</Link></li>
                <li><Link to="/" className="hover:text-white">Mobile App</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Professionals</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/" className="hover:text-white">How it works</Link></li>
                <li><Link to="/" className="hover:text-white">Pricing</Link></li>
                <li><Link to="/auth/welcome" className="hover:text-white">Join as a Professional</Link></li>
                <li><Link to="/" className="hover:text-white">Help centre</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">About</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/about" className="hover:text-white">About FLEXS</Link></li>
                <li><Link to="/" className="hover:text-white">Careers</Link></li>
                <li><Link to="/" className="hover:text-white">Blog</Link></li>
                <li><Link to="/" className="hover:text-white">Press</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Need help?</h4>
              <Button className="bg-primary hover:bg-primary/90 text-white">
                Contact us
              </Button>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} FLEXS. All rights reserved.</p>
            <div className="flex justify-center gap-4 mt-4">
              <Link to="/" className="hover:text-gray-400">Terms & Conditions</Link>
              <Link to="/" className="hover:text-gray-400">Privacy Policy</Link>
              <Link to="/" className="hover:text-gray-400">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
