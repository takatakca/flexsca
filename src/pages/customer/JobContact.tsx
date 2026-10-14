import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { contactSchema, submitLead, type AnswerValue } from "@/lib/lead-intake";

export default function JobContact() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    categoryId: string;
    categoryName: string;
    categorySlug: string;
    projectLocation?: string;
    answers: Record<string, AnswerValue>;
  } | null;

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: state?.projectLocation ?? "",
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
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
    } catch (cause) {
      const safeMessage = cause instanceof Error && [
        "You already sent this request. Please wait 10 minutes before trying again.",
        "Too many requests from this email. Please try again later.",
      ].includes(cause.message) ? cause.message : "Unable to submit your request. Please try again.";
      toast.error(safeMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Go back to the previous step" onClick={() => navigate(-1)}>
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

      <form className="flex flex-1 flex-col" onSubmit={(event) => { void handleSubmit(event); }}>
      {/* Form */}
      <div className="flex-1 px-4 py-6 space-y-5">
        <div>
          <label htmlFor="requester-name" className="text-sm font-medium text-foreground mb-1.5 block">
            Your name *
          </label>
          <Input
            id="requester-name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "requester-name-error" : undefined}
            placeholder="Full name"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="rounded-xl h-12"
          />
          {errors.name && <p id="requester-name-error" role="alert" className="text-xs text-destructive mt-1">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="requester-email" className="text-sm font-medium text-foreground mb-1.5 block">
            Email address *
          </label>
          <Input
            id="requester-email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "requester-email-error" : undefined}
            type="email"
            placeholder="your@email.com"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className="rounded-xl h-12"
          />
          {errors.email && <p id="requester-email-error" role="alert" className="text-xs text-destructive mt-1">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="requester-phone" className="text-sm font-medium text-foreground mb-1.5 block">
            Phone number
          </label>
          <Input
            id="requester-phone"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "requester-phone-error" : undefined}
            type="tel"
            placeholder="Optional"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            className="rounded-xl h-12"
          />
          {errors.phone && <p id="requester-phone-error" role="alert" className="text-xs text-destructive mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label htmlFor="requester-location" className="text-sm font-medium text-foreground mb-1.5 block">
            Your location *
          </label>
          <Input
            id="requester-location"
            aria-invalid={!!errors.location}
            aria-describedby={errors.location ? "requester-location-error" : undefined}
            placeholder="City, Postal Code"
            value={form.location}
            onChange={(e) => handleChange("location", e.target.value)}
            className="rounded-xl h-12"
          />
          {errors.location && (
            <p id="requester-location-error" role="alert" className="text-xs text-destructive mt-1">{errors.location}</p>
          )}
        </div>

        <div>
          <label htmlFor="requester-details" className="text-sm font-medium text-foreground mb-1.5 block">
            Additional details
          </label>
          <Textarea
            id="requester-details"
            aria-invalid={!!errors.details}
            aria-describedby={errors.details ? "requester-details-error" : undefined}
            placeholder="Anything else you want professionals to know?"
            value={form.details}
            onChange={(e) => handleChange("details", e.target.value)}
            className="rounded-xl min-h-[100px] resize-none"
          />
          {errors.details && <p id="requester-details-error" role="alert" className="text-xs text-destructive mt-1">{errors.details}</p>}
        </div>
      </div>

      {/* Submit */}
      <div className="sticky bottom-0 bg-card border-t border-border px-4 py-4 pb-safe">
        <Button
          type="submit"
          size="lg"
          className="w-full h-12 rounded-xl text-base font-semibold"
          disabled={submitting}
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
      </form>
    </div>
  );
}
