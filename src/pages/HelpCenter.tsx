import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Search, ChevronDown, ChevronRight, ThumbsUp, ThumbsDown, Mail, Phone, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const sidebarArticles = [
  { title: "What is QMAPS Verified?", slug: "verified" },
  { title: "What is Elite Pro?", slug: "elite-pro" },
  { title: "What is Enquiries?", slug: "enquiries" },
  { title: "How many responses can a customer receive?", slug: "customer-responses" },
  { title: "How can I submit a general press enquiry?", slug: "press-enquiry" },
  { title: "Why am I missing Elite Pro features?", slug: "elite-pro-features" },
  { title: "Why Didn't I Get Hired?", slug: "why-not-hired" },
  { title: "Contact FLEX'S customer support", slug: "contact-support" },
  { title: "Banned Reviews Policy", slug: "banned-reviews" },
  { title: "Chat Guidelines: Keeping Conversations Safe and Professional", slug: "chat-guidelines" },
  { title: "Safeguarding and Welfare", slug: "safeguarding" },
  { title: "Reporting fraud as a trusted flagger", slug: "reporting-fraud" },
  { title: "Illegal Content", slug: "illegal-content" },
  { title: "Misuse of QMAPS - FAQ", slug: "misuse-faq" },
];

const relatedArticles: Record<string, string[]> = {
  "chat-guidelines": [
    "Safeguarding and Welfare at QMAPS",
    "Contact QMAPS customer support",
    "I have had an issue with a professional, what should I do?",
    "How do I set up or claim my Google Business Profile?",
    "Banned Reviews Policy",
  ],
  "banned-reviews": [
    "Contact QMAPS customer support",
    "Chat Guidelines: Keeping Conversations Safe and Professional",
    "Setting a chip and PIN on QMAPS",
    "Reporting fraud as a trusted flagger on QMAPS",
    "Are professional profiles verified on QMAPS?",
  ],
};

interface ArticleContent {
  title: string;
  toc: string[];
  body: React.ReactNode;
  prevArticle?: { title: string; slug: string };
  nextArticle?: { title: string; slug: string };
}

