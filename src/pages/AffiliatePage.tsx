import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, User, Menu, DollarSign, Users, TrendingUp, Clock, Award, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Seo } from "@/seo/Seo";
import { ManageCookiesLink } from "@/consent/ManageCookiesLink";

const faqs = [
  { q: "Who is FLEX'S?", a: "FLEX'S is an online platform that connects customers who are looking for a wide variety of services with local professionals and businesses that can provide them — from cleaners to financial advisors." },
  { q: "What is the FLEX'S Affiliates programme?", a: "The FLEX'S Affiliates programme allows you to earn commissions by referring customers or professionals to FLEX'S. You earn for every verified lead or professional sign-up." },
  { q: "How do I sign up for the FLEX'S Affiliate programme?", a: "Simply click the 'Join FLEX'S Affiliate via AWin' button above and complete the registration process through our affiliate network." },
  { q: "How do I promote FLEX'S?", a: "You can promote FLEX'S through your website, blog, social media, email newsletters, or any other digital marketing channel using your unique affiliate links." },
  { q: "Do I need to reach a minimum threshold before getting paid?", a: "Yes, you need to reach a minimum of $50 in commissions before a payment is processed." },
  { q: "How often are commissions paid?", a: "Commissions are paid monthly, typically within 30 days of the end of each month." },
  { q: "What does a verified lead look like?", a: "A verified lead is when a customer submits a genuine service request through FLEX'S that is confirmed by our system." },
  { q: "How are leads attributed?", a: "Leads are attributed via cookies with a 30-day window from the last click on your affiliate link." },
];

