import { useEffect } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "@/components/fx/SiteHeader";
import SiteFooter from "@/components/fx/SiteFooter";
import { Button } from "@/components/ui/button";

/** Shown for any address that is not a FLEXS page. */
export default function NotFound() {
  useEffect(() => {
    document.title = "Page not found | FLEXS";
    // The host answers 200 for every address, so search engines are told here not to index unknown pages.
    const robots = document.createElement("meta"); robots.name = "robots"; robots.content = "noindex";
    document.head.appendChild(robots);
    return () => robots.remove();
  }, []);
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-gutter py-24 text-center">
        <p className="text-sm text-fx-muted">Error 404</p>
        <h1 className="mt-2 text-4xl text-fx-ink">Page not found</h1>
        <p className="mt-4 text-fx-secondary">This address does not lead to a FLEXS page. It may have moved, or the link may be incomplete.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild className="h-11 rounded-fx-xs px-6 shadow-fx-button"><Link to="/">Back to the home page</Link></Button>
          <Button asChild variant="outline" className="h-11 rounded-fx-xs px-6"><Link to="/post-job">Find a professional</Link></Button>
          <Button asChild variant="outline" className="h-11 rounded-fx-xs px-6"><Link to="/help">Help centre</Link></Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
