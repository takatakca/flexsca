import SiteHeader from "@/components/fx/SiteHeader";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

// No affiliate programme is running yet: this page must not promise commissions or payouts.
export default function AffiliatePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="max-w-2xl mx-auto px-5 py-16 space-y-5 text-center">
        <h1 className="text-3xl md:text-4xl font-bold">Partner with FLEXS</h1>
        <p className="text-muted-foreground">
          We are not running an affiliate or referral programme yet. If you run a website, community or business and would like to send customers or professionals to FLEXS, tell us about it and we will contact you when partnerships open.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild><Link to="/support">Contact us</Link></Button>
          <Button asChild variant="outline"><Link to="/pro">Join as a professional</Link></Button>
        </div>
      </main>
    </div>
  );
}
