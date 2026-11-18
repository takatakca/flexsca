import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Brand } from "@/components/fx/SiteHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { claimListing, getListing, getTrialTerms } from "@/lib/directory";

const ROLES = [["owner", "Owner"], ["manager", "Manager"], ["employee", "Employee authorised by the owner"]] as const;

/** Signed-in step where the owner takes over a directory listing. */
export default function ClaimBusiness() {
  const { slug = "" } = useParams();
  const { user } = useAuth();
  const client = useQueryClient();
  const { data: listing, isLoading } = useQuery({ queryKey: ["listing", slug], queryFn: () => getListing(slug) });
  const { data: terms } = useQuery({ queryKey: ["trial-terms"], queryFn: getTrialTerms, staleTime: 3_600_000 });
  const [role, setRole] = useState<string>("owner");
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<"approved" | "pending" | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (!listing || busy) return;
    setBusy(true); setError("");
    try {
      const outcome = await claimListing(listing.id, role, note);
      setResult(outcome.status);
      await client.invalidateQueries({ queryKey: ["listing", slug] });
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-gutter py-10 bg-fx-soft">
      <div className="w-full max-w-md rounded-fx-md border border-fx-line bg-white p-6 space-y-5 shadow-fx-card">
        <Brand />
        {isLoading ? <p role="status">Loading…</p>
          : !listing ? <><h1 className="text-[26px] text-fx-ink">Business not found</h1><Button asChild variant="outline"><Link to="/directory">Back to the directory</Link></Button></>
          : result === "approved" ? <>
              <h1 className="text-[26px] leading-snug text-fx-ink">{listing.other_name || listing.name} is yours</h1>
              <p className="text-fx-secondary">Your email matches the one on the public register, so the business was confirmed right away.{terms ? ` Your ${terms.trial_days}-day trial has started${terms.trial_credits ? ` with ${terms.trial_credits} credits` : ""}.` : ""}</p>
              <Button asChild className="w-full h-[50px] rounded-fx-xs text-base"><Link to="/app/settings/profile">Complete your profile</Link></Button>
            </>
          : result === "pending" ? <>
              <h1 className="text-[26px] leading-snug text-fx-ink">Claim received</h1>
              <p className="text-fx-secondary">We need to confirm that you represent {listing.other_name || listing.name}. You will get a notification when it is decided.{listing.source === "rbq" ? " To be confirmed at once, sign in with the email your business gave the RBQ." : ""}</p>
              <Button asChild variant="outline" className="w-full h-[50px] rounded-fx-xs text-base"><Link to={`/business/${listing.slug}`}>Back to the listing</Link></Button>
            </>
          : listing.status !== "listed" ? <>
              <h1 className="text-[26px] leading-snug text-fx-ink">Already claimed</h1>
              <p className="text-fx-secondary">This business is already managed on FLEXS. If that is a mistake, contact support.</p>
              <Button asChild variant="outline"><Link to="/support">Contact support</Link></Button>
            </>
          : <form onSubmit={submit} className="space-y-4">
              <h1 className="text-[26px] leading-snug text-fx-ink">Claim {listing.other_name || listing.name}</h1>
              <p className="text-sm text-fx-secondary">{listing.trade} · {listing.city}, QC{listing.source === "rbq" ? ` · RBQ licence ${listing.source_ref}` : ""}</p>
              <p className="text-sm text-fx-secondary">Signed in as <span className="text-fx-ink">{user?.email}</span>. {listing.source === "rbq" ? "If this is the email your business gave the RBQ, the claim is confirmed immediately. Otherwise our team reviews it." : "Our team confirms each claim before the business is handed over."} Claiming is free.</p>
              <label htmlFor="claim-role" className="block text-sm text-fx-ink">Your role</label>
              <select id="claim-role" value={role} onChange={e => setRole(e.target.value)} className="h-[50px] w-full rounded-fx-xs border border-fx-line bg-white px-4">
                {ROLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <label htmlFor="claim-note" className="block text-sm text-fx-ink">Anything that helps us confirm (optional)</label>
              <textarea id="claim-note" value={note} maxLength={500} rows={3} onChange={e => setNote(e.target.value)} className="w-full rounded-fx-xs border border-fx-line bg-white px-4 py-3" />
              <label className="flex items-start gap-3 text-sm text-fx-secondary"><input type="checkbox" className="mt-1 size-4" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />I am authorised to represent this business. False claims lead to account closure.</label>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={!confirmed || busy} className="w-full h-[50px] rounded-fx-xs text-base">{busy ? "Sending…" : "Claim this business"}</Button>
            </form>}
      </div>
    </main>
  );
}
