import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Valid email required").max(255),
  phone: z.string().trim().optional(),
  location: z.string().trim().min(1, "Location is required").max(200),
  details: z.string().trim().max(2000).optional(),
});

export default function JobContact() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    categoryId: string;
    categoryName: string;
    categorySlug: string;
    answers: Record<string, string>;
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
    navigate("/post-job");
    return null;
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

    // Parse location into city/postal
    const locationParts = form.location.split(",").map((s) => s.trim());
    const city = locationParts[0] || null;
    const postalCode = locationParts[1] || null;

    // Determine urgency from answers
    const urgencyAnswers = Object.values(state.answers).map((v) => v.toLowerCase());
    const isUrgent = urgencyAnswers.some(
      (a) => a.includes("emergency") || a.includes("asap") || a.includes("as soon as possible")
    );

    const { data, error } = await supabase
      .from("leads")
      .insert({
        category: state.categoryName,
        location_text: form.location,
        city,
        postal_code: postalCode,
        customer_name: form.name.trim(),
        customer_email: form.email.trim(),
        customer_phone: form.phone.trim() || null,
        details: form.details.trim() || null,
        answers: state.answers,
        is_urgent: isUrgent,
        status: "new",
      })
      .select("id")
      .single();

    if (error) {
      toast.error("Failed to submit your request. Please try again.");
      setSubmitting(false);
      return;
    }

    // Create initial customer message
    if (data) {
      await supabase.from("lead_messages").insert({
        lead_id: data.id,
        sender_type: "customer",
        message: form.details.trim() || `New ${state.categoryName} request from ${form.name}`,
      });
    }

    navigate("/post-job/success", {
      state: { categoryName: state.categoryName },
    });
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
