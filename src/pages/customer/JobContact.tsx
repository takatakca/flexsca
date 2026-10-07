import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { contactSchema, submitLead, type AnswerValue } from "@/lib/lead-intake";
import { Navigate } from "react-router-dom";

export default function JobContact() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    categoryId: string;
    categoryName: string;
    categorySlug: string;
    answers: Record<string, AnswerValue>;
  } | null;

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    details: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!state) {
    return <Navigate to="/post-job" replace />;
  }

  const handleChange = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  const handleSubmit = async () => {
    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        if (e.path[0]) fieldErrors[e.path[0] as string] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);

    try {
      const requestId = await submitLead(state.categoryName, result.data, state.answers);
      navigate("/post-job/success", { state: { categoryName: state.categoryName, requestId, email: result.data.email } });
    } catch {
      toast.error("Unable to submit your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-base font-semibold text-foreground">Your details</h1>
            <p className="text-xs text-muted-foreground">
              So professionals can contact you
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-4 py-6 space-y-5">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Your name *
          </label>
          <Input
            placeholder="Full name"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="rounded-xl h-12"
          />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Email address *
          </label>
          <Input
            type="email"
            placeholder="your@email.com"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className="rounded-xl h-12"
          />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Phone number
          </label>
          <Input
            type="tel"
            placeholder="Optional"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            className="rounded-xl h-12"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Your location *
          </label>
          <Input
            placeholder="City, Postal Code"
            value={form.location}
            onChange={(e) => handleChange("location", e.target.value)}
            className="rounded-xl h-12"
          />
          {errors.location && (
            <p className="text-xs text-destructive mt-1">{errors.location}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Additional details
          </label>
          <Textarea
            placeholder="Anything else you want professionals to know?"
            value={form.details}
            onChange={(e) => handleChange("details", e.target.value)}
            className="rounded-xl min-h-[100px] resize-none"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="sticky bottom-0 bg-card border-t border-border px-4 py-4 pb-safe">
        <Button
          size="lg"
          className="w-full h-12 rounded-xl text-base font-semibold"
          disabled={submitting}
          onClick={handleSubmit}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting…
            </>
          ) : (
            "Get free quotes"
          )}
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-2">
          It's free! No obligation. Professionals will contact you directly.
        </p>
      </div>
    </div>
  );
}
