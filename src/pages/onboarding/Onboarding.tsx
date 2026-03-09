import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCircle2, PenLine, BellRing, Clock, Check, AlertCircle, ChevronDown, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Slide {
  topTitle: string;
  bottomTitle: string;
  description: string;
  render: () => React.ReactNode;
}

const MOCK_REMINDERS = [
  { name: "Barnabas", location: "Shoreditch, E1 6AN", initial: "B", color: "bg-primary", label: "Lead", due: "Overdue by 2 days", overdue: true },
  { name: "Bob", location: "Greenwich, SE10 9LS", initial: "B", color: "bg-[hsl(68,60%,50%)]", label: "Response", due: "Due in 4 hrs", overdue: false },
  { name: "Jean", location: "Hackney, E8 1EA", initial: "J", color: "bg-destructive", label: "Response", due: "Due in 6 hrs", overdue: false },
  { name: "John", location: "Stratford, E15 2TF", initial: "J", color: "bg-[hsl(68,60%,50%)]", label: "Response", due: "Due in 1 week", overdue: false },
];

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  const slides: Slide[] = [
    {
      topTitle: "Never miss a lead",
      bottomTitle: "Never miss a lead",
      description: "Receive instant notifications for all your leads, so you never miss potential new customers.",
      render: () => (
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent text-primary">
          <Bell className="h-12 w-12" />
        </div>
      ),
    },
    {
      topTitle: "Respond in seconds",
      bottomTitle: "Respond in seconds",
      description: "Be the first to contact new leads with one-tap responses.",
      render: () => (
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent text-primary">
          <CheckCircle2 className="h-12 w-12" />
        </div>
      ),
    },
    {
      topTitle: "Send quotes on the move",
      bottomTitle: "Send quotes on the move",
      description: "Win more work by sending accurate estimates quicker.",
      render: () => (
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent text-primary">
          <PenLine className="h-12 w-12" />
        </div>
      ),
    },
    {
      topTitle: "Set reminders on leads",
      bottomTitle: "One stop",
      description: "When you set reminders, we'll store them all in your new Reminders tab.",
      render: () => <RemindersTabVisual />,
    },
    {
      topTitle: "Set reminders on leads",
      bottomTitle: "Push and hold to set a reminder",
      description: "Hold down on a lead card anywhere in the app to set a custom reminder and start receiving notifications.",
      render: () => <ReminderLongPressVisual />,
    },
    {
      topTitle: "Custom statuses are here!",
      bottomTitle: "Create and set custom statuses",
      description: "Bring more organisation to your workflow by customising lead statuses that reflect your own workflow.",
      render: () => <CustomStatusesVisual />,
    },
    {
      topTitle: "Custom statuses are here!",
      bottomTitle: "Easy access",
      description: "Create and manage your custom statuses from the leads drop-down menu",
      render: () => <CustomStatusesDropdownVisual />,
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
        <button onClick={handleSkip} className="text-sm font-medium text-primary hover:underline">
          Skip
        </button>
      </div>

      {/* Top title */}
      <div className="px-6 pt-4 pb-2">
        <h1 className="text-2xl font-bold text-foreground">{slide.topTitle}</h1>
      </div>

      {/* Visual */}
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        {slide.render()}
      </div>

      {/* Bottom text */}
      <div className="px-6 text-center">
        <h2 className="text-xl font-bold text-foreground mb-2">{slide.bottomTitle}</h2>
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
              i === currentSlide ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>

      {/* Continue button */}
      <div className="px-6 pb-8">
        <Button onClick={handleContinue} className="w-full h-12 text-base font-semibold rounded-xl">
          {currentSlide === slides.length - 1 ? "Get started" : "Continue"}
        </Button>
      </div>
    </div>
  );
}

/* ── Slide 4: Mock Reminders Tab ── */

