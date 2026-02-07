import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCircle2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const slides = [
  {
    icon: Bell,
    title: "Never miss a lead",
    description:
      "Receive instant notifications for all your leads, so you never miss potential new customers.",
    color: "bg-accent text-primary",
  },
  {
    icon: CheckCircle2,
    title: "Respond in seconds",
    description:
      "Be the first to contact new leads with one-tap responses.",
    color: "bg-accent text-primary",
  },
  {
    icon: PenLine,
    title: "Send quotes on the move",
    description:
      "Win more work by sending accurate estimates quicker.",
    color: "bg-accent text-primary",
  },
];

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  const completeOnboarding = async () => {
    if (user) {
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id);
    }
    navigate("/app/leads", { replace: true });
  };

  const handleContinue = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6">
        <h2 className="text-lg font-bold text-foreground">
          Welcome to FLEX'S
        </h2>
        <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
          Skip
        </Button>
      </div>

      {/* Slide content */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div
          className={`mb-8 flex h-24 w-24 items-center justify-center rounded-full ${slide.color}`}
        >
          <Icon className="h-12 w-12" />
        </div>

        <h1 className="mb-3 text-2xl font-bold text-foreground">{slide.title}</h1>
        <p className="max-w-xs text-muted-foreground leading-relaxed">
          {slide.description}
        </p>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 pb-6">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === currentSlide
                ? "w-6 bg-primary"
                : "w-2 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>

      {/* Continue button */}
      <div className="px-6 pb-8">
        <Button
          onClick={handleContinue}
          className="w-full h-12 text-base font-semibold rounded-xl"
        >
          {currentSlide === slides.length - 1 ? "Get started" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
