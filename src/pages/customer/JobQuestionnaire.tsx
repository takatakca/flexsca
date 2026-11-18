import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  base_credit_cost: number;
  questions: Question[];
}

export default function JobQuestionnaire() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [params]=useSearchParams();
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [otherText, setOtherText] = useState<Record<string, string>>({});
  const [otherChecked, setOtherChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("service_categories")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single()
      .then(({ data }) => {
        if (data) {
          setCategory({
            ...data,
            questions: (data.questions as unknown as Question[]) || [],
          });
        }
        setLoading(false);
      });
  }, [slug]);

  useEffect(()=>{
    if(category && category.questions.length===0)navigate("/post-job/contact",{replace:true,state:{
      categoryId:category.id,categoryName:category.name,categorySlug:category.slug,
      projectLocation:(params.get("location") ?? "").slice(0,120),answers:{},
    }});
  },[category,navigate,params]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fx-sunken">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-fx-sunken p-4">
        <p className="text-muted-foreground mb-4">Service not found</p>
        <Button onClick={() => navigate("/post-job")}>Back to services</Button>
      </div>
    );
  }

  const questions = category.questions;

  if (questions.length === 0) return <p role="status" className="p-8">Preparing your request…</p>;

  const question = questions[currentQ];
  const progress = ((currentQ + 1) / questions.length) * 100;

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
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
    setOtherChecked((prev) => ({ ...prev, [question.id]: false }));
  };

  const handleCheckboxToggle = (value: string) => {
    const current = (answers[question.id] as string[]) || [];
    const newVal = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setAnswers((prev) => ({ ...prev, [question.id]: newVal }));
  };

  const handleTextChange = (value: string) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  };

  const handleOtherToggle = () => {
    setOtherChecked((prev) => ({ ...prev, [question.id]: !prev[question.id] }));
  };

  const handleNext = () => {
    // Merge "Other" text into answer if checked
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
      navigate("/post-job/contact", {
        state: {
          categoryId: category.id,
          categoryName: category.name,
          categorySlug: category.slug,
        projectLocation: (params.get("location") ?? "").slice(0,120),
          answers: finalAnswers,
        },
      });
    }
  };

  const handleBack = () => {
    if (currentQ > 0) {
      setCurrentQ((p) => p - 1);
    } else {
      navigate("/post-job");
    }
  };

  const CheckIcon = () => (
    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
      <path
        d="M2 6l3 3 5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const renderRadioOptions = () => {
    const selected = answers[question.id] as string;
    return (
      <div className="overflow-hidden rounded-fx-xs border border-fx-muted bg-white">
        {question.options.map((opt, idx) => (
          <button
            key={opt}
            onClick={() => handleRadioSelect(opt)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-4 text-left transition-colors",
              idx > 0 && "border-t border-border",
              selected === opt ? "bg-primary/5" : "hover:bg-fx-soft"
            )}
          >
            <div
              className={cn(
                "h-5 w-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
                selected === opt ? "border-primary" : "border-fx-line"
              )}
            >
              {selected === opt && (
                <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              )}
            </div>
            <span className="text-sm text-fx-secondary">{opt}</span>
          </button>
        ))}
        {question.hasOther && (
          <div
            className={cn(
              "border-t border-border",
              otherChecked[question.id] ? "bg-primary/5" : ""
            )}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                onClick={handleOtherToggle}
                className={cn(
                  "h-5 w-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                  otherChecked[question.id]
                    ? "border-primary bg-primary"
                    : "border-fx-line"
                )}
              >
                {otherChecked[question.id] && <CheckIcon />}
              </button>
              <input
                type="text"
                placeholder="Other"
                value={otherText[question.id] || ""}
                onChange={(e) =>
                  setOtherText((prev) => ({
                    ...prev,
                    [question.id]: e.target.value,
                  }))
                }
                onClick={() =>
                  !otherChecked[question.id] && handleOtherToggle()
                }
                className="flex-1 text-sm outline-none bg-transparent border border-fx-line rounded px-3 py-1.5 placeholder:text-fx-muted focus:border-primary"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCheckboxOptions = () => {
    const selected = (answers[question.id] as string[]) || [];
    return (
      <div className="overflow-hidden rounded-fx-xs border border-fx-muted bg-white">
        {question.options.map((opt, idx) => {
          const isChecked = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => handleCheckboxToggle(opt)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-4 text-left transition-colors",
                idx > 0 && "border-t border-border",
                isChecked ? "bg-primary/5" : "hover:bg-fx-soft"
              )}
            >
              <div
                className={cn(
                  "h-5 w-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                  isChecked ? "border-primary bg-primary" : "border-fx-line"
                )}
              >
                {isChecked && <CheckIcon />}
              </div>
              <span className="text-sm text-fx-secondary">{opt}</span>
            </button>
          );
        })}
        {question.hasOther && (
          <div
            className={cn(
              "border-t border-border",
              otherChecked[question.id] ? "bg-primary/5" : ""
            )}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                onClick={handleOtherToggle}
                className={cn(
                  "h-5 w-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                  otherChecked[question.id]
                    ? "border-primary bg-primary"
                    : "border-fx-line"
                )}
              >
                {otherChecked[question.id] && <CheckIcon />}
              </button>
              <input
                type="text"
                placeholder="Other"
                value={otherText[question.id] || ""}
                onChange={(e) =>
                  setOtherText((prev) => ({
                    ...prev,
                    [question.id]: e.target.value,
                  }))
                }
                onClick={() =>
                  !otherChecked[question.id] && handleOtherToggle()
                }
                className="flex-1 text-sm outline-none bg-transparent border border-fx-line rounded px-3 py-1.5 placeholder:text-fx-muted focus:border-primary"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTextarea = () => {
    return (
      <div className="overflow-hidden rounded-fx-xs border border-fx-muted bg-white">
        <textarea
          value={(answers[question.id] as string) || ""}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={question.placeholder || "Enter your answer..."}
          rows={6}
          className="w-full px-4 py-4 text-sm text-fx-ink outline-none resize-none placeholder:text-fx-muted focus:ring-0"
        />
      </div>
    );
  };

  const renderLocation = () => {
    return (
      <div className="overflow-hidden rounded-fx-xs border border-fx-muted bg-white">
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

  const renderQuestion = () => {
    switch (question.type) {
      case "checkbox":
        return renderCheckboxOptions();
      case "textarea":
        return renderTextarea();
      case "location":
        return renderLocation();
      case "radio":
      default:
        return renderRadioOptions();
    }
  };

  // Wizard step card, frames 568:13658 to 568:18782: progress bar and close on one row, question, options, Back and Continue.
  return (
    <div className="min-h-screen bg-fx-sunken flex flex-col">
      <div className="flex-1 flex items-start justify-center px-2.5 pt-6 md:pt-12">
        <div className="w-full max-w-lg rounded-fx-xs bg-white px-5 pb-5 pt-5 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="h-1.5 flex-1 overflow-hidden rounded-fx-pill bg-fx-line" role="progressbar" aria-label="Request progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
              <div className="h-full rounded-fx-pill bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <button onClick={() => navigate("/post-job")} aria-label="Close" className="text-fx-muted transition-colors hover:text-fx-secondary">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="pb-5 pt-6">
            <h2 className="text-center text-[22px] leading-[1.45] text-fx-ink">{question.label}</h2>
            {question.subtitle && <p className="mt-2 text-center text-sm text-fx-secondary">{question.subtitle}</p>}
          </div>

          <div className="pb-6">{renderQuestion()}</div>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleBack} className="h-9 rounded-fx-xs border-fx-muted px-7 text-xs text-fx-secondary">Back</Button>
            <Button onClick={handleNext} disabled={!isAnswered()} className="h-9 rounded-fx-xs px-7 text-xs shadow-fx-button">Continue</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
