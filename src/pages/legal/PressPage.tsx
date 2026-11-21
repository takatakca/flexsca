import { useEffect } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "@/components/fx/SiteHeader";
import SiteFooter from "@/components/fx/SiteFooter";
import { Button } from "@/components/ui/button";

/** Press page (frame 62:1423): a band with the title, then how to reach the team. FLEXS has no press releases yet, so none are shown. */
export default function PressPage() {
  useEffect(() => { document.title = "Press | FLEXS"; }, []);
  return (
    <div className="min-h-screen bg-background text-fx-ink">
      <SiteHeader />
      <main>
        <section className="bg-gradient-to-br from-[hsl(var(--fx-ink))] to-[hsl(var(--fx-ink-secondary))] px-gutter py-24 text-center"><h1 className="text-4xl text-white md:text-[52px]">Connect with us</h1></section>
        <section className="bg-fx-soft px-gutter py-12 text-center">
          <div className="mx-auto max-w-2xl space-y-5">
            <p>The FLEXS team is glad to talk with journalists about local services in Quebec and the FLEXS marketplace.</p>
            <p>For a media enquiry, open a support ticket and choose "I need help with something else". Say which publication you write for and your deadline.</p>
            <p>For help with an account or a request, use the help centre.</p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button asChild className="h-11 rounded-fx-xs px-6 shadow-fx-button"><Link to="/support">Contact us</Link></Button>
              <Button asChild variant="outline" className="h-11 rounded-fx-xs bg-white px-6"><Link to="/about">About FLEXS</Link></Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
