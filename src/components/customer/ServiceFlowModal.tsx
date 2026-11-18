import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { X, MapPin, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { contactSchema, submitLead } from "@/lib/lead-intake";

interface Question {
  id: string;
  label: string;
  subtitle?: string;
  type: "radio" | "checkbox" | "textarea" | "location" | "select";
  options: string[];
  required: boolean;
  hasOther?: boolean;
  placeholder?: string;
}

type AnswerValue = string | string[];

interface ServiceFlowModalProps {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  questions: Question[];
  /** Category photo shown as the strip at the top of each question, as in the design. */
  heroImage?: string | null;
  /** Town or postal code already typed on the page that opened the wizard. */
  initialLocation?: string;
  onClose: () => void;
}

type FlowStep =
  | "loading"
  | "questionnaire"
  | "loading-contact"
  | "matches-found"
  | "email-step"
  | "location-step"
  | "phone-step"
  | "name-step"
  | "welcome-back"
  | "details"
  | "loading-submit"
  | "success"
  | "quit-confirm";

export default function ServiceFlowModal({
  categoryId,
  categoryName,
  categorySlug,
  questions, heroImage, initialLocation,
  onClose,
}: ServiceFlowModalProps) {
  const navigate = useNavigate();
  const submitting = useRef(false);
  const submitRef = useRef<() => Promise<void>>();
  const [step, setStep] = useState<FlowStep>("loading");
  const [previousStep, setPreviousStep] = useState<FlowStep>("loading");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [otherText, setOtherText] = useState<Record<string, string>>({});
  const [otherChecked, setOtherChecked] = useState<Record<string, boolean>>({});

  // Contact fields
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [location, setLocation] = useState((initialLocation ?? "").slice(0, 120));

  // Details step
  const [detailsText, setDetailsText] = useState("");
  const [contactAsap, setContactAsap] = useState(true);
  const [receiveRemotely, setReceiveRemotely] = useState(true);

  // Initial loading
  useEffect(() => {
    if (step === "loading") {
      const timer = setTimeout(() => {
        if (questions.length > 0) {
          setStep("questionnaire");
        } else {
          setStep("location-step");
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [step, questions.length]);

  // Loading between steps
  useEffect(() => {
    if (step === "loading-contact") {
      const timer = setTimeout(() => setStep("matches-found"), 500);
      return () => clearTimeout(timer);
    }
    if (step === "loading-submit") {
      const timer = setTimeout(() => void submitRef.current?.(), 500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleClose = () => {
    if (step === "success") {
      onClose();
      return;
    }
    setPreviousStep(step);
    setStep("quit-confirm");
  };

  const handleQuit = () => {
    onClose();
  };

  const handleContinueFromQuit = () => {
    // Go back to previous step
    if (previousStep === "quit-confirm") {
      if (questions.length > 0 && currentQ < questions.length) {
        setStep("questionnaire");
      } else {
        setStep("welcome-back");
      }
    } else {
      setStep(previousStep);
    }
  };

  // Questionnaire logic
  const question = questions[currentQ] || null;

  const isAnswered = (): boolean => {
    if (!question) return true;
    if (!question.required) return true;
    const answer = answers[question.id];
    if (question.type === "checkbox") {
      const arr = (answer as string[]) || [];
      return arr.length > 0 || (otherChecked[question.id] && !!otherText[question.id]?.trim());
    }
    return !!(answer as string)?.trim() || (otherChecked[question.id] && !!otherText[question.id]?.trim());
  };

  const handleRadioSelect = (value: string) => {
    if (!question) return;
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
    setOtherChecked((prev) => ({ ...prev, [question.id]: false }));
  };

  const handleCheckboxToggle = (value: string) => {
    if (!question) return;
    const current = (answers[question.id] as string[]) || [];
    const newVal = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setAnswers((prev) => ({ ...prev, [question.id]: newVal }));
  };

  const handleTextChange = (value: string) => {
    if (!question) return;
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  };

  const handleOtherToggle = () => {
    if (!question) return;
    setOtherChecked((prev) => ({ ...prev, [question.id]: !prev[question.id] }));
  };

  const handleQuestionNext = () => {
    if (!question) return;
    const finalAnswers = { ...answers };
    if (otherChecked[question.id] && otherText[question.id]?.trim()) {
      if (question.type === "checkbox") {
        const current = (answers[question.id] as string[]) || [];
        finalAnswers[question.id] = [...current, `Other: ${otherText[question.id]}`];
      } else {
        finalAnswers[question.id] = `Other: ${otherText[question.id]}`;
      }
    }
    setAnswers(finalAnswers);

    if (currentQ < questions.length - 1) {
      setCurrentQ((p) => p + 1);
    } else {
      setStep("location-step");
    }
  };

  const handleQuestionBack = () => {
    if (currentQ > 0) {
      setCurrentQ((p) => p - 1);
    }
  };

  const handleSubmit = async () => {
    if (submitting.current) return;
    const result = contactSchema.safeParse({ name: contactName, email: contactEmail, phone: contactPhone, location, details: detailsText });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      setStep("email-step");
      return;
    }
    submitting.current = true;
    try {
      const requestId = await submitLead(categoryName, result.data, answers, contactAsap);
      // Leaving for the success page unmounts the wizard; calling onClose here would send /post-job users back to the list.
      navigate("/post-job/success", { state: { categoryName, requestId, email: result.data.email } });
    } catch {
      toast.error("Unable to submit your request. Please try again.");
      setStep("details");
    } finally {
      submitting.current = false;
    }
  };
  submitRef.current = handleSubmit;

  // Quality score based on details length
  const qualityScore = Math.min(100, Math.round((detailsText.length / 200) * 100));

  const CheckIcon = () => (
    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const renderRadioOptions = () => {
    if (!question) return null;
    const selected = answers[question.id] as string;
    return (
      <div className="border border-fx-muted rounded-fx-sm overflow-hidden bg-white">
        {question.options.map((opt, idx) => (
          <button
            key={opt}
            onClick={() => handleRadioSelect(opt)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-4 text-left transition-colors",
              idx > 0 && "border-t border-fx-line",
              selected === opt ? "bg-accent" : "hover:bg-fx-soft"
            )}
          >
            <div className={cn(
              "h-5 w-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
              selected === opt ? "border-primary" : "border-fx-line"
            )}>
              {selected === opt && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
            </div>
            <span className="text-base text-fx-muted">{opt}</span>
          </button>
        ))}
        {question.hasOther && (
          <div className={cn("border-t border-fx-line", otherChecked[question.id] ? "bg-accent" : "")}>
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                onClick={handleOtherToggle}
                className={cn(
                  "h-5 w-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                  otherChecked[question.id] ? "border-primary bg-primary" : "border-fx-line"
                )}
              >
                {otherChecked[question.id] && <CheckIcon />}
              </button>
              <input
                type="text"
                placeholder="Other"
                value={otherText[question.id] || ""}
                onChange={(e) => setOtherText((prev) => ({ ...prev, [question.id]: e.target.value }))}
                onClick={() => !otherChecked[question.id] && handleOtherToggle()}
                className="flex-1 text-sm outline-none bg-transparent border border-fx-line rounded px-3 py-1.5 placeholder:text-fx-muted focus:border-primary"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCheckboxOptions = () => {
    if (!question) return null;
    const selected = (answers[question.id] as string[]) || [];
    return (
      <div className="border border-fx-muted rounded-fx-sm overflow-hidden bg-white">
        {question.options.map((opt, idx) => {
          const isChecked = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => handleCheckboxToggle(opt)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-4 text-left transition-colors",
                idx > 0 && "border-t border-fx-line",
                isChecked ? "bg-accent" : "hover:bg-fx-soft"
              )}
            >
              <div className={cn(
                "h-5 w-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                isChecked ? "border-primary bg-primary" : "border-fx-line"
              )}>
                {isChecked && <CheckIcon />}
              </div>
              <span className="text-base text-fx-muted">{opt}</span>
            </button>
          );
        })}
        {question.hasOther && (
          <div className={cn("border-t border-fx-line", otherChecked[question.id] ? "bg-accent" : "")}>
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                onClick={handleOtherToggle}
                className={cn(
                  "h-5 w-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                  otherChecked[question.id] ? "border-primary bg-primary" : "border-fx-line"
                )}
              >
                {otherChecked[question.id] && <CheckIcon />}
              </button>
              <input
                type="text"
                placeholder="Other"
                value={otherText[question.id] || ""}
                onChange={(e) => setOtherText((prev) => ({ ...prev, [question.id]: e.target.value }))}
                onClick={() => !otherChecked[question.id] && handleOtherToggle()}
                className="flex-1 text-sm outline-none bg-transparent border border-fx-line rounded px-3 py-1.5 placeholder:text-fx-muted focus:border-primary"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTextarea = () => {
    if (!question) return null;
    return (
      <div className="border border-fx-muted rounded-fx-sm overflow-hidden bg-white">
        <textarea
          value={(answers[question.id] as string) || ""}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={question.placeholder || "Enter your answer..."}
          rows={6}
          className="w-full px-4 py-4 text-sm text-fx-ink outline-none resize-none placeholder:text-fx-muted"
        />
      </div>
    );
  };

  const renderLocation = () => {
    if (!question) return null;
    return (
      <div className="border border-fx-muted rounded-fx-sm overflow-hidden bg-white">
        <div className="flex items-center gap-3 px-4 py-4">
          <MapPin className="h-5 w-5 text-fx-muted flex-shrink-0" />
          <input
            type="text"
            value={(answers[question.id] as string) || ""}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={question.placeholder || "Enter postal code or city"}
            className="flex-1 text-sm text-fx-ink outline-none placeholder:text-fx-muted"
          />
        </div>
      </div>
    );
  };

  const renderQuestionContent = () => {
    if (!question) return null;
    switch (question.type) {
      case "checkbox": return renderCheckboxOptions();
      case "textarea": return renderTextarea();
      case "location": return renderLocation();
      default: return renderRadioOptions();
    }
  };

  // ── Loading spinner modal ──
  // Frame 568:26669: white card over the dimmed page, thin ring, "Please wait...".
  const renderLoading = () => (
    <div role="status" className="mx-4 flex w-full max-w-[340px] flex-col items-center rounded-fx-xs bg-white px-10 py-12 shadow-2xl">
      <div className="mb-7 size-16 animate-spin rounded-full border-[3px] border-fx-sunken border-t-primary" aria-hidden="true" />
      <p className="text-xl text-fx-ink">Please wait...</p>
    </div>
  );

  // ── Questionnaire modal ──
  const renderQuestionnaire = () => {
    if (!question) return null;
    const progress = ((currentQ + 1) / (questions.length + 2)) * 100;
    return (
      <div className="bg-white rounded-fx-xs shadow-2xl max-w-[420px] md:max-w-[700px] w-full mx-2.5 overflow-hidden">
        {/* Photo strip with close button */}
        <div className="relative h-24 bg-fx-sunken md:h-36">
          {heroImage && <img src={heroImage} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} className="absolute inset-0 size-full object-cover" />}
          <button onClick={handleClose} aria-label="Close" className="absolute right-4 top-4 grid size-[30px] place-items-center rounded-full bg-white/90 text-fx-secondary hover:text-fx-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress */}
        <div className="mx-5 mt-5 h-1.5 overflow-hidden rounded-full bg-fx-sunken" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-label="Request progress">
          <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        {/* Question */}
        <div className="px-5 pt-6 pb-6">
          <h2 className="text-[22px] leading-snug text-fx-ink text-center mb-4 md:text-[34px]">{question.label}</h2>
          <p className="text-sm text-fx-muted text-center">{question.subtitle || `Get quotes for ${categoryName.toLowerCase()} today`}</p>
        </div>

        {/* Options */}
        <div className="px-5 pb-6">{renderQuestionContent()}</div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 pb-5 pt-2">
          {currentQ > 0 ? (
            <Button variant="outline" onClick={handleQuestionBack} className="h-9 rounded-fx-xs px-[30px] text-xs">Back</Button>
          ) : <div />}
          <Button onClick={handleQuestionNext} disabled={!isAnswered()} className="h-9 rounded-fx-xs px-[30px] text-xs shadow-fx-button">
            Continue
          </Button>
        </div>
      </div>
    );
  };

  // ── Welcome back / Submit modal ──
  const renderWelcomeBack = () => {
    const progress = questions.length > 0
      ? ((questions.length) / (questions.length + 2)) * 100
      : 85;
    return (
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
        {/* Progress bar - fills most of the width */}
        <div className="h-1.5 bg-fx-sunken">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex justify-end px-4 pt-4">
          <button onClick={handleClose} className="text-fx-muted hover:text-fx-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 pb-6">
          <h2 className="text-2xl font-bold text-fx-ink text-center mb-3">
            Review your request
          </h2>
          <p className="text-fx-secondary text-center mb-6">
            Confirm your preferences, then add the details professionals need to prepare a quote.
          </p>

          <label className="flex items-center gap-3 mb-6">
            <Checkbox
              checked={receiveRemotely}
              onCheckedChange={(c) => setReceiveRemotely(c === true)}
              className="data-[state=checked]:bg-success data-[state=checked]:border-emerald-500"
            />
            <span className="text-sm text-fx-secondary">I'm happy to receive this online or remotely.</span>
          </label>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setStep("name-step")}
              className="px-6"
            >
              Back
            </Button>
            <Button
              onClick={() => setStep("details")}
              className="px-6 bg-success hover:bg-success text-white"
            >
              Continue
            </Button>
          </div>

          <p className="text-xs text-fx-muted text-center mt-4">
            By continuing, you confirm your agreement to our{" "}
            <a href="#" className="text-primary hover:underline">Terms & Conditions</a>
          </p>
        </div>
      </div>
    );
  };

  // ── Describe your request in detail ──
  const renderDetails = () => (
    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
      <div className="px-6 pt-6 pb-6">
        {/* Green success badge */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="h-5 w-5 rounded-full bg-success flex items-center justify-center">
            <Check className="h-3 w-3 text-white" />
          </div>
          <span className="text-sm text-fx-secondary">Complete your request</span>
        </div>

        <h2 className="text-2xl font-bold text-fx-ink text-center mb-2">Describe your request in detail</h2>
        <p className="text-sm text-fx-secondary text-center mb-6">
          Add more details to get faster and more accurate quotes
        </p>

        <textarea
          value={detailsText}
          onChange={(e) => setDetailsText(e.target.value)}
          placeholder="Tell professionals exactly what you need..."
          rows={5}
          className="w-full border border-fx-line rounded-lg px-4 py-3 text-sm text-fx-ink outline-none resize-none placeholder:text-fx-muted focus:border-primary mb-4"
        />



        <p className="text-xs text-fx-muted mb-4">
          Protected under our <a href="#" className="text-primary hover:underline">privacy policy</a>
        </p>

        {/* Quality score */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-fx-ink mb-2">Quality score</h3>
          <div className="h-2 bg-fx-sunken rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${qualityScore}%`,
                background: qualityScore < 50 ? "#F97316" : qualityScore < 80 ? "#F59E0B" : "#22C55E",
              }}
            />
          </div>
          {qualityScore < 80 && (
            <p className="text-xs text-orange-500 mt-1">This will improve your response</p>
          )}
        </div>

        {/* ASAP checkbox - orange gradient */}
        <label className="flex items-center gap-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-lg px-4 py-3 cursor-pointer mb-6">
          <Checkbox
            checked={contactAsap}
            onCheckedChange={(c) => setContactAsap(c === true)}
            className="border-white data-[state=checked]:bg-success data-[state=checked]:border-emerald-500"
          />
          <span className="text-sm font-medium">Let professionals know I want to be contacted ASAP</span>
        </label>

        <div className="flex justify-end">
          <Button
            onClick={() => setStep("loading-submit")}
            className="px-8 bg-success hover:bg-success text-white"
          >
            Submit request
          </Button>
        </div>
      </div>
    </div>
  );

  // ── Success modal ──
  const renderSuccess = () => (
    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden text-center px-8 py-12">
      {/* Large green checkmark circle */}
      <div className="h-24 w-24 rounded-full bg-success flex items-center justify-center mx-auto mb-6">
        <Check className="h-12 w-12 text-white stroke-[3]" />
      </div>

      <h2 className="text-2xl font-bold text-fx-ink mb-4">Your request has been posted</h2>

      <p className="text-fx-secondary mb-2">
        Sign in with the email used for this request to manage it.
      </p>
      <p className="text-fx-secondary mb-8">
        Or, if you remember your password, log in to view your account.
      </p>

      <div className="flex justify-center">
        <Button
          onClick={() => navigate("/auth/login")}
          className="px-8 bg-primary hover:bg-primary/90 text-white"
        >
          Log In
        </Button>
      </div>
    </div>
  );

  // ── Quit confirmation ──
  const renderQuitConfirm = () => (
    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden px-8 py-8">
      <h2 className="text-2xl font-bold text-fx-ink text-center mb-3">
        Are you sure that you want to leave?
      </h2>
      <p className="text-fx-secondary text-center mb-6">
        We're asking a few questions so we can find you the right pros, and send you quotes fast and free!
      </p>
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleQuit} className="px-8">
          Quit
        </Button>
        <Button onClick={handleContinueFromQuit} className="px-8 bg-primary hover:bg-primary/90 text-white">
          Continue
        </Button>
      </div>
    </div>
  );

  // ── Contact steps, one field at a time (frames 568:18035 to 697:7516) ──
  // Order: where, "nearly ready", email, phone, name. Each uses the same card.
  const CONTACT_STEPS: FlowStep[] = ["location-step", "matches-found", "email-step", "phone-step", "name-step"];
  const stepCard = (current: FlowStep, body: React.ReactNode, opts: { onBack?: () => void; onNext: () => void; canContinue?: boolean; tint?: boolean }) => {
    const total = questions.length + CONTACT_STEPS.length + 1;
    const progress = ((questions.length + CONTACT_STEPS.indexOf(current) + 1) / total) * 100;
    return (
      <form onSubmit={e => { e.preventDefault(); if (opts.canContinue !== false) opts.onNext(); }} className={cn("mx-2.5 w-full max-w-lg rounded-fx-xs px-5 pb-5 pt-5 shadow-2xl md:max-w-[700px] md:px-8 md:pb-7", opts.tint ? "bg-[hsl(var(--fx-mint))]" : "bg-white")}>
        <div className="flex items-center gap-4">
          <div className="h-1.5 flex-1 overflow-hidden rounded-fx-pill bg-fx-line" role="progressbar" aria-label="Request progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
            <div className="h-full rounded-fx-pill bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <button type="button" onClick={handleClose} aria-label="Close" className="text-fx-muted hover:text-fx-secondary"><X className="h-4 w-4" /></button>
        </div>
        <div className="pb-6 pt-6">{body}</div>
        <div className={cn("flex items-center justify-between", opts.tint && "-mx-0 rounded-fx-xs bg-white p-4")}>
          {opts.onBack ? <Button type="button" variant="outline" onClick={opts.onBack} className="h-9 rounded-fx-xs border-fx-muted px-7 text-xs text-fx-secondary">Back</Button> : <span />}
          <Button type="submit" disabled={opts.canContinue === false} className="h-9 rounded-fx-xs px-7 text-xs shadow-fx-button">Continue</Button>
        </div>
      </form>
    );
  };
  const stepTitle = "text-center text-[22px] leading-[1.45] text-fx-ink md:text-[34px] md:leading-[1.3]";
  const stepField = "h-[52px] w-full rounded-fx-xs border border-fx-muted bg-white px-4 text-base text-fx-ink outline-none placeholder:text-fx-secondary focus:border-primary";

  const renderLocationStep = () => stepCard("location-step", <>
    <h2 className={stepTitle}>Where do you need the {categoryName}?</h2>
    <p className="mb-5 mt-2 text-center text-sm leading-6 text-fx-secondary">The postal code or town for the address where you want the {categoryName}.</p>
    <div className="relative">
      <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-fx-ink" aria-hidden="true" />
      <input type="text" aria-label="Postal code or town" value={location} onChange={e => setLocation(e.target.value)} maxLength={120} placeholder="Enter postal code or city" className={cn(stepField, "pl-11")} autoFocus />
    </div>
  </>, { onBack: questions.length > 0 ? () => { setCurrentQ(questions.length - 1); setStep("questionnaire"); } : undefined, onNext: () => setStep("loading-contact"), canContinue: !!location.trim() });

  const renderMatchesFound = () => stepCard("matches-found", <div className="text-center">
    <div className="mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-success"><Check className="h-8 w-8 stroke-[3] text-white" aria-hidden="true" /></div>
    <h2 className={stepTitle}>Your request is nearly ready.</h2>
    <p className="mx-auto mt-4 max-w-[280px] text-sm leading-5 text-fx-ink">Lastly, we need your details to attach to your request.</p>
  </div>, { onBack: () => setStep("location-step"), onNext: () => setStep("email-step"), tint: true });

  const renderEmailStep = () => stepCard("email-step", <>
    <h2 className={stepTitle}>What email address would you like quotes sent to?</h2>
    <input type="email" aria-label="Email address" autoComplete="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} maxLength={254} placeholder="Email address" className={cn(stepField, "mt-5")} autoFocus />
  </>, { onBack: () => setStep("matches-found"), onNext: () => setStep("phone-step"), canContinue: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail.trim()) });

  const renderPhoneStep = () => stepCard("phone-step", <>
    <h2 className={stepTitle}>Your number is safe with us.</h2>
    <p className="mb-5 mt-2 text-center text-sm leading-7 text-fx-secondary">Some professionals prefer to give quotes by phone. You can leave this empty.</p>
    <input type="tel" aria-label="Phone number (optional)" autoComplete="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} maxLength={40} placeholder="Phone number" className={stepField} autoFocus />
  </>, { onBack: () => setStep("email-step"), onNext: () => setStep("name-step") });

  const renderNameStep = () => stepCard("name-step", <>
    <h2 className={stepTitle}>What is your name?</h2>
    <label htmlFor="modal-contact-name" className="mb-3 mt-4 block text-sm text-fx-ink">Please tell us your name:</label>
    <input id="modal-contact-name" autoComplete="name" value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Full name" maxLength={100} className={stepField} autoFocus />
  </>, { onBack: () => setStep("phone-step"), onNext: () => setStep("welcome-back"), canContinue: !!contactName.trim() });

  const renderStep = () => {
    switch (step) {
      case "loading":
      case "loading-contact":
      case "loading-submit":
        return renderLoading();
      case "questionnaire":
        return renderQuestionnaire();
      case "matches-found":
        return renderMatchesFound();
      case "email-step":
        return renderEmailStep();
      case "location-step":
        return renderLocationStep();
      case "phone-step":
        return renderPhoneStep();
      case "name-step":
        return renderNameStep();
      case "welcome-back":
        return renderWelcomeBack();
      case "details":
        return renderDetails();
      case "success":
        return renderSuccess();
      case "quit-confirm":
        return renderQuitConfirm();
      default:
        return renderLoading();
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Post a service request" className="fixed inset-0 z-[60] flex items-start justify-center pt-8 md:pt-16">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      {/* Modal content */}
      <div className="relative z-10 flex items-start justify-center w-full">
        {renderStep()}
      </div>
    </div>
  );
}
