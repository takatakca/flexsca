import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface Question {
  id: string;
  label: string;
  type: string;
  options: string[];
  required: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  base_credit_cost: number;
  questions: Question[];
}

export default function JobQuestionnaire() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <p className="text-muted-foreground mb-4">Service not found</p>
        <Button onClick={() => navigate("/post-job")}>Back to services</Button>
      </div>
    );
  }

  const questions = category.questions;
  const question = questions[currentQ];
  const progress = questions.length > 0 ? ((currentQ + 1) / questions.length) * 100 : 100;
  const isAnswered = question ? !!answers[question.id] : true;

  const handleSelect = (value: string) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((p) => p + 1);
    } else {
      // Go to contact details
      navigate("/post-job/contact", {
        state: {
          categoryId: category.id,
          categoryName: category.name,
          categorySlug: category.slug,
          answers,
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

  if (!question) {
    // No questions, skip straight to contact
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={handleBack}>
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">
              {category.icon} {category.name}
            </p>
            <p className="text-xs text-muted-foreground">
              Question {currentQ + 1} of {questions.length}
            </p>
          </div>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Question */}
      <div className="flex-1 px-4 py-6">
        <h2 className="text-xl font-bold text-foreground mb-6">
          {question.label}
        </h2>

        <div className="space-y-3">
          {question.options.map((opt) => {
            const selected = answers[question.id] === opt;
            return (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-colors ${
                  selected
                    ? "border-primary bg-accent text-foreground"
                    : "border-border bg-card text-foreground hover:border-primary/50"
                }`}
              >
                <div
                  className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selected ? "border-primary bg-primary" : "border-muted-foreground/40"
                  }`}
                >
                  {selected && <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />}
                </div>
                <span className="text-sm font-medium">{opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="sticky bottom-0 bg-card border-t border-border px-4 py-4 pb-safe">
        <Button
          size="lg"
          className="w-full h-12 rounded-xl text-base font-semibold"
          disabled={!isAnswered}
          onClick={handleNext}
        >
          {currentQ < questions.length - 1 ? (
            <>
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </>
          ) : (
            "Continue"
          )}
        </Button>
      </div>
    </div>
  );
}