function BannedReviewsContent() {
  return (
    <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
      <h2 id="introduction" className="text-xl font-bold text-foreground">1. Introduction</h2>
      <p>
        Every professional on QMAPS relies on reviews from genuine customers to build and maintain
        credible reputations on the platform. The integrity of our review system is fundamental to
        creating a trusted marketplace where users can make informed decisions. This policy is
        designed to ensure that reviews are authentic and that reviewer conduct aligns with our
        guidelines. It aligns with the Online Safety Act 2023 and our Terms of Service.
      </p>

      <h2 id="purpose" className="text-xl font-bold text-foreground">2. Purpose</h2>
      <p>The purpose of this policy is to:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Protect users from false, fraudulent, or misleading reviews</li>
        <li>Define what constitutes a "banned review" on QMAPS</li>
        <li>Clarify the proactive and reactive measures we take to detect and remove bad reviews</li>
        <li>Detail the investigation process and penalties for those who violate this policy</li>
        <li>Ensure our processes are transparent, fair, and legally compliant</li>
      </ul>
      <p>
        This policy will be reviewed annually or more frequently if significant changes to applicable
        laws or regulations take place.
      </p>

      <h2 id="definition" className="text-xl font-bold text-foreground">3. A Definition of a Banned Review</h2>
      <p>
        Bans prohibit the reviewer or the author of the review from ever using QMAPS. A review will be classified as a "Banned Review" if
        it fulfils any of the following criteria:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Fraudulent Reviews: A review that contains a false or misleading portrayal of an experience with a seller or
          their service. This includes reviews posted by the seller themselves, or individuals who have
          not interacted with the seller, or were not genuine buyers, or had no legitimate connection to the service.</li>
        <li>Coerced or Incentivised Reviews: A review that has been submitted because the reviewer was incentivised, pressured, or
          rewarded. This also includes a paid, written, and provided review that uses review-for-review or review-for-access
          schemes.</li>
        <li>Review Spam: Reviews left in bulk.</li>
        <li>Offensive, misleading, or spam language.</li>
        <li>Hate Speech.</li>
        <li>Harassment or any other violations of any other individual.</li>
        <li>Scam, spam, or abusive content, on any part of this platform.</li>
      </ul>

      <h2 id="incentivised" className="text-xl font-bold text-foreground">4. Incentivised reviews</h2>
      <p>
        Attempting to offer gifts, coupons, or rewards to get positive reviews, or requesting that a customer
        only leave positive feedback, is strictly prohibited. All reviews should be genuine and reflect honest experience. Using
        fake, duplicate accounts to write false reviews is also a violation. QMAPS also monitors all "no review" and "un-verified"
        reviews and these have been cross-checked.
      </p>

      <h2 id="proactive" className="text-xl font-bold text-foreground">5. Proactive Detection & Prevention</h2>
      <p>QMAPS employs proactive tools to prevent false reviews from reaching its platform. These measures include:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Automated Detection Systems: Automated moderation tools check reviews for patterns that indicate false or inaccurate
          recommendations. This includes cross-referencing reviewers against known fake accounts.</li>
        <li>Review Throttling: To prevent a single review from skewing ratings or rankings, reviews from the same device or account
          are capped within a set time frame to reduce the likelihood of coordinated review manipulation.</li>
        <li>Third-Party Review Auditors: For reviews imported from external sources like Google, we use
          machine learning tools to verify that the reviews are authentic and that these reviews were correctly assigned to the
          verified profile.</li>
        <li>Monitoring teams: Our dedicated Quality Assurance Monitoring team regularly reviews content to identify and
          prevent any users who are taking part in any review manipulation across platforms, apps, websites, or
          third-party tools.</li>
      </ul>

      <h2 id="reactive" className="text-xl font-bold text-foreground">6. Reactive Measures & User Reporting</h2>
      <p>
        In addition to our automated reviews, any user (whether a buyer or professional) may flag a review that violates our
        review policy.
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Reporting Mechanisms: A user may report a review directly from the relevant profile on QMAPS. At the
          time of writing, the review can only be reported using the flag feature or via Contact Support.</li>
        <li>A Review Report will include a reason for the submission, which is then assessed by our Customer
          Experience teams. The review report is risk assessed immediately. The risk and impact report is
          used to calculate the severity of the violation. Fraudulent and spam investigations require access to a
          log of time, account reports, and therefore such reports include AI flagged metrics. Full access to
          data and access to user contacts are reserved for cases approved by our Compliance team.</li>
      </ul>

      <h2 id="investigation" className="text-xl font-bold text-foreground">7. Investigation Process</h2>
      <p>
        When a review is flagged or proactively identified through one of our proactive systems for any type of
        review violation, the review is processed using the following procedure:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Evidence Gathering: The review's metadata is collected, including timestamps of the author's activity,
          the report type or type of indications, and any related customer complaints or other activity from
          the reporter.</li>
        <li>Contextual Review: Our teams will evaluate the full conversation history, the nature of the claim, timing,
          and a profile analysis to determine any suspicious activity.</li>
        <li>Decision: Based on the investigation, QMAPS will either uphold the review (or confirm its authenticity), remove
          it (if it violates the policy), or escalate it (to legal or another team) in a situation where a platform ban is
          deemed the most suitable option.</li>
      </ul>

      <h2 id="sanctions" className="text-xl font-bold text-foreground">8. Sanctions for Policy Violations</h2>
      <p>
        Sellers and buyers who post or facilitate banned reviews will face sanctions ranging from a review and/or account
        warning, suspension, or a permanent ban from the website.
      </p>
      <p>
        QMAPS reserves the right to take legal proceedings and take enforcement action on its users in line with
        the review or systematic violations, and to seek recovery of any losses incurred by us or our clients.
      </p>

      <h2 id="appeals" className="text-xl font-bold text-foreground">9. Appeals Process</h2>
      <p>
        Sellers and buyers that receive sanctions against their account have the right to appeal the sanctions.
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Submitting an Appeal: An appeal must be submitted in writing by email to the appeals team within
          a period of 30 days. The appeal should include a detailed breakdown of your business case
          explaining the reason you feel your review was wrongly flagged or removed.</li>
        <li>Review: Appeals are reviewed by the Reputation and Compliance Executive, who will make a
          final decision.</li>
        <li>Outcome: Based on the appeal, the review may be reinstated, remain removed, the penalty may still
          remain in place, or an alternative resolution may be agreed by both parties.</li>
      </ul>

      <h2 id="reviews-complaints" className="text-xl font-bold text-foreground">10. Reviews and Complaints</h2>
      <p>
        It is important to state that reviews from complete company blackouts are not treated as violations, nor
        are genuine negative reviews of a service experience. However, if you're not happy with your
        company's review, QMAPS will be happy to explain our process and clarify the difference between
        our complaints process and a banned review. Individuals who believe their account has been unfairly affected or have
        concerns about their review should contact our Customer Support team.
      </p>

      <h2 id="transparency" className="text-xl font-bold text-foreground">11. Transparency & Policy Review</h2>
      <p>
        This policy will be made publicly available to all users of the QMAPS platform (and shall
        be available under "Trust and Terms" or "Website/Safety" sections). We welcome input from users on any new or
        continued updates on the platform, including feedback about content quality and the effectiveness of review processes.
        Updates to the policy are published with clear versioning dates and details.
      </p>

      <div className="border-t border-border pt-4 mt-8">
        <p className="text-sm text-muted-foreground">Updated 3 months ago</p>
      </div>

      <div className="flex justify-between pt-4 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground">Previous article</p>
          <Link to="/help/misuse-faq" className="text-sm text-primary hover:underline">
            I don't want to receive these reviews/leads anymore?
          </Link>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Next article</p>
          <Link to="/help/chat-guidelines" className="text-sm text-primary hover:underline">
            Chat Guidelines: Keeping Conversations Safe and Professional
          </Link>
        </div>
      </div>
    </div>
  );
}

