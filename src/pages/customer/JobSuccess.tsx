import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function JobSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { categoryName: string; requestId?: string; email?: string } | null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mb-6">
        <CheckCircle2 className="h-10 w-10 text-success" />
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-2">
        Request submitted! 🎉
      </h1>

      <p className="text-muted-foreground mb-2 max-w-sm">
        We're matching you with top{" "}
        <span className="font-medium text-foreground">
          {state?.categoryName || "service"}
        </span>{" "}
        professionals in your area.
      </p>

      <p className="text-sm text-muted-foreground mb-8 max-w-sm">
        Your request is free. Sign in with the same email to track it and manage conversations with professionals.
      </p>

      <div className="space-y-3 w-full max-w-xs">
        <Button
          size="lg"
          className="w-full h-12 rounded-xl text-base font-semibold"
          onClick={() => navigate("/post-job")}
        >
          Post another job <ArrowRight className="h-4 w-4 ml-2" />
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="w-full h-12 rounded-xl text-base"
          onClick={() => navigate(`/my-requests${state?.requestId ? `/${state.requestId}` : ""}`)}
        >
          Track my request
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-8">
        Powered by <span className="font-semibold text-primary">FLEXS</span>
      </p>
    </div>
  );
}
