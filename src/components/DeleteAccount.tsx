import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const REASONS: Record<string, string> = {
  administrator: "Administrator accounts cannot be deleted here. Contact support.",
  used_by_another_product: "This sign-in is also used by another service on the same account system. Contact support and we will remove your FLEXS data.",
};

/** Permanent self-service account deletion. Required by Google Play and the App Store. */
export default function DeleteAccount() {
  const navigate = useNavigate();
  const [confirmation, setConfirmation] = useState("");
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const remove = async () => {
    if (working || confirmation !== "DELETE") return;
    setWorking(true); setMessage(null);
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", { body: { confirm: "DELETE" } });
      if (error) {
        const details = await (error as { context?: Response }).context?.json?.().catch(() => null);
        setMessage(REASONS[details?.reason as string] ?? "We could not delete your account. Try again shortly or contact support.");
        return;
      }
      if (!data?.deleted) { setMessage("We could not delete your account. Try again shortly or contact support."); return; }
      await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
      toast.success("Your account has been deleted.");
      navigate("/", { replace: true });
    } catch {
      setMessage("We could not delete your account. Try again shortly or contact support.");
    } finally { setWorking(false); }
  };

  return (
    <section className="border border-destructive/40 rounded-xl p-5 space-y-3" aria-labelledby="delete-account-title">
      <h3 id="delete-account-title" className="font-semibold">Delete account</h3>
      <p className="text-sm text-muted-foreground">
        Permanently deletes your FLEXS sign-in, profile, requests, messages, quotes, uploaded files and any unused credits. This cannot be undone. Payment records are kept by our payment processor as the law requires.
      </p>
      <AlertDialog onOpenChange={() => { setConfirmation(""); setMessage(null); }}>
        <AlertDialogTrigger asChild><Button variant="destructive">Delete my account</Button></AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              Your profile, requests, messages, files and unused credits will be removed and cannot be recovered. Type DELETE to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <label htmlFor="delete-confirmation" className="text-sm font-medium">Type DELETE to confirm</label>
          <Input id="delete-confirmation" value={confirmation} onChange={e => setConfirmation(e.target.value)} autoComplete="off" autoCapitalize="characters" />
          {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>Keep my account</AlertDialogCancel>
            <Button variant="destructive" disabled={working || confirmation !== "DELETE"} onClick={() => void remove()}>
              {working ? "Deleting…" : "Delete account"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
