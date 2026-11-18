import { useState } from "react";
import { Link } from "react-router-dom";
import { X, UserRound } from "lucide-react";

export function Brand({ className = "" }: { className?: string }) {
  return <Link to="/" aria-label="FLEXS home" className={`text-[26px] leading-none font-bold tracking-tight text-fx-ink ${className}`}>FLEXS</Link>;
}

const LINKS: [string, string][] = [
  ["/post-job", "Find a Pro"], ["/my-requests", "My requests"], ["/help", "Help centre"], ["/auth/login", "Sign in"], ["/pro", "For professionals"],
];

/** Shared top bar: wordmark left, menu right. One component for every public and customer screen. */
export default function SiteHeader({ tone = "plain" }: { tone?: "plain" | "soft" }) {
  const [open, setOpen] = useState(false);
  return (
    <header className={`sticky top-0 z-40 ${tone === "soft" ? "bg-fx-soft" : "bg-background"}`}>
      <nav aria-label="Main navigation" className="mx-auto max-w-6xl px-gutter">
        <div className="flex h-[66px] items-center justify-between border-b border-fx-line/60">
          <Brand />
          {/* Desktop (frame 2:2): section links beside the wordmark, sign-in and the professional pill on the right. */}
          <div className="ml-10 hidden flex-1 items-center gap-7 text-sm text-fx-ink md:flex">
            {LINKS.slice(0, 3).map(([to, label]) => <Link key={to} to={to} className="hover:text-primary">{label}</Link>)}
            <Link to="/directory" className="hover:text-primary">Directory</Link>
            <span className="flex-1" />
            <Link to="/auth/login" className="hover:text-primary">Sign in</Link>
            <Link to="/pro" className="inline-flex h-10 items-center gap-2 rounded-fx-pill bg-primary px-5 text-primary-foreground shadow-fx-button hover:bg-primary/90"><UserRound className="size-4" aria-hidden="true" />For professionals</Link>
          </div>
          <button type="button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-navigation"
            className="md:hidden grid size-11 place-items-end content-center -mr-1" onClick={() => setOpen(v => !v)}>
            {open ? <X className="size-7 text-fx-ink" /> : (
              <span aria-hidden="true" className="grid gap-[7px] justify-items-end pr-1">
                <span className="block h-[3px] w-8 rounded-full bg-fx-ink" /><span className="block h-[3px] w-6 rounded-full bg-fx-ink" /><span className="block h-[3px] w-8 rounded-full bg-fx-ink" />
              </span>
            )}
          </button>
        </div>
      </nav>
      {open && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="md:hidden border-b border-fx-line/60 bg-background px-gutter py-5 grid gap-4 text-lg text-fx-ink">
          {LINKS.map(([to, label]) => <Link key={to} to={to} onClick={() => setOpen(false)}>{label}</Link>)}
        </nav>
      )}
    </header>
  );
}
