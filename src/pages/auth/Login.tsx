import { errorMessage } from "@/lib/errors";
import { callbackUrl, customerReturnPath } from "@/lib/auth-navigation";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KeyRound, Link2, Lock, User } from "lucide-react";
import { Brand } from "@/components/fx/SiteHeader";
import { rememberSessionChoice } from "@/lib/session-choice";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = (location.state as { email?: string } | null)?.email || "";
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      rememberSessionChoice(keepSignedIn);
      navigate(customerReturnPath(new URLSearchParams(location.search).get("next")) ?? "/app/dashboard");
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Invalid credentials. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email first.");
      return;
    }
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
      toast.error(errorMessage(err, "Failed to send magic link."));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "apple") => {
    if (loading) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: callbackUrl(location.search) } });
      if (error) throw error;
    } catch { toast.error("This sign-in provider is unavailable. Use your password or a magic link."); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen flex-col bg-fx-soft">
      <div className="pt-5 pb-10 text-center"><Brand /></div>
      <div className="flex-1 px-2.5 pb-12 pt-[130px] md:pt-16">
        <div className="mx-auto w-full max-w-[420px] lg:max-w-[565px]">
          <div className="space-y-5 rounded-fx-xs bg-card px-5 pb-4 pt-4 lg:rounded-fx-md lg:border lg:border-fx-line lg:px-10 lg:pb-10 lg:pt-7">
            <h1 className="text-2xl text-fx-ink lg:text-6xl">Login</h1>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="login-email" className="sr-only">Email</label>
                <div className="relative"><span className="pointer-events-none absolute inset-y-px left-px hidden w-[42px] items-center justify-center rounded-l-fx-xs bg-fx-soft text-fx-secondary lg:flex"><User className="size-4" aria-hidden="true" /></span><Input id="login-email" type="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="h-[58px] rounded-fx-xs border-fx-muted px-5 lg:pl-[58px] text-base placeholder:text-fx-ink" required autoFocus={!initialEmail} /></div>
              </div>
              <div>
                <label htmlFor="login-password" className="sr-only">Password</label>
                <div className="relative"><span className="pointer-events-none absolute inset-y-px left-px hidden w-[42px] items-center justify-center rounded-l-fx-xs bg-fx-soft text-fx-secondary lg:flex"><Lock className="size-4" aria-hidden="true" /></span><Input id="login-password" type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="h-[58px] rounded-fx-xs border-fx-muted px-5 lg:pl-[58px] text-base placeholder:text-fx-ink" required autoFocus={!!initialEmail} /></div>
              </div>
              <label className="flex items-center gap-3 py-2 text-sm text-fx-ink">
                <input type="checkbox" checked={keepSignedIn} onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="size-[18px] appearance-none rounded-full border-2 border-primary checked:border-[6px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" />
                Keep me signed in
              </label>
              <Button type="submit" disabled={loading || !email.trim() || !password} className="h-[50px] w-full rounded-fx-xs text-base shadow-fx-button">
                <KeyRound className="hidden size-4 lg:block" aria-hidden="true" />{loading ? "Logging in…" : "Login"}
              </Button>
            </form>

            <button onClick={() => navigate(`/auth/forgot-password${location.search}`, { state: { email: email.trim() } })} className="block py-2 text-sm text-fx-muted hover:text-fx-ink">
              Forgot your password?
            </button>

            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-fx-line" /><span className="text-xs uppercase text-fx-muted">or</span><div className="h-px flex-1 bg-fx-line" />
            </div>

            <Button variant="outline" onClick={handleMagicLink} disabled={loading} className="h-[50px] w-full gap-2 rounded-fx-xs text-base lg:border-primary lg:text-primary">
              <Link2 className="hidden size-4 lg:block" aria-hidden="true" />Email me a sign-in link
            </Button>

            {/* No account yet: customers get one when they post a request; professionals start at the pro welcome. */}
            <p className="text-center text-sm text-fx-secondary">
              New to FLEXS? <a href="/post-job" className="text-primary underline">Post a request</a> to create your account, or <a href="/auth/welcome" className="text-primary underline">join as a professional</a>.
            </p>

            {/* Show only providers explicitly enabled for this deployment. */}
            {import.meta.env.VITE_AUTH_APPLE === "true" && <Button
              disabled={loading}
              onClick={() => handleSocialLogin("apple")}
              className="h-[50px] w-full rounded-fx-xs bg-black text-base text-white hover:bg-gray-900 gap-2"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Sign in with Apple
            </Button>}

            {/* Google */}
            {import.meta.env.VITE_AUTH_GOOGLE === "true" && <Button
              disabled={loading}
              onClick={() => handleSocialLogin("google")}
              className="h-[50px] w-full rounded-fx-xs text-base gap-2"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Login with Google
            </Button>}
          </div>
        </div>
      </div>
    </div>
  );
}
