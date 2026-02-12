import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Send, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function CheckEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = (location.state as any)?.email || "";
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
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      toast.success("Magic link sent! Check your email.");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend link");
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
          // Try to sign up instead
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });
          if (signUpError) throw signUpError;
          toast.success("Account created! Check your email to verify.");
        } else {
          throw error;
        }
      } else {
        navigate("/app/leads");
      }
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    navigate("/auth/welcome");
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col px-6 bg-background">
      {/* Back arrow */}
      <div className="pt-4">
        <button onClick={() => navigate("/auth/welcome")} className="text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-foreground leading-snug">
              You already have an account with FLEX'S, check your email to login
            </h1>

            <p className="text-primary font-semibold text-lg">{email}</p>
          </div>

          {/* Paper plane illustration */}
          <div className="flex justify-center py-4">
            <Send className="h-16 w-16 text-primary" />
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Not received the link?</p>
            <Button
              onClick={handleResend}
              disabled={resending}
              className="w-full h-12 text-base font-semibold rounded-xl"
            >
              {resending ? "Sending…" : "Send another link"}
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
              Sign in with a password
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
