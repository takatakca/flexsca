import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Users,
  Puzzle,
  Lightbulb,
  Heart,
  Briefcase,
  MapPin,
  Building,
  Globe,
  Plane,
  Coffee,
  Laptop,
  GraduationCap,
  HeartHandshake,
  Calendar,
  PartyPopper,
  Menu,
  User,
  ChevronRight,
  Play,
} from "lucide-react";

const values = [
  {
    icon: Users,
    title: "More Fun Together",
    description: "We believe in collaboration and building strong relationships with our team and customers.",
  },
  {
    icon: Puzzle,
    title: "Execute with Excellence",
    description: "We strive for excellence in everything we do, from product development to customer service.",
  },
  {
    icon: Lightbulb,
    title: "Find a Way",
    description: "We're problem solvers who embrace challenges and find creative solutions.",
  },
  {
    icon: Heart,
    title: "Think Big",
    description: "We dream big and push boundaries to create meaningful impact in the world.",
  },
];

const hubs = [
  {
    name: "UK",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=400&fit=crop",
    description: "Our headquarters in London, where it all started.",
  },
  {
    name: "Berlin",
    image: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=600&h=400&fit=crop",
    description: "Our European hub driving innovation across the continent.",
  },
  {
    name: "Australia",
    image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600&h=400&fit=crop",
    description: "Serving the Asia-Pacific region from Sydney.",
  },
  {
    name: "India",
    image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&h=400&fit=crop",
    description: "Our technology and operations center.",
  },
  {
    name: "Germany",
    image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=600&h=400&fit=crop",
    description: "Expanding our presence in central Europe.",
  },
  {
    name: "Canada",
    image: "https://images.unsplash.com/photo-1517090504586-fde19ea6066f?w=600&h=400&fit=crop",
    description: "Growing strong in the North American market.",
  },
];

const teams = [
  { name: "Engineering", icon: Laptop },
  { name: "Product", icon: Lightbulb },
  { name: "Design", icon: Puzzle },
  { name: "Marketing", icon: Globe },
  { name: "Sales", icon: Briefcase },
  { name: "Operations", icon: Building },
];

const perks = [
  { icon: Laptop, title: "Remote-friendly", description: "Work from anywhere with flexible arrangements" },
  { icon: Coffee, title: "Unlimited PTO", description: "Take the time you need to recharge" },
  { icon: GraduationCap, title: "Learning Budget", description: "Annual budget for courses and conferences" },
  { icon: HeartHandshake, title: "Health Insurance", description: "Comprehensive medical, dental, and vision" },
  { icon: Calendar, title: "Flexible Hours", description: "Work when you're most productive" },
  { icon: PartyPopper, title: "Team Events", description: "Regular socials, offsites, and celebrations" },
  { icon: Building, title: "Modern Offices", description: "Beautiful spaces in major cities" },
  { icon: Heart, title: "Parental Leave", description: "Generous leave for new parents" },
];

const faqs = [
  {
    question: "How does FLEXS's hiring process work?",
    answer: "Our hiring process typically includes an initial call, a skills assessment, team interviews, and a final conversation with leadership. We aim to make decisions within 2-3 weeks.",
  },
  {
    question: "What is the culture like at FLEXS?",
    answer: "We're a diverse, inclusive team that values collaboration, innovation, and work-life balance. We believe in empowering our employees to do their best work.",
  },
  {
    question: "Does FLEXS offer remote work options?",
    answer: "Yes! We offer flexible remote and hybrid work arrangements depending on the role and team needs.",
  },
  {
    question: "What growth opportunities are available?",
    answer: "We invest heavily in employee development through mentorship, learning budgets, and clear career progression paths.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary">
            FLEXS
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

      {/* Hero */}
      <section className="bg-primary text-white py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">A platform for growth</h1>
          <p className="text-xl text-white/80 mb-8">Connecting people with the right professionals</p>
          <div className="flex justify-center gap-4">
            <Button variant="secondary" className="bg-white text-primary hover:bg-gray-100">
              Explore Careers
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white/10">
              Watch Video
            </Button>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-4">
            The people behind the platform
          </h2>
          <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
            FLEXS is built by a passionate team dedicated to connecting customers with the best professionals.
            We're on a mission to make hiring trusted help simple and reliable.
          </p>
          <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 shadow-xl">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=675&fit=crop"
              alt="Team"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <button className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors shadow-lg">
                <Play className="h-8 w-8 text-primary ml-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-4">Our Values</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            The principles that guide everything we do
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <value.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-sm text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Hubs */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-4">Our Hubs</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            We're a global company with teams around the world
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hubs.map((hub) => (
              <div key={hub.name} className="group relative rounded-xl overflow-hidden">
                <img
                  src={hub.image}
                  alt={hub.name}
                  className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-xl font-bold text-white mb-1">{hub.name}</h3>
                  <p className="text-sm text-white/80">{hub.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Teams */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-4">Our Teams</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Join one of our world-class teams
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {teams.map((team) => (
              <div
                key={team.name}
                className="bg-primary/5 rounded-xl p-6 text-center hover:bg-primary/10 transition-colors cursor-pointer"
              >
                <team.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <span className="text-sm font-medium text-gray-900">{team.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey Timeline */}
      <section className="py-16 md:py-24 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">Our Journey</h2>
          <p className="text-center text-white/80 mb-12 max-w-2xl mx-auto">
            From startup to global marketplace
          </p>
          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/30 -translate-x-1/2 hidden md:block" />
            <div className="space-y-8 md:space-y-0 md:grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plane className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">2015</h3>
                <p className="text-sm text-white/80">Founded in London with a mission to revolutionize local services</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">2019</h3>
                <p className="text-sm text-white/80">Expanded to 8 countries and reached 5 million customers</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">Today</h3>
                <p className="text-sm text-white/80">Serving millions of customers with trusted professionals worldwide</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our People Stats */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12">Our People</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl md:text-5xl font-bold text-primary mb-2">500+</p>
              <p className="text-gray-600">Team members</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold text-primary mb-2">40+</p>
              <p className="text-gray-600">Nationalities</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold text-primary mb-2">6</p>
              <p className="text-gray-600">Global offices</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold text-primary mb-2">50%</p>
              <p className="text-gray-600">Work remotely</p>
            </div>
          </div>
        </div>
      </section>

      {/* Perks & Benefits */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-4">Perks & Benefits</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            We take care of our team so they can focus on doing their best work
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {perks.map((perk) => (
              <div key={perk.title} className="bg-white rounded-xl p-6 shadow-sm">
                <perk.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">{perk.title}</h3>
                <p className="text-sm text-gray-600">{perk.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-4">FLEXS FAQs</h2>
          <p className="text-center text-gray-600 mb-12">Common questions about working at FLEXS</p>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <details key={idx} className="border border-gray-200 rounded-lg group">
                <summary className="px-4 py-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-50 flex items-center justify-between">
                  {faq.question}
                  <ChevronRight className="h-5 w-5 text-gray-400 group-open:rotate-90 transition-transform" />
                </summary>
                <p className="px-4 py-4 text-gray-600 text-sm border-t">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Already working at FLEXS?</h2>
          <p className="text-white/80 mb-8">
            Help us find great people to join our team. Refer a friend and earn rewards.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/60 w-full sm:w-80"
            />
            <Button className="bg-white text-primary hover:bg-gray-100">
              Get Referral Link
            </Button>
          </div>
          <div className="flex justify-center gap-6 mt-8">
            <a href="#" className="text-white/60 hover:text-white">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
            <a href="#" className="text-white/60 hover:text-white">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} FLEXS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
