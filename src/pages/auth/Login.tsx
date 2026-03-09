import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = (location.state as any)?.email || "";
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);
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
      navigate("/app/leads");
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Logo */}
      <div className="pt-8 pb-4 text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground italic">
          FLEXS
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-12">
        <div className="w-full max-w-sm mx-auto space-y-8">
          <h1 className="text-3xl font-bold text-foreground">Login</h1>

          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 text-base rounded-xl"
              required
              autoFocus={!initialEmail}
            />

            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 text-base rounded-xl"
              required
              autoFocus={!!initialEmail}
            />

            <label className="flex items-center gap-2.5 cursor-pointer">
              <Checkbox
                checked={keepSignedIn}
                onCheckedChange={(v) => setKeepSignedIn(v === true)}
                className="h-5 w-5 rounded-full border-2"
              />
              <span className="text-sm text-foreground">Keep Me Signed in</span>
            </label>

            <Button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="w-full h-12 text-base font-semibold rounded-xl"
            >
              {loading ? "Logging in…" : "Login"}
            </Button>
          </form>

          <button
            onClick={() => toast.info("Password reset coming soon.")}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Forget Your Password?
          </button>
        </div>
      </div>
    </div>
  );
}