export default function AffiliatePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="FLEX'S Affiliate Programme"
        description="Start earning by referring people who need service providers to do their everyday jobs"
        path="/affiliates"
      />
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary">FLEX'S</Link>
          <nav className="hidden md:flex items-center gap-6">
            <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              Explore <ChevronDown className="h-4 w-4" />
            </button>
            <Link to="/auth/login" className="text-sm text-muted-foreground hover:text-foreground">Login</Link>
            <Link to="/auth/welcome" className="bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-full hover:bg-primary/90 flex items-center gap-2">
              <User className="h-4 w-4" /> Join as a Professional
            </Link>
          </nav>
          <button className="md:hidden"><Menu className="h-6 w-6" /></button>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-background py-16 md:py-24 text-center px-4">
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">FLEX'S Affiliate Programme</h1>
        <p className="text-muted-foreground max-w-xl mx-auto mb-8">
          Start earning by referring people who need service providers to do their everyday jobs
        </p>
        <Button className="bg-primary hover:bg-primary/90 rounded-full px-8">
          Join FLEX'S Affiliate via AWin
        </Button>
      </section>

      {/* Two Options */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-border rounded-xl p-6">
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">Option 1</span>
            <h3 className="font-bold text-foreground mt-3 mb-2">Send us people looking for services</h3>
            <p className="text-sm text-muted-foreground">
              Up to $100/£80 for every project live and placed on our site from a customer who's clicked one of your affiliate links.
            </p>
          </div>
          <div className="border border-border rounded-xl p-6">
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">Option 2</span>
            <h3 className="font-bold text-foreground mt-3 mb-2">Send us professionals providing services</h3>
            <p className="text-sm text-muted-foreground">
              If the sign-up from a professional who's clicked on one of your affiliate links ≥ 20% of the revenue generated from them for the first 12 months.
            </p>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="bg-muted/30 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-12">Getting started is simple</h2>
          <div className="space-y-10">
            {[
              { step: 1, title: "Join the FLEX'S Affiliate program on AWin", desc: "Activate the FLEX'S programme via our affiliate platform. If you're new to AWin, sign up — it's free and takes minutes." },
              { step: 2, title: "Promote relevant services to your audience", desc: "Configure your marketing to direct traffic to FLEX'S. Use your own website or blog or social media. Tell your audience about the services they can find." },
              { step: 3, title: "Earn commission 💰", desc: "" },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 text-left">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{item.title}</h3>
                  {item.desc && <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>}
                </div>
              </div>
            ))}
          </div>
          <Button className="mt-8 bg-primary hover:bg-primary/90 rounded-full px-8">
            Join FLEX'S Affiliate via AWin
          </Button>
        </div>
      </section>

      {/* How FLEX'S Works */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-6">How FLEX'S works</h2>
        <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">
          <p>FLEX'S helps people find great local professionals or businesses for basically anything they're looking for.</p>
          <p>With over 1,500 service categories, customers submit projects and professionals compete to win their business. It's free for customers.</p>
          <p>On our side, service providers buy packs of credits on FLEX'S and use a specific fee when a customer's matching request pops up. Providers can view the project and decide whether they want to purchase that lead and contact the customer directly.</p>
          <p>These service providers buy packs of credits on FLEX'S that they use for reaching out to their prospective clients, giving them full control to build their own pipeline of new business.</p>
        </div>
      </section>

      {/* How Affiliates Get Paid */}
      <section className="bg-muted/30 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-6">How affiliates get paid</h2>
          <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">
            <p>We pay our affiliates for every lead or project that meets our criteria for attribution based on benefit to FLEX'S, including:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>all leads created/submitted via your tracking link are verified as genuine</li>
              <li>the lead gets at least one response from a professional within 30 days</li>
            </ul>
            <p>Our custom tracking lets us verify the total value of the lead created, of a category of the lead, with a payment of up to $100/£80 for the best performing categories.</p>
            <p>We process payments to affiliates twice per month, on the 10th and 20th, of each month via AWin's standard banking platform.</p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
          What are the benefits of being a FLEX'S Affiliate?
        </h2>
        <ul className="text-sm text-muted-foreground space-y-3 text-left max-w-lg mx-auto">
          <li className="flex gap-2"><span>•</span> Earn up to $100/£80 per verified project request</li>
          <li className="flex gap-2"><span>•</span> Big pots of large scale, real world service providers looking to invest in leads consistently</li>
          <li className="flex gap-2"><span>•</span> Earn commission in passing referrals, or use your knowledge, your lifestyle or your expertise</li>
          <li className="flex gap-2"><span>•</span> Your biggest ally — with a knowledgeable and responsive team, you'll have dedicated support 24/7</li>
          <li className="flex gap-2"><span>•</span> We're global, so you'll have plenty of choices of services and offers to send your traffic to</li>
        </ul>
      </section>

      {/* Right Fit */}
      <section className="bg-muted/30 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
            Are you the right fit as a FLEX'S Affiliate?
          </h2>
          <div className="space-y-6 text-left max-w-lg mx-auto">
            {[
              { title: "Content Producers", desc: "Do you run a podcast, have a news site, blog, or similar content platform such as a website, YouTube or similar? You could be a great fit." },
              { title: "Digital Brands", desc: "Online consumer-facing brands across similar categories." },
              { title: "Social Influencers", desc: "Looking for an easy direct offer your audience is sure to love?" },
              { title: "Marketers and Agencies", desc: "Direct traffic to validated offers, let us do the hard part, simple process and quick to convert." },
            ].map((item) => (
              <div key={item.title}>
                <h4 className="font-bold text-foreground">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
          <Button className="mt-8 bg-primary hover:bg-primary/90 rounded-full px-8">
            Join FLEX'S Affiliate via AWin
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-8">FAQ</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-border rounded-lg">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3 text-left font-medium text-foreground hover:bg-muted/50"
              >
                {faq.q}
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && (
                <p className="px-4 py-3 text-sm text-muted-foreground border-t border-border">{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">For Customers</h4>
              <ul className="space-y-2 text-sm opacity-60">
                <li><Link to="/" className="hover:opacity-100">Find a Professional</Link></li>
                <li><Link to="/" className="hover:opacity-100">How it works</Link></li>
                <li><Link to="/auth/login" className="hover:opacity-100">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Professionals</h4>
              <ul className="space-y-2 text-sm opacity-60">
                <li><Link to="/" className="hover:opacity-100">How it works</Link></li>
                <li><Link to="/" className="hover:opacity-100">Pricing</Link></li>
                <li><Link to="/auth/welcome" className="hover:opacity-100">Join as a Professional</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">About</h4>
              <ul className="space-y-2 text-sm opacity-60">
                <li><Link to="/about" className="hover:opacity-100">About FLEX'S</Link></li>
                <li><Link to="/affiliates" className="hover:opacity-100">Affiliates</Link></li>
                <li><Link to="/" className="hover:opacity-100">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Need help?</h4>
              <Button variant="outline" className="text-background border-background/30 hover:bg-background/10">Contact us</Button>
            </div>
          </div>
          <div className="border-t border-background/20 pt-8 text-center text-sm opacity-50">
            © {new Date().getFullYear()} FLEX'S. All rights reserved.
            <ManageCookiesLink className="ml-4 hover:underline" />
          </div>
        </div>
      </footer>
    </div>
  );
}
