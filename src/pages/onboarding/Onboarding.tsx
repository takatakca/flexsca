import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCircle2, PenLine, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Slide {
  title: string;
  description: string;
  render: () => React.ReactNode;
}

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  const slides: Slide[] = [
    {
      title: "Never miss a lead",
      description:
        "Receive instant notifications for all your leads, so you never miss potential new customers.",
      render: () => (
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent text-primary">
          <Bell className="h-12 w-12" />
        </div>
      ),
    },
    {
      title: "Respond in seconds",
      description:
        "Be the first to contact new leads with one-tap responses.",
      render: () => (
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent text-primary">
          <CheckCircle2 className="h-12 w-12" />
        </div>
      ),
    },
    {
      title: "Send quotes on the move",
      description:
        "Win more work by sending accurate estimates quicker.",
      render: () => (
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent text-primary">
          <PenLine className="h-12 w-12" />
        </div>
      ),
    },
    {
      title: "Set reminders on leads",
      description:
        "Hold down on a lead card anywhere in the app to set a custom reminder and start receiving notifications.",
      render: () => <ReminderSlideVisual />,
    },
  ];

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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Skip button */}
      <div className="flex items-center justify-end px-6 pt-6">
        <button
          onClick={handleSkip}
          className="text-sm font-medium text-primary hover:underline"
        >
          Skip
        </button>
      </div>

      {/* Title */}
      <div className="px-6 pt-4">
        <h1 className="text-2xl font-bold text-foreground">{slide.title}</h1>
      </div>

      {/* Visual */}
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        {slide.render()}
      </div>

      {/* Bottom text */}
      <div className="px-6 text-center">
        <h2 className="text-xl font-bold text-foreground mb-2">
          {currentSlide === 3 ? "Push and hold to set a reminder" : slide.title}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
          {slide.description}
        </p>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 py-6">
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

/* ── Visual for the "Set reminders" slide ── */

function ReminderSlideVisual() {
  return (
    <div className="relative w-full max-w-[280px]">
      {/* Mock lead card */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/80 text-primary-foreground text-sm font-bold">
              B
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground">Barnabas</p>
            <p className="text-xs text-muted-foreground">Camden Town, NW1</p>
          </div>
          <div className="ml-auto h-4 w-12 rounded bg-muted" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-3/4 rounded bg-muted" />
          <div className="h-3 w-2/3 rounded bg-muted" />
          <div className="h-8 w-full rounded bg-muted/70" />
          <div className="h-3 w-1/2 rounded bg-muted" />
        </div>

        {/* Pulse indicator (long-press point) */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
          <div className="h-8 w-8 rounded-full bg-primary/20 animate-pulse flex items-center justify-center">
            <div className="h-4 w-4 rounded-full bg-primary/40" />
          </div>
        </div>
      </div>

      {/* "Set reminder" tooltip */}
      <div className="absolute -right-2 top-[55%] bg-card border border-border rounded-lg shadow-lg px-3 py-2 flex items-center gap-2">
        <BellRing className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-foreground whitespace-nowrap">
          Set reminder
        </span>
      </div>

      {/* Hand icon (pointing finger) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/4 text-3xl">
        👆
      </div>
    </div>
  );
}
