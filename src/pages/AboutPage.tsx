import { Link } from "react-router-dom";
import { ClipboardList, MessagesSquare, ShieldCheck, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  { icon: ClipboardList, title: "Describe your project", description: "Choose a service, answer a few questions and tell us where the work is. Posting a request is free." },
  { icon: MessagesSquare, title: "Hear from professionals", description: "Interested local professionals contact you and send quotes. You compare them in one place." },
  { icon: ShieldCheck, title: "Choose with confidence", description: "Accept the quote that suits you. Reviews marked verified come from customers who accepted that professional's quote." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <nav className="max-w-6xl mx-auto px-5 py-4 flex flex-wrap items-center justify-between gap-4" aria-label="Main">
          <Link to="/" className="font-bold text-xl text-primary">FLEXS</Link>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <Link to="/help" className="text-muted-foreground hover:text-foreground">Help</Link>
            <Link to="/pro" className="text-muted-foreground hover:text-foreground">For professionals</Link>
            <Link to="/auth/login" className="text-muted-foreground hover:text-foreground">Log in</Link>
            <Button asChild size="sm"><Link to="/post-job">Post a request</Link></Button>
          </div>
        </nav>
      </header>

      <main>
        <section className="bg-primary text-primary-foreground">
          <div className="max-w-4xl mx-auto px-5 py-16 md:py-24 text-center space-y-4">
            <h1 className="text-3xl md:text-5xl font-bold">Local projects. Independent professionals.</h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              FLEXS is a Canadian marketplace where people post a service request and compare quotes from local professionals, and where professionals find new customers.
            </p>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-5 py-14 space-y-8" aria-labelledby="how-it-works">
          <h2 id="how-it-works" className="text-2xl md:text-3xl font-bold text-center">How it works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map(({ icon: Icon, title, description }) => (
              <div key={title} className="border rounded-xl p-6 space-y-3">
                <Icon className="h-8 w-8 text-primary" aria-hidden="true" />
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
          <div className="text-center"><Button asChild size="lg"><Link to="/post-job">Post a request</Link></Button></div>
        </section>

        <section className="bg-muted/40 border-y">
          <div className="max-w-5xl mx-auto px-5 py-14 grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold">For professionals</h2>
              <p className="text-muted-foreground">
                Browse requests in your trade with the customer's details protected. When a request fits, use credits to unlock the contact, then message the customer and send a quote. The credit cost is shown before you unlock.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild><Link to="/pro">See how it works for professionals</Link></Button>
                <Button asChild variant="outline"><Link to="/help/credits">How credits work</Link></Button>
              </div>
            </div>
            <div className="border rounded-xl bg-background p-6 flex gap-4">
              <Coins className="h-8 w-8 text-primary shrink-0" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">You only spend credits on the requests you choose. If something is wrong with a request you unlocked, you can ask for a credit refund and the team reviews it.</p>
            </div>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-5 py-14 space-y-3 text-center">
          <h2 className="text-2xl md:text-3xl font-bold">Who we are</h2>
          <p className="text-muted-foreground">
            FLEXS is an independent marketplace in the GROUPE TAKATAK family of digital services, based in Montréal, Canada.
          </p>
          <p className="text-muted-foreground">
            Questions? Visit the <Link to="/help" className="text-primary underline">help centre</Link> or <Link to="/support" className="text-primary underline">contact support</Link>.
          </p>
        </section>
      </main>

      <footer className="border-t">
        <div className="max-w-6xl mx-auto px-5 py-6 flex flex-wrap justify-between gap-3 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} FLEXS</span>
          <div className="flex gap-4"><Link to="/help" className="hover:text-foreground">Help</Link><Link to="/cookies" className="hover:text-foreground">Cookies</Link><Link to="/support" className="hover:text-foreground">Support</Link></div>
        </div>
      </footer>
    </div>
  );
}
