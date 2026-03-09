import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <p className="text-muted-foreground mb-4">Service not found</p>
        <Button onClick={() => navigate("/post-job")}>Back to services</Button>
      </div>
    );
  }

  const questions = category.questions;

  if (questions.length === 0) {
    navigate("/post-job/contact", {
      state: {
        categoryId: category.id,
        categoryName: category.name,
        categorySlug: category.slug,
        answers: {},
      },
    });
    return null;
  }

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
      navigate("/post-job/contact", {
        state: {
          categoryId: category.id,
          categoryName: category.name,
          categorySlug: category.slug,
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
      <div className="border border-border rounded-lg overflow-hidden bg-white">
        {question.options.map((opt, idx) => (
          <button
            key={opt}
            onClick={() => handleRadioSelect(opt)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-4 text-left transition-colors",
              idx > 0 && "border-t border-border",
              selected === opt ? "bg-primary/5" : "hover:bg-gray-50"
            )}
          >
            <div
              className={cn(
                "h-5 w-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
                selected === opt ? "border-primary" : "border-gray-300"
              )}
            >
              {selected === opt && (
                <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              )}
            </div>
            <span className="text-sm text-gray-700">{opt}</span>
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
                    : "border-gray-300"
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
                className="flex-1 text-sm outline-none bg-transparent border border-gray-200 rounded px-3 py-1.5 placeholder:text-gray-400 focus:border-primary"
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
      <div className="border border-border rounded-lg overflow-hidden bg-white">
        {question.options.map((opt, idx) => {
          const isChecked = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => handleCheckboxToggle(opt)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-4 text-left transition-colors",
                idx > 0 && "border-t border-border",
                isChecked ? "bg-primary/5" : "hover:bg-gray-50"
              )}
            >
              <div
                className={cn(
                  "h-5 w-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                  isChecked ? "border-primary bg-primary" : "border-gray-300"
                )}
              >
                {isChecked && <CheckIcon />}
              </div>
              <span className="text-sm text-gray-700">{opt}</span>
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
                    : "border-gray-300"
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
                className="flex-1 text-sm outline-none bg-transparent border border-gray-200 rounded px-3 py-1.5 placeholder:text-gray-400 focus:border-primary"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTextarea = () => {
    return (
      <div className="border border-border rounded-lg overflow-hidden bg-white">
        <textarea
          value={(answers[question.id] as string) || ""}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={question.placeholder || "Enter your answer..."}
          rows={6}
          className="w-full px-4 py-4 text-sm text-gray-800 outline-none resize-none placeholder:text-gray-400 focus:ring-0"
        />
      </div>
    );
  };

  const renderLocation = () => {
    return (
      <div className="border border-border rounded-lg overflow-hidden bg-white">
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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Progress bar at very top */}
      <div className="h-1.5 bg-gray-200">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Modal card */}
      <div className="flex-1 flex items-start justify-center p-4 pt-6 md:pt-12">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Close button */}
          <div className="flex justify-end px-4 pt-4">
            <button
              onClick={() => navigate("/post-job")}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Question */}
          <div className="px-6 pb-4">
            <h2 className="text-xl font-bold text-gray-900 text-center mb-1">
              {question.label}
            </h2>
            {question.subtitle && (
              <p className="text-sm text-gray-500 text-center">
                {question.subtitle}
              </p>
            )}
          </div>

          {/* Options */}
          <div className="px-6 pb-6">{renderQuestion()}</div>

          {/* Footer navigation */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-gray-50">
            {currentQ > 0 ? (
              <Button variant="outline" onClick={handleBack} className="px-6">
                Back
              </Button>
            ) : (
              <div />
            )}
            <Button
              onClick={handleNext}
              disabled={!isAnswered()}
              className="px-6 bg-primary hover:bg-primary/90"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
