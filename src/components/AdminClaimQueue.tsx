import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { adminClaimQueue, adminDecideClaim } from "@/lib/directory";

/** Business claims that could not be proven by email and wait for a person to decide. */
export default function AdminClaimQueue() {
  const client = useQueryClient();
  const { data, error, isLoading } = useQuery({ queryKey: ["admin-claims"], queryFn: adminClaimQueue });
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const decide = async (id: string, approve: boolean) => {
    setBusy(true); setFailure("");
    try { await adminDecideClaim(id, approve); await client.invalidateQueries({ queryKey: ["admin-claims"] }); }
    catch (e) { setFailure((e as Error).message); }
    finally { setBusy(false); }
  };
  return (
    <section>
      <h3 className="text-xl font-semibold mb-4">Business claims to verify</h3>
      {failure && <p role="alert" className="mb-3 text-destructive">{failure}</p>}
      {isLoading ? <p role="status">Loading claims…</p> : error ? <p role="alert">{(error as Error).message}</p>
        : !data?.length ? <p className="text-muted-foreground">No claims waiting.</p>
        : <div className="space-y-3">{data.map(claim => (
          <div key={claim.claim_id} className="p-4 border rounded-fx-md">
            <p className="font-medium">{claim.listing_name} · {claim.city} · {claim.trade}</p>
            <p className="text-sm text-muted-foreground">RBQ licence {claim.licence}. Claimed by {claim.claimant_email} as {claim.role}. Check the RBQ register and call the number listed there before approving.</p>
            {claim.note && <p className="text-sm whitespace-pre-wrap mt-2">{claim.note}</p>}
            <div className="flex gap-2 mt-3">
              <Button size="sm" disabled={busy} onClick={() => void decide(claim.claim_id, true)}>Approve and start trial</Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => void decide(claim.claim_id, false)}>Reject</Button>
            </div>
          </div>))}</div>}
    </section>
  );
}
