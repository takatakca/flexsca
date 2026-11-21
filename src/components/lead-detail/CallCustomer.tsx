import { useEffect, useState } from "react";
import { PhoneCall } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const NUMBER_KEY = "flexs.callback-number";
let enabledPromise: Promise<boolean> | null = null;
/** Asks once per visit whether the phone service is switched on. */
function callsEnabled(): Promise<boolean> {
  enabledPromise ??= supabase.functions.invoke("lead-call", { body: { task: "status" } })
    .then(({ data, error }) => !error && data?.enabled === true, () => false);
  return enabledPromise;
}

/**
 * "Call through FLEXS": the service rings the professional's own phone first, then connects the customer.
 * Shown only when the phone service is configured; the plain phone link stays available either way.
 */
export default function CallCustomer({ leadId }: { leadId: string }) {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState("");
  const [calling, setCalling] = useState(false);

  useEffect(() => { let active = true; void callsEnabled().then(value => { if (active) setEnabled(value); }); return () => { active = false; }; }, []);
  useEffect(() => {
    if (!open || number) return;
    try { const saved = window.localStorage.getItem(NUMBER_KEY); if (saved) { setNumber(saved); return; } } catch { /* no saved number */ }
    void supabase.auth.getUser().then(({ data }) => data.user && supabase.from("provider_profiles").select("company_phone").eq("user_id", data.user.id).maybeSingle()
      .then(({ data: profile }) => { if (profile?.company_phone) setNumber(current => current || profile.company_phone!); }));
  }, [open, number]);

  if (!enabled) return null;

  const start = async (event: React.FormEvent) => {
    event.preventDefault();
    if (calling) return;
    setCalling(true);
    try {
      const { data, error } = await supabase.functions.invoke("lead-call", { body: { task: "call", leadId, phone: number } });
      if (error || !data?.callId) {
        const detail = error && "context" in error ? await (error.context as Response).json().catch(() => null) : null;
        throw new Error(detail?.error ?? "The call could not be started. Try again shortly.");
      }
      try { window.localStorage.setItem(NUMBER_KEY, number); } catch { /* the number is simply asked again next time */ }
      toast.success("Your phone will ring in a moment. Answer it and we connect you to the customer.");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The call could not be started. Try again shortly.");
    } finally { setCalling(false); }
  };

  return (
    <div className="mt-3">
      {!open ? (
        <Button type="button" variant="outline" onClick={() => setOpen(true)} className="h-11 gap-2 rounded-fx-xs border-primary text-primary">
          <PhoneCall className="size-4" aria-hidden="true" />Call through FLEXS
        </Button>
      ) : (
        <form onSubmit={start} className="space-y-3 rounded-fx-xs border border-fx-line bg-card p-4">
          <label htmlFor="callback-number" className="block text-sm text-fx-ink">Your phone number</label>
          <Input id="callback-number" type="tel" inputMode="tel" autoComplete="tel" placeholder="514 555 0100" value={number} onChange={event => setNumber(event.target.value)} className="h-[50px] rounded-fx-xs" required />
          <p className="text-xs leading-5 text-fx-muted">We ring your phone first, then connect you to the customer. The customer sees the FLEXS number, not yours. Calls are not recorded.</p>
          <div className="flex gap-2">
            <Button type="submit" disabled={calling || number.trim().length < 10} className="h-11 gap-2 rounded-fx-xs shadow-fx-button"><PhoneCall className="size-4" aria-hidden="true" />{calling ? "Calling…" : "Call me now"}</Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-11 rounded-fx-xs">Cancel</Button>
          </div>
        </form>
      )}
    </div>
  );
}
