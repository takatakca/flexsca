import { Link, useLocation } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import SiteHeader from "@/components/fx/SiteHeader";
import SiteFooter from "@/components/fx/SiteFooter";
import { Button } from "@/components/ui/button";

/** Shown once a request has been recorded. Says what happens next, without promising a match. */
export default function JobSuccess() {
  const state = useLocation().state as { categoryName: string; requestId?: string; email?: string } | null;
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col items-center px-gutter py-20 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success"><CheckCircle2 className="h-10 w-10 text-white" aria-hidden="true" /></div>
        <h1 className="text-[28px] leading-tight text-fx-ink">Request submitted</h1>
        <p className="mt-3 text-fx-secondary">Your <span className="text-fx-ink">{state?.categoryName || "service"}</span> request is posted. Professionals who offer it in your area can now reply with their quotes.</p>
        <p className="mt-3 text-sm text-fx-muted">Posting is free. {state?.email ? <>Sign in with <span className="text-fx-ink">{state.email}</span> to follow your request and reply to professionals.</> : "Sign in with the same email to follow your request and reply to professionals."}</p>
        <div className="mt-8 w-full max-w-xs space-y-3">
          <Button asChild className="h-[50px] w-full rounded-fx-xs text-base shadow-fx-button"><Link to={`/my-requests${state?.requestId ? `/${state.requestId}` : ""}`}>Track my request <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link></Button>
          <Button asChild variant="outline" className="h-[50px] w-full rounded-fx-xs text-base"><Link to="/post-job">Post another request</Link></Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
