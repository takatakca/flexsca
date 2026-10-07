import { errorMessage } from "@/lib/errors";
import { callbackUrl, customerReturnPath } from "@/lib/auth-navigation";
import { useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function CheckEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = (location.state as { email?: string } | null)?.email || "";
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl(location.search),
        },
      });
      if (error) throw error;
      toast.success("Magic link sent! Check your email.");
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Failed to resend link"));
    } finally {
      setResending(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: callbackUrl(location.search),
            },
          });
          if (signUpError) throw signUpError;
          toast.success("Account created! Check your email to verify.");
        } else {
          throw error;
        }
      } else {
        navigate(customerReturnPath(new URLSearchParams(location.search).get("next")) ?? "/app/dashboard");
      }
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return <Navigate to={`/auth/welcome${location.search}`} replace />;
  }

  return (
    <div className="flex min-h-screen flex-col px-6 bg-background">
      {/* Back arrow */}
      <div className="pt-4">
        <button onClick={() => navigate("/auth/welcome")} className="text-foreground">
          <ArrowLeft className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-foreground leading-snug">
              You already have an account with FLEXS, check your email to login
            </h1>
            <p className="text-primary font-semibold text-lg">{email}</p>
          </div>

          {/* Paper plane illustration */}
          <div className="flex justify-center py-6">
            <div className="relative">
              <svg width="120" height="80" viewBox="0 0 120 80" fill="none" className="text-primary">
                <path d="M10 50 Q30 20 50 40 Q70 60 90 30" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" fill="none" opacity="0.4"/>
                <path d="M80 15 L110 25 L95 45 L80 15Z" fill="currentColor"/>
                <path d="M80 15 L95 45 L85 30Z" fill="currentColor" opacity="0.7"/>
              </svg>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Not Received The Link?</p>
            <Button
              onClick={handleResend}
              disabled={resending}
              className="w-full h-12 text-base font-semibold rounded-xl"
            >
              {resending ? "Sending…" : "Send Another Link"}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">OR</span>
            </div>
          </div>

          {!showPassword ? (
            <Button
              variant="outline"
              onClick={() => setShowPassword(true)}
              className="w-full h-12 text-base font-medium rounded-xl text-primary border-primary"
            >
              Sign In With a Password
            </Button>
          ) : (
            <form onSubmit={handlePasswordLogin} className="space-y-3">
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 text-base rounded-xl"
                autoFocus
                required
              />
              <Button
                type="submit"
                disabled={loading || !password}
                className="w-full h-12 text-base font-semibold rounded-xl"
              >
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
