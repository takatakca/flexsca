import { useNavigate } from "react-router-dom";
import { Smartphone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OpenInApp() {
  const navigate = useNavigate();

  const handleOpen = () => {
    // Future: attempt deep link first, e.g. window.location.href = "flexs://app/leads"
    navigate("/app/leads");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="mx-auto h-20 w-20 rounded-2xl bg-primary flex items-center justify-center">
          <Smartphone className="h-10 w-10 text-primary-foreground" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Open in FLEXS
          </h1>
          <p className="text-muted-foreground text-sm">
            You'll need to use the FLEXS for Professionals app to continue.
            Get the best experience with our mobile app.
          </p>
        </div>

        <Button
          onClick={handleOpen}
          className="w-full rounded-xl h-12 text-base font-semibold gap-2"
        >
          Open FLEXS app <ArrowRight className="h-5 w-5" />
        </Button>

        <p className="text-xs text-muted-foreground">
          Don't have the app?{" "}
          <button
            onClick={handleOpen}
            className="text-primary font-medium hover:underline"
          >
            Continue in browser
          </button>
        </p>
      </div>
    </div>
  );
}