function ChatGuidelinesContent() {
  return (
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

      <div className="flex justify-between pt-4 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground">Previous article</p>
          <Link to="/help/banned-reviews" className="text-sm text-primary hover:underline">Banned Reviews Policy</Link>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Next article</p>
          <Link to="/help/safeguarding" className="text-sm text-primary hover:underline">Safeguarding and Welfare at QMAPS</Link>
        </div>
      </div>
    </div>
  );
}

function ContactSupportContent() {
  return (
    <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
      <div className="flex items-start gap-4 py-4 border-b border-border">
        <Mail className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
        <div>
          <a href="#" className="text-primary font-semibold hover:underline">Submit a request</a>
          <p className="text-sm text-muted-foreground">Reply by end of next working day</p>
        </div>
      </div>
      <div className="flex items-start gap-4 py-4 border-b border-border">
        <Mail className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
        <div>
          <a href="#" className="text-primary font-semibold hover:underline">Request a credit return</a>
          <p className="text-sm text-muted-foreground">Processed within 48 hours</p>
        </div>
      </div>
      <div className="flex items-start gap-4 py-4 border-b border-border">
        <Phone className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
        <div>
          <a href="tel:+15551234567" className="text-primary font-semibold hover:underline">1-555-123-4567</a>
          <p className="text-sm text-muted-foreground">24 hrs (Mon-Fri) / 8am-8pm (Weekends)</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">Updated 3 months ago</p>

      <div className="flex justify-between pt-4 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground">Previous article</p>
          <Link to="/help/why-not-hired" className="text-sm text-primary hover:underline">Why Didn't I Get Hired?</Link>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Next article</p>
          <Link to="/help/banned-reviews" className="text-sm text-primary hover:underline">Submit a request to connect with professionals</Link>
        </div>
      </div>
    </div>
  );
}

const articleData: Record<string, { title: string; toc: string[]; Content: () => React.ReactNode }> = {
  "banned-reviews": {
    title: "Banned Reviews Policy",
    toc: ["Introduction", "Purpose", "A Definition of a Banned Review", "Incentivised reviews", "Proactive Detection & Prevention", "Reactive Measures & User Reporting", "Investigation Process", "Sanctions for Policy Violations", "Appeals Process", "Reviews and Complaints", "Transparency & Policy Review"],
    Content: BannedReviewsContent,
  },
  "chat-guidelines": {
    title: "Chat Guidelines: Keeping Conversations Safe and Professional",
    toc: ["Using Chat the Right Way", "Why We Moderate Chats", "How Chat Moderation Works", "What We Look Out For", "What Happens If You Break the Rules", "Personal Data"],
    Content: ChatGuidelinesContent,
  },
  "contact-support": {
    title: "Contact FLEX'S customer support",
    toc: [],
    Content: ContactSupportContent,
  },
};

export default function HelpCenter() {
  const { slug } = useParams();
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const activeSlug = slug || "chat-guidelines";
  const article = articleData[activeSlug];
  const related = relatedArticles[activeSlug] || relatedArticles["chat-guidelines"];

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
              {sidebarArticles.map((a) => (
                <li key={a.slug}>
                  <Link
                    to={`/help/${a.slug}`}
                    className={`block text-sm px-3 py-2 rounded-lg transition-colors ${
                      a.slug === activeSlug
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {a.title}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>

          {/* Article */}
          <article className="flex-1 max-w-3xl">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
              {article?.title || "Article not found"}
            </h1>

            {article && (
              <>
                {/* Table of Contents */}
                <div className="mb-8">
                  <h2 className="font-semibold text-foreground mb-3">In This Article</h2>
                  <ul className="space-y-1">
                    {article.toc.map((item) => (
                      <li key={item}>
                        <a href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} className="text-sm text-primary hover:underline">
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <article.Content />
              </>
            )}

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
                {related.map((a) => (
                  <li key={a}>
                    <a href="#" className="text-sm text-primary hover:underline">{a}</a>
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
