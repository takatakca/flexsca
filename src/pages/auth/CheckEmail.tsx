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
    <div className="flex min-h-screen flex-col items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent">
            <Send className="h-10 w-10 text-primary" />
          </div>

          <h1 className="text-2xl font-bold text-foreground">
            Check your email to login
          </h1>

          <p className="text-muted-foreground">
            You already have an account with FLEX'S, check your email to login
          </p>

          <p className="text-primary font-semibold text-lg">{email}</p>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Not received the link?</p>
          <Button
            variant="outline"
            onClick={handleResend}
            disabled={resending}
            className="w-full h-11 rounded-xl"
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
            variant="ghost"
            onClick={() => setShowPassword(true)}
            className="w-full text-primary font-medium"
          >
            <Lock className="mr-2 h-4 w-4" />
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

        <Button
          variant="link"
          onClick={() => navigate("/auth/welcome")}
          className="text-muted-foreground"
        >
          ← Back to start
        </Button>
      </div>
    </div>
  );
}
