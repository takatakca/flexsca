import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { X, MapPin, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  onClose: () => void;
}

type FlowStep =
  | "loading"
  | "questionnaire"
  | "loading-contact"
  | "matches-found"
  | "email-step"
  | "location-step"
  | "welcome-back"
  | "details"
  | "loading-submit"
  | "success"
  | "quit-confirm";

export default function ServiceFlowModal({
  categoryId,
  categoryName,
  categorySlug,
  questions,
  onClose,
}: ServiceFlowModalProps) {
  const navigate = useNavigate();
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
  const [location, setLocation] = useState("");

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
          setStep("welcome-back");
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step, questions.length]);

  // Loading between steps
  useEffect(() => {
    if (step === "loading-contact") {
      const timer = setTimeout(() => setStep("matches-found"), 1500);
      return () => clearTimeout(timer);
    }
    if (step === "loading-submit") {
      const timer = setTimeout(() => handleSubmit(), 500);
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
    let finalAnswers = { ...answers };
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
      setStep("loading-contact");
    }
  };

  const handleQuestionBack = () => {
    if (currentQ > 0) {
      setCurrentQ((p) => p - 1);
    }
  };

  const handleSubmit = async () => {
    const locationParts = location.split(",").map((s) => s.trim());
    const city = locationParts[0] || null;
    const postalCode = locationParts[1] || null;

    const urgencyAnswers = Object.values(answers).flatMap((v) =>
      Array.isArray(v) ? v : [v]
    ).map((v) => v.toLowerCase());
    const isUrgent = contactAsap || urgencyAnswers.some(
      (a) => a.includes("emergency") || a.includes("asap")
    );

    // Use secure server-side function to submit lead + message atomically
    const { data, error } = await supabase.rpc("submit_lead", {
      p_category: categoryName,
      p_location_text: location || "Not specified",
      p_city: city,
      p_postal_code: postalCode,
      p_customer_name: contactName.trim() || null,
      p_customer_email: contactEmail.trim() || null,
      p_customer_phone: contactPhone.trim() || null,
      p_details: detailsText.trim() || null,
      p_answers: answers,
      p_is_urgent: isUrgent,
    });

    if (error) {
      console.error("Lead submission error:", error);
      toast.error("Failed to submit your request. Please try again.");
      setStep("details");
      return;
    }

    setStep("success");
  };

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
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        {question.options.map((opt, idx) => (
          <button
            key={opt}
            onClick={() => handleRadioSelect(opt)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-4 text-left transition-colors",
              idx > 0 && "border-t border-gray-200",
              selected === opt ? "bg-blue-50" : "hover:bg-gray-50"
            )}
          >
            <div className={cn(
              "h-5 w-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
              selected === opt ? "border-blue-600" : "border-gray-300"
            )}>
              {selected === opt && <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />}
            </div>
            <span className="text-sm text-gray-700">{opt}</span>
          </button>
        ))}
        {question.hasOther && (
          <div className={cn("border-t border-gray-200", otherChecked[question.id] ? "bg-blue-50" : "")}>
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                onClick={handleOtherToggle}
                className={cn(
                  "h-5 w-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                  otherChecked[question.id] ? "border-blue-600 bg-blue-600" : "border-gray-300"
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
                className="flex-1 text-sm outline-none bg-transparent border border-gray-200 rounded px-3 py-1.5 placeholder:text-gray-400 focus:border-blue-500"
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
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        {question.options.map((opt, idx) => {
          const isChecked = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => handleCheckboxToggle(opt)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-4 text-left transition-colors",
                idx > 0 && "border-t border-gray-200",
                isChecked ? "bg-blue-50" : "hover:bg-gray-50"
              )}
            >
              <div className={cn(
                "h-5 w-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                isChecked ? "border-blue-600 bg-blue-600" : "border-gray-300"
              )}>
                {isChecked && <CheckIcon />}
              </div>
              <span className="text-sm text-gray-700">{opt}</span>
            </button>
          );
        })}
        {question.hasOther && (
          <div className={cn("border-t border-gray-200", otherChecked[question.id] ? "bg-blue-50" : "")}>
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                onClick={handleOtherToggle}
                className={cn(
                  "h-5 w-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                  otherChecked[question.id] ? "border-blue-600 bg-blue-600" : "border-gray-300"
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
                className="flex-1 text-sm outline-none bg-transparent border border-gray-200 rounded px-3 py-1.5 placeholder:text-gray-400 focus:border-blue-500"
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
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <textarea
          value={(answers[question.id] as string) || ""}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={question.placeholder || "Enter your answer..."}
          rows={6}
          className="w-full px-4 py-4 text-sm text-gray-800 outline-none resize-none placeholder:text-gray-400"
        />
      </div>
    );
  };

  const renderLocation = () => {
    if (!question) return null;
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <div className="flex items-center gap-3 px-4 py-4">
          <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={(answers[question.id] as string) || ""}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={question.placeholder || "Enter postcode or town"}
            className="flex-1 text-sm text-gray-800 outline-none placeholder:text-gray-400"
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
  const renderLoading = () => (
    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-12 flex flex-col items-center">
      {/* Animated spinner ring */}
      <div className="relative h-16 w-16 mb-6">
        <div className="absolute inset-0 border-4 border-gray-200 rounded-full" />
        <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-xl font-semibold text-gray-900">Please Wait...</p>
    </div>
  );

  // ── Questionnaire modal ──
  const renderQuestionnaire = () => {
    if (!question) return null;
    const progress = ((currentQ + 1) / (questions.length + 2)) * 100;
    return (
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
        {/* Progress */}
        <div className="h-1.5 bg-gray-200">
          <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        {/* Close */}
        <div className="flex justify-end px-4 pt-4">
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Question */}
        <div className="px-6 pb-4">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-1">{question.label}</h2>
          {question.subtitle && <p className="text-sm text-gray-500 text-center">{question.subtitle}</p>}
        </div>

        {/* Options */}
        <div className="px-6 pb-6">{renderQuestionContent()}</div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          {currentQ > 0 ? (
            <Button variant="outline" onClick={handleQuestionBack} className="px-6">Back</Button>
          ) : <div />}
          <Button onClick={handleQuestionNext} disabled={!isAnswered()} className="px-6 bg-blue-600 hover:bg-blue-700 text-white">
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
        <div className="h-1.5 bg-gray-200">
          <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex justify-end px-4 pt-4">
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 pb-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
            Welcome back, QMAPS
          </h2>
          <p className="text-gray-600 text-center mb-6">
            It looks like you've used QMAPS before. Submit your request now and we'll help you log in to view your matches.
          </p>

          <label className="flex items-center gap-3 mb-6">
            <Checkbox
              checked={receiveRemotely}
              onCheckedChange={(c) => setReceiveRemotely(c === true)}
              className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
            />
            <span className="text-sm text-gray-700">I'm happy to receive this online or remotely.</span>
          </label>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setStep("location-step")}
              className="px-6"
            >
              Back
            </Button>
            <Button
              onClick={() => setStep("details")}
              className="px-6 bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              Submit request
            </Button>
          </div>

          <p className="text-xs text-gray-400 text-center mt-4">
            By continuing, you confirm your agreement to our{" "}
            <a href="#" className="text-blue-500 hover:underline">Terms & Conditions</a>
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
          <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
            <Check className="h-3 w-3 text-white" />
          </div>
          <span className="text-sm text-gray-600">We've posted your request</span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Describe your request in detail</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Add more details to get faster and more accurate quotes
        </p>

        <textarea
          value={detailsText}
          onChange={(e) => setDetailsText(e.target.value)}
          placeholder="Tell professionals exactly what you need..."
          rows={5}
          className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 outline-none resize-none placeholder:text-gray-400 focus:border-blue-500 mb-4"
        />

        <button className="w-full flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors mb-2">
          <Plus className="h-4 w-4" />
          Add photos/files
        </button>

        <p className="text-xs text-gray-400 mb-4">
          Protected under our <a href="#" className="text-blue-500 hover:underline">privacy policy</a>
        </p>

        {/* Quality score */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Quality score</h3>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
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
            className="border-white data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
          />
          <span className="text-sm font-medium">Let professionals know I want to be contacted ASAP</span>
        </label>

        <div className="flex justify-end">
          <Button
            onClick={() => setStep("loading-submit")}
            className="px-8 bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            View matches
          </Button>
        </div>
      </div>
    </div>
  );

  // ── Success modal ──
  const renderSuccess = () => (
    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden text-center px-8 py-12">
      {/* Large green checkmark circle */}
      <div className="h-24 w-24 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-6">
        <Check className="h-12 w-12 text-white stroke-[3]" />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-4">Your request has been posted</h2>

      <p className="text-gray-600 mb-2">
        We've sent you an email with a link so you can access your account.
      </p>
      <p className="text-gray-600 mb-8">
        Or, if you remember your password, log in to view your account.
      </p>

      <div className="flex justify-center">
        <Button
          onClick={() => navigate("/auth/login")}
          className="px-8 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Log In
        </Button>
      </div>
    </div>
  );

  // ── Quit confirmation ──
  const renderQuitConfirm = () => (
    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden px-8 py-8">
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
        Are you sure that you want to leave?
      </h2>
      <p className="text-gray-600 text-center mb-6">
        We're asking a few questions so we can find you the right pros, and send you quotes fast and free!
      </p>
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleQuit} className="px-8">
          Quit
        </Button>
        <Button onClick={handleContinueFromQuit} className="px-8 bg-blue-600 hover:bg-blue-700 text-white">
          Continue
        </Button>
      </div>
    </div>
  );

  // ── Matches Found modal ──
  const renderMatchesFound = () => {
    const progress = questions.length > 0
      ? ((questions.length + 0.5) / (questions.length + 5)) * 100
      : 70;
    return (
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
        <div className="h-1.5 bg-gray-200">
          <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-end px-4 pt-4">
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 pb-6 text-center">
          <div className="h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-white stroke-[3]" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Great! We've found you the perfect matches.</h2>
          <p className="text-sm text-gray-500 mb-6">Lastly, we need your details to attach to your request.</p>
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => {
              if (questions.length > 0) { setCurrentQ(questions.length - 1); setStep("questionnaire"); }
            }} className="px-6">Back</Button>
            <Button onClick={() => setStep("email-step")} className="px-6 bg-blue-600 hover:bg-blue-700 text-white">Continue</Button>
          </div>
        </div>
      </div>
    );
  };

  // ── Email step modal ──
  const renderEmailStep = () => {
    const progress = questions.length > 0
      ? ((questions.length + 1.5) / (questions.length + 5)) * 100
      : 75;
    return (
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
        <div className="h-1.5 bg-gray-200">
          <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-end px-4 pt-4">
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 pb-6">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-6">What email address would you like quotes sent to?</h2>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="Email address"
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-blue-500 mb-6"
          />
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep("matches-found")} className="px-6">Back</Button>
            <Button onClick={() => setStep("location-step")} disabled={!contactEmail.trim()} className="px-6 bg-blue-600 hover:bg-blue-700 text-white">Continue</Button>
          </div>
        </div>
      </div>
    );
  };

  // ── Location step modal ──
  const renderLocationStep = () => {
    const progress = questions.length > 0
      ? ((questions.length + 2.5) / (questions.length + 5)) * 100
      : 82;
    return (
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
        <div className="h-1.5 bg-gray-200">
          <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-end px-4 pt-4">
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 pb-6">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Where do you need the {categoryName}?</h2>
          <p className="text-sm text-gray-500 text-center mb-6">The postcode or town for the address where you want the {categoryName}.</p>
          <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-3 mb-6">
            <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter postcode or town"
              className="flex-1 text-sm text-gray-800 outline-none placeholder:text-gray-400"
            />
          </div>
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep("email-step")} className="px-6">Back</Button>
            <Button onClick={() => setStep("welcome-back")} disabled={!location.trim()} className="px-6 bg-blue-600 hover:bg-blue-700 text-white">Continue</Button>
          </div>
        </div>
      </div>
    );
  };

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
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-8 md:pt-16">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      {/* Modal content */}
      <div className="relative z-10 flex items-start justify-center w-full">
        {renderStep()}
      </div>
    </div>
  );
}
