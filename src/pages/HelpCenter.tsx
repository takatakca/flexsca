import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronDown, ChevronRight, ThumbsUp, ThumbsDown, Mail, Phone, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const sidebarArticles = [
  { title: "Banned Review Policy", slug: "banned-reviews" },
  { title: "Chat Guidelines: Keeping Conversations Safe and Professional", slug: "chat-guidelines", active: true },
  { title: "Safeguarding and Welfare", slug: "safeguarding" },
  { title: "Reporting fraud as a trusted flagger", slug: "reporting-fraud" },
  { title: "Illegal Content", slug: "illegal-content" },
  { title: "Misuse of QMAPS - FAQ", slug: "misuse-faq" },
];

const relatedArticles = [
  "Safeguarding and Welfare at QMAPS",
  "Contact QMAPS customer support",
  "I have had an issue with a professional, what should I do?",
  "How do I set up or claim my Google Business Profile?",
  "Banned Reviews Policy",
];

export default function HelpCenter() {
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xl font-bold text-primary">QMAPS</Link>
            <span className="text-sm text-muted-foreground hidden md:block">Help Center</span>
          </div>
          <nav className="hidden md:flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tell us how we can help..."
                className="pl-10 w-64"
              />
            </div>
            <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              Categories <ChevronDown className="h-4 w-4" />
            </button>
            <Link to="/auth/login" className="text-sm text-muted-foreground hover:text-foreground">Login to QMAPS</Link>
          </nav>
          <button className="md:hidden"><Menu className="h-6 w-6" /></button>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Tell us how we can help..."
              className="pl-12 h-12 text-base rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <nav className="text-sm text-muted-foreground">
          <Link to="/help" className="hover:text-foreground">Help Centre</Link>
          <span className="mx-2">/</span>
          <span className="hover:text-foreground">Professionals</span>
          <span className="mx-2">/</span>
          <span className="text-primary font-medium">Trust And Safety</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Articles in this section</h3>
            <ul className="space-y-1">
              {sidebarArticles.map((article) => (
                <li key={article.slug}>
                  <Link
                    to={`/help/${article.slug}`}
                    className={`block text-sm px-3 py-2 rounded-lg transition-colors ${
                      article.active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {article.title}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>

          {/* Article */}
          <article className="flex-1 max-w-3xl">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
              Chat Guidelines: Keeping Conversations Safe and Professional
            </h1>

            {/* Table of Contents */}
            <div className="mb-8">
              <h2 className="font-semibold text-foreground mb-3">In This Article</h2>
              <ul className="space-y-1">
                {["Using Chat the Right Way", "Why We Moderate Chats", "How Chat Moderation Works", "What We Look Out For", "What Happens If You Break the Rules", "Personal Data"].map((item) => (
                  <li key={item}>
                    <a href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} className="text-sm text-primary hover:underline">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
              <p>
                At QMAPS, we are committed to creating a safe and respectful environment where users can
                connect for genuine service enquiries. To help ensure this, we actively moderate in-app chats to
                prevent misuse, abusive behaviour, and fraud.
              </p>

              <h2 id="using-chat-the-right-way" className="text-xl font-bold text-foreground">Using Chat the Right Way</h2>
              <p>
                To get the most out of QMAPS and avoid any issues, users should only use the chat to discuss real
                job enquiries. All communication should remain polite, honest, and professional.
              </p>

              <h2 id="why-we-moderate-chats" className="text-xl font-bold text-foreground">Why We Moderate Chats</h2>
              <p>
                We moderate messages to protect users from harmful or misleading content, to keep
                conversations focused on legitimate service discussions, and to prevent the platform from being
                misused for scams. This helps maintain trust and safety for both buyers & professionals using QMAPS.
              </p>

              <h2 id="how-chat-moderation-works" className="text-xl font-bold text-foreground">How Chat Moderation Works</h2>
              <p>
                Our moderation system uses a combination of automated technology and human review.
                Automated filters scan chats in real time for high-risk or inappropriate content. Users can also
                report any concerning messages they receive by selecting the "report" option in the chat line. If a
                message is flagged by either our system or a user, it is reviewed by a member of our Trust & Safety
                team, who assesses the full context and decides if any action is needed.
              </p>

              <h2 id="what-we-look-out-for" className="text-xl font-bold text-foreground">What We Look Out For</h2>
              <p>We may take action on any messages that contain:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>offensive,</li>
                <li>threatening,</li>
                <li>or discriminatory language.</li>
              </ul>
              <p>
                We strictly prohibit scams, ads, impersonation, repeated spam messaging, or anything that
                violates our Terms and Conditions. These types of behaviours may result in consequences
                for the sender.
              </p>

              <h2 id="what-happens-if-you-break-the-rules" className="text-xl font-bold text-foreground">What Happens If You Break the Rules</h2>
              <p>
                If a user sends a message that violates our guidelines or our Terms and Conditions, they may
                receive a written warning explaining the issue. In more serious or repeated cases, we may
                temporarily suspend the user's account. For severe violations such as fraud or abuse, we reserve
                the right to permanently ban the account and, if necessary, report the matter to the relevant
                authorities. Users will always be notified if a message is removed or flagged, and they may appeal
                any decision within seven days.
              </p>

              <h2 id="personal-data" className="text-xl font-bold text-foreground">Personal Data</h2>
              <p>
                When making a request, please ensure that you only share the information that is essential for
                fulfilling that request. It is important to protect your privacy & security by avoiding the disclosure
                of sensitive data, such as payment card details, personal identification information, or any financial
                data.
              </p>

              <div className="border-t border-border pt-4 mt-8">
                <p className="text-sm text-muted-foreground">The QMAPS Team</p>
                <p className="text-xs text-muted-foreground">Updated 3 months ago</p>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Previous article</p>
                  <a href="#" className="text-sm text-primary hover:underline">Banned Reviews Policy</a>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Next article</p>
                  <a href="#" className="text-sm text-primary hover:underline">Safeguarding and Welfare at QMAPS</a>
                </div>
              </div>
            </div>

            {/* Helpful */}
            <div className="text-center py-8 border-t border-border mt-8">
              <p className="text-sm text-foreground mb-3">Was this article helpful?</p>
              <div className="flex justify-center gap-3">
                <Button
                  variant={helpful === true ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHelpful(true)}
                >
                  Yes
                </Button>
                <Button
                  variant={helpful === false ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHelpful(false)}
                >
                  No
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">902 out of 2092 found this helpful</p>
              <p className="text-sm text-muted-foreground mt-4">
                Have more questions? <a href="#" className="text-primary hover:underline">Submit a request</a>
              </p>
            </div>

            {/* Related Articles */}
            <div className="border-t border-border pt-6">
              <h3 className="font-bold text-foreground mb-3">Related articles</h3>
              <ul className="space-y-2">
                {relatedArticles.map((article) => (
                  <li key={article}>
                    <a href="#" className="text-sm text-primary hover:underline">{article}</a>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        </div>
      </div>

      {/* Get in Touch */}
      <section className="border-t border-border py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-6">Get in touch</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-border rounded-xl p-6 flex items-start gap-4">
              <Mail className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-foreground">Contact us</h3>
                <p className="text-sm text-muted-foreground">Submit a request</p>
              </div>
            </div>
            <div className="border border-border rounded-xl p-6 flex items-start gap-4">
              <Phone className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-foreground">Contact us</h3>
                <p className="text-sm text-muted-foreground">Submit a request</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-primary text-primary-foreground py-12 text-center px-4">
        <h2 className="text-2xl font-bold mb-4">Can't find what you're looking for?</h2>
        <Button variant="secondary" className="rounded-full px-8">Submit a Request</Button>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-8 px-4 text-center">
        <div className="flex justify-center gap-4 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Back to QMAPS</Link>
          <span>·</span>
          <a href="#" className="hover:text-foreground">Terms & Conditions</a>
          <span>·</span>
          <a href="#" className="hover:text-foreground">Privacy policy</a>
        </div>
      </footer>
    </div>
  );
}
