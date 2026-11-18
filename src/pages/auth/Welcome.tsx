import { errorMessage } from "@/lib/errors";
import { callbackUrl, customerReturnPath } from "@/lib/auth-navigation";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Brand } from "@/components/fx/SiteHeader";

const SLIDES = [
  { title: "See new requests", text: "Customer requests in your trade and area appear in your workspace as they are posted." },
  { title: "Choose what you pay for", text: "Browse every request for free. Use credits only to unlock the customers you want to contact." },
  { title: "Quote and follow up", text: "Message customers, send quotes and set reminders, all in one place." },
];

export default function Welcome() {
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: callbackUrl(location.search),
        },
      });

      if (error) throw error;

      navigate(`/auth/check-email${location.search}`, { state: { email: email.trim() } });
    } catch (err: unknown) {
      const msg = errorMessage(err, "We failed to verify your request. If the problem persists, please contact support.");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (slide < SLIDES.length) {
    const current = SLIDES[slide];
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col bg-background px-gutter pb-8 pt-5 text-center">
        <div className="text-right"><button type="button" onClick={() => setSlide(SLIDES.length)} className="py-2 text-2xl text-fx-muted hover:text-fx-ink">Skip</button></div>
        <h1 className="mt-12 text-4xl leading-[1.25] text-fx-ink">Welcome to FLEXS for professionals <span aria-hidden="true">👨‍🔧</span></h1>
        <div className="mt-[190px] min-h-[150px]" aria-live="polite">
          <h2 className="text-[28px] text-fx-ink">{current.title}</h2>
          <p className="mx-auto mt-4 max-w-[350px] text-sm leading-6 text-fx-muted">{current.text}</p>
        </div>
        <div className="mt-6 flex justify-center gap-2.5" role="group" aria-label="Introduction steps">
          {SLIDES.map((item, index) => <button key={item.title} type="button" aria-label={`Step ${index + 1} of ${SLIDES.length}`} aria-current={index === slide ? "step" : undefined} onClick={() => setSlide(index)}
            className={`size-2.5 rounded-full ${index === slide ? "bg-primary" : "bg-accent"}`} />)}
        </div>
        <Button onClick={() => setSlide(slide + 1)} className="mt-auto h-[50px] w-full rounded-fx-xs text-base shadow-fx-button">Continue</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white from-40% to-[hsl(var(--fx-hero-to))]">
      {error && (
        <div role="alert" className="bg-[hsl(var(--fx-danger-banner))] px-gutter py-4"><p className="text-lg leading-snug text-white">{error}</p></div>
      )}
      <div className="pt-5 pb-4 text-center"><Brand /></div>
      <div className="flex flex-1 flex-col justify-center px-gutter pb-12">
        <div className="mx-auto w-full max-w-[380px] space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl leading-[1.25] text-fx-ink">Create your professional account</h1>
            <p className="text-base text-fx-muted">Enter your email and we will send you a sign-in link.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <label htmlFor="welcome-email" className="sr-only">Email</label>
            <Input id="welcome-email" type="email" autoComplete="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)}
              className="h-[58px] rounded-fx-xs border-fx-muted px-5 text-base" required autoFocus />
            <Button type="submit" disabled={loading || !email.trim()} className="h-[50px] w-full rounded-fx-xs text-base shadow-fx-button">
              {loading ? "Sending…" : "Send my sign-in link"}
            </Button>
          </form>
          <p className="text-sm text-fx-muted">Already registered? <button type="button" className="text-primary" onClick={() => navigate(`/auth/login${location.search}`)}>Login</button></p>
        </div>
      </div>
    </div>
  );
}
