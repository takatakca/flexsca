import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Welcome() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      navigate("/auth/check-email", { state: { email: email.trim() } });
    } catch (err: any) {
      const msg = err.message || "We failed to verify your request. If the problem persists, please contact support.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Error banner */}
      {error && (
        <div className="bg-destructive px-4 py-3">
          <p className="text-sm text-destructive-foreground font-medium">
            {error}
          </p>
        </div>
      )}

      {/* Logo */}
      <div className="pt-8 pb-4 text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground italic">
          FLEXS
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-12">
        <div className="w-full max-w-sm mx-auto space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Welcome to FLEXS for professionals 👨‍🔧
            </h1>
            <p className="text-muted-foreground text-base">
              Enter your email to start looking for your next job!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 text-base rounded-xl border-border"
              required
              autoFocus
            />

            <Button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full h-12 text-base font-semibold rounded-xl"
            >
              {loading ? "Sending…" : "Let's Go!"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
