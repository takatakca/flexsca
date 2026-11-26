import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Account { user_id: string; email: string | null; display_name: string | null; created_at: string; company: string | null; credits: number; frozen: boolean; requests: number; unlocks: number; spent_cents: number }

const dollars = (cents: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format((cents ?? 0) / 100);

/** Owner dashboard: the 100 most recent accounts, or those matching an email, a name or a business. */
export default function AdminAccounts() {
  const [typed, setTyped] = useState("");
  const [search, setSearch] = useState("");
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["admin-accounts", search],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_accounts" as never, { p_search: search || null } as never);
      if (error) throw error;
      return (data ?? []) as unknown as Account[];
    },
  });
  return (
    <section aria-labelledby="admin-accounts-title">
      <h3 id="admin-accounts-title" className="mb-4 text-xl font-semibold">Accounts</h3>
      <form onSubmit={event => { event.preventDefault(); setSearch(typed.trim()); }} className="mb-4 flex flex-wrap gap-2">
        <label htmlFor="admin-account-search" className="sr-only">Search accounts</label>
        <input id="admin-account-search" value={typed} onChange={event => setTyped(event.target.value)} maxLength={100} placeholder="Email, name or business" className="h-10 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm" />
        <button type="submit" className="h-10 rounded-md bg-primary px-4 text-sm text-primary-foreground">Search accounts</button>
        {search && <button type="button" className="h-10 rounded-md border px-4 text-sm" onClick={() => { setTyped(""); setSearch(""); }}>Show latest</button>}
      </form>
      {isLoading ? <p role="status">Loading accounts…</p>
        : error ? <div role="alert"><p>Unable to load accounts.</p><button type="button" className="mt-2 text-primary" onClick={() => void refetch()}>Retry accounts</button></div>
        : !data?.length ? <p className="text-muted-foreground">No account matches.</p>
        : <div className="overflow-auto rounded-xl border"><table className="w-full text-left text-sm">
          <thead className="bg-muted"><tr><th className="p-3">Account</th><th className="p-3">Business</th><th className="p-3">Since</th><th className="p-3">Credits</th><th className="p-3">Requests</th><th className="p-3">Unlocks</th><th className="p-3">Paid</th></tr></thead>
          <tbody translate="no">{data.map(account => (
            <tr key={account.user_id} className="border-t align-top">
              <td className="p-3"><span className="block break-all font-medium">{account.email ?? "—"}</span><span className="text-muted-foreground">{account.display_name}</span></td>
              <td className="p-3">{account.company ?? "—"}</td>
              <td className="p-3 whitespace-nowrap">{new Date(account.created_at).toLocaleDateString("en-CA")}</td>
              <td className="p-3 tabular-nums">{account.credits}{account.frozen && <span className="ml-2 rounded bg-destructive px-1.5 py-0.5 text-xs text-destructive-foreground" translate="yes">Frozen</span>}</td>
              <td className="p-3 tabular-nums">{account.requests}</td>
              <td className="p-3 tabular-nums">{account.unlocks}</td>
              <td className="p-3 tabular-nums">{dollars(account.spent_cents)}</td>
            </tr>
          ))}</tbody>
        </table></div>}
    </section>
  );
}