function RemindersTabVisual() {
  return (
    <div className="w-full max-w-[300px] rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Reminder list */}
      <div className="divide-y divide-border">
        {MOCK_REMINDERS.map((r, i) => (
          <div key={i} className="px-3 py-2.5">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] text-muted-foreground">{r.label}</span>
              <span className={`text-[10px] font-medium ${r.overdue ? "text-destructive" : "text-muted-foreground"}`}>
                · {r.due}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className={`${r.color} text-white text-xs font-bold`}>
                  {r.initial}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.location}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="h-7 w-7 rounded-full border border-border flex items-center justify-center">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="h-7 w-7 rounded-full border border-border flex items-center justify-center">
                  <Check className="h-3.5 w-3.5 text-primary" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mock bottom nav */}
      <div className="border-t border-border flex h-12 bg-muted/30">
        {[
          { label: "Leads", icon: "📋" },
          { label: "Responses", icon: "💬" },
          { label: "Reminders", icon: "🔔", active: true },
        ].map((tab) => (
          <div
            key={tab.label}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] ${
              tab.active ? "text-foreground font-semibold" : "text-muted-foreground"
            }`}
          >
            <span className="text-sm">{tab.icon}</span>
            <span>{tab.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Slide 5: Long-press gesture ── */

function ReminderLongPressVisual() {
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

        {/* Pulse indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
          <div className="h-8 w-8 rounded-full bg-primary/20 animate-pulse flex items-center justify-center">
            <div className="h-4 w-4 rounded-full bg-primary/40" />
          </div>
        </div>
      </div>

      {/* "Set reminder" tooltip */}
      <div className="absolute -right-2 top-[55%] bg-card border border-border rounded-lg shadow-lg px-3 py-2 flex items-center gap-2">
        <BellRing className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-foreground whitespace-nowrap">Set reminder</span>
      </div>

      {/* Hand icon */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/4 text-3xl">
        👆
      </div>
    </div>
  );
}

/* ── Slide 6: Custom Statuses ── */

function CustomStatusesVisual() {
  return (
    <div className="w-full max-w-[300px]">
      {/* Mock card with company + status flow */}
      <div className="rounded-2xl border border-border bg-card shadow-sm p-5 space-y-3">
        {/* Company header */}
        <div className="flex flex-col items-center gap-2">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[hsl(180,60%,50%)] to-[hsl(240,60%,60%)] flex items-center justify-center shadow-sm">
            <span className="text-2xl font-bold text-white">F</span>
          </div>
          <p className="text-sm font-bold text-foreground">ACME Inc.</p>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4].map((i) => (
              <Star key={i} className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" />
            ))}
            <Star className="h-4 w-4 fill-[#F59E0B]/40 text-[#F59E0B]" />
          </div>
        </div>

        {/* Status flow with dotted lines */}
        <div className="space-y-2 pl-2">
          {/* Status 1 */}
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-[#F59E0B] px-4 py-1.5 flex items-center gap-2">
              <span className="text-xs font-semibold text-white">Called once</span>
              <ChevronDown className="h-3 w-3 text-white" />
            </div>
          </div>

          {/* Dotted connector */}
          <div className="flex items-center gap-2 pl-6">
            <div className="border-l-2 border-dashed border-muted-foreground/30 h-4" />
          </div>

          {/* Status 2 */}
          <div className="flex items-center gap-2 pl-8">
            <span className="text-muted-foreground/40">▸</span>
            <div className="rounded-full bg-[#8B5CF6] px-4 py-1.5 flex items-center gap-2">
              <span className="text-xs font-semibold text-white">Need to follow-up</span>
              <ChevronDown className="h-3 w-3 text-white" />
            </div>
          </div>

          {/* Dotted connector */}
          <div className="flex items-center gap-2 pl-14">
            <div className="border-l-2 border-dashed border-muted-foreground/30 h-4" />
          </div>

          {/* Status 3 */}
          <div className="flex items-center gap-2 pl-16">
            <span className="text-muted-foreground/40">▸</span>
            <div className="rounded-full bg-[#22C55E] px-4 py-1.5 flex items-center gap-2">
              <span className="text-xs font-semibold text-white">Contract signed</span>
              <ChevronDown className="h-3 w-3 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Slide 7: Custom Statuses Dropdown (Easy access) ── */

const MOCK_STATUS_PILLS = [
  { label: "Hired", color: "#22C55E" },
  { label: "Need to schedule kickoff", color: "#6EE7B7" },
  { label: "Pending", color: "#F59E0B" },
  { label: "Called twice", color: "#FDE68A" },
  { label: "First project starting soon", color: "#F9A8D4" },
  { label: "Archived", color: "#9CA3AF" },
];

function CustomStatusesDropdownVisual() {
  return (
    <div className="w-full max-w-[300px]">
      <div className="rounded-2xl border border-border bg-card shadow-sm p-4 space-y-2.5">
        {/* Pending dropdown header */}
        <div className="rounded-xl bg-[#F59E0B] px-4 py-2.5 flex items-center justify-between">
          <span className="text-sm font-semibold text-white">Pending</span>
          <ChevronDown className="h-4 w-4 text-white" />
        </div>

        {/* Status pills */}
        <div className="space-y-1.5 pt-1">
          {MOCK_STATUS_PILLS.map((s) => (
            <div
              key={s.label}
              className="rounded-xl px-4 py-2.5 text-center text-xs font-semibold text-white"
              style={{ backgroundColor: s.color, color: s.color === "#FDE68A" ? "#78350f" : "white" }}
            >
              {s.label}
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="space-y-1.5 pt-1">
          <div className="rounded-xl border border-border py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-foreground">
            <span className="text-base">+</span> Create new
          </div>
          <div className="rounded-xl border border-border py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-foreground">
            <span className="text-base">✎</span> Manage all
          </div>
        </div>
      </div>
    </div>
  );
}
