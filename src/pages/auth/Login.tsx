import { errorMessage } from "@/lib/errors";
import { callbackUrl, customerReturnPath } from "@/lib/auth-navigation";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Lock, Link2 } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = (location.state as { email?: string } | null)?.email || "";
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="flex min-h-screen flex-col bg-background">
      {/* Logo */}
      <div className="pt-8 pb-4 text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground italic">
          FLEXS
        </h2>
      </div>

      {/* Brand name */}
      <div className="text-center pb-4">
        <h1 className="text-3xl font-bold text-primary italic">FLEXS</h1>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-start px-6 pb-12">
        <div className="w-full max-w-sm mx-auto">
          {/* Login card */}
          <div className="border border-border rounded-xl p-6 space-y-5 bg-card">
            <h2 className="text-2xl font-bold text-foreground">Login</h2>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base rounded-xl pl-10"
                  required
                  autoFocus={!initialEmail}
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-base rounded-xl pl-10"
                  required
                  autoFocus={!!initialEmail}
                />
              </div>

              {/* Login button */}
              <Button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className="w-full h-12 text-base font-semibold rounded-xl gap-2"
              >
                <Link2 className="h-4 w-4" />
                {loading ? "Logging in…" : "Login"}
              </Button>
            </form>

            {/* Forgot password */}
            <button
              onClick={() => navigate(`/auth/forgot-password${location.search}`, { state: { email: email.trim() } })}
              className="text-sm text-primary hover:underline transition-colors"
            >
              Forgot your password?
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground uppercase">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Magic link */}
            <Button
              variant="outline"
              onClick={handleMagicLink}
              disabled={loading}
              className="w-full h-12 text-base font-semibold rounded-xl gap-2"
            >
              <Link2 className="h-4 w-4" />
              Login with a magic link
            </Button>

            {/* Show only providers explicitly enabled for this deployment. */}
            {import.meta.env.VITE_AUTH_APPLE === "true" && <Button
              disabled={loading}
              onClick={() => handleSocialLogin("apple")}
              className="w-full h-12 text-base font-semibold rounded-xl bg-black hover:bg-gray-900 text-white gap-2"
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
              className="w-full h-12 text-base font-semibold rounded-xl bg-[hsl(211,100%,50%)] hover:bg-[hsl(211,100%,45%)] text-white gap-2"
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
