import { customerReturnPath } from "@/lib/auth-navigation";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (session) {
          const next = customerReturnPath(new URLSearchParams(location.search).get("next"));
          if (next) { navigate(next, { replace: true }); return; }
          // Check if user has completed onboarding
          const { data: profile } = await supabase
            .from("profiles")
            .select("onboarding_completed")
            .eq("id", session.user.id)
            .single();

          if (profile?.onboarding_completed) {
            navigate("/app/dashboard", { replace: true });
          } else {
            navigate("/onboarding", { replace: true });
          }
        } else {
          navigate("/auth/welcome", { replace: true });
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        navigate("/auth/welcome", { replace: true });
      }
    };

    handleCallback();
  }, [navigate, location.search]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Signing you in…</p>
      </div>
    </div>
  );
}
