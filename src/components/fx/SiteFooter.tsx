import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const GROUPS: { title: string; links: [string, string][] }[] = [
  { title: "For Customers", links: [["/post-job", "Find a Professional"], ["/directory", "Business directory"], ["/about", "How it works"], ["/auth/login", "Login"], ["/open-in-app", "Mobile App"]] },
  { title: "For Professionals", links: [["/pro", "How it works"], ["/help/credits", "Pricing"], ["/auth/welcome", "Join as a Professional"], ["/directory", "Claim your business"], ["/help", "Help centre"], ["/open-in-app", "Mobile App"]] },
  { title: "About", links: [["/about", "About FLEXS"], ["/affiliates", "Affiliates"]] },
];

/** Shared footer. Only links to pages that exist; no third-party ratings or press marks. */
export default function SiteFooter() {
  return (
    <footer className="bg-background">
      <div className="mx-auto max-w-6xl px-gutter py-14 grid gap-12 md:grid-cols-4 text-center md:text-left">
        {GROUPS.map(group => (
          <nav key={group.title} aria-label={group.title} className="grid gap-5 content-start">
            <h2 className="text-xl text-fx-ink">{group.title}</h2>
            {group.links.map(([to, label]) => <Link key={label} to={to} className="text-lg text-fx-muted hover:text-fx-ink">{label}</Link>)}
          </nav>
        ))}
        <div className="grid gap-5 content-start">
          <h2 className="text-[22px] text-fx-ink">Need help?</h2>
          <Button asChild className="h-[58px] rounded-fx-xs text-xl shadow-fx-button"><Link to="/support">Contact us</Link></Button>
          <p className="rounded-fx-xs bg-fx-soft px-5 py-4 text-xl text-fx-ink text-left"><span aria-hidden="true" className="mr-3">🇨🇦</span>Canada</p>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-gutter">
        <div className="border-t border-fx-line py-7 text-center text-xs text-fx-muted space-y-3">
          <p><Link to="/cookies" className="hover:text-fx-ink">Cookie policy</Link> / <Link to="/help/privacy" className="hover:text-fx-ink">Privacy and your data</Link></p>
          <p>© {new Date().getFullYear()} FLEXS. Part of GROUPE TAKATAK, Montréal.</p>
        </div>
      </div>
    </footer>
  );
}
