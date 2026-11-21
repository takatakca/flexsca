import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Overview = Record<"accounts" | "accounts_7d" | "professionals" | "requests" | "requests_7d" | "requests_open" | "unlocks" | "unlocks_7d" | "revenue_cents" | "revenue_cents_30d" | "credits_sold" | "credits_held" | "listings" | "listings_claimed" | "claims_pending" | "tickets_open" | "calls_30d" | "call_minutes_30d", number>;

const count = (value: number) => new Intl.NumberFormat("en-CA").format(value ?? 0);
const dollars = (cents: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format((cents ?? 0) / 100);

/** Owner dashboard: the business in one screen. Figures come from one administrator-only database function. */
export default function AdminOverview() {
  const { data, error, isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_overview" as never);
      if (error) throw error;
      return data as unknown as Overview;
    },
  });
  if (isLoading) return <p role="status">Loading the overview…</p>;
  if (error || !data) return <div role="alert" className="rounded-xl border p-4"><p>Unable to load the overview.</p><button type="button" className="mt-2 text-primary" onClick={() => void refetch()}>Retry overview</button></div>;

  const groups: [string, [string, string, string?][]][] = [
    ["Money", [["Revenue, all time", dollars(data.revenue_cents)], ["Revenue, last 30 days", dollars(data.revenue_cents_30d)], ["Credits sold", count(data.credits_sold)], ["Credits held by professionals", count(data.credits_held)]]],
    ["Marketplace", [["Requests", count(data.requests), `${count(data.requests_7d)} in the last 7 days`], ["Open requests", count(data.requests_open)], ["Contacts unlocked", count(data.unlocks), `${count(data.unlocks_7d)} in the last 7 days`], ["Calls, last 30 days", count(data.calls_30d), `${count(data.call_minutes_30d)} minutes`]]],
    ["People and directory", [["Accounts", count(data.accounts), `${count(data.accounts_7d)} in the last 7 days`], ["Professionals", count(data.professionals)], ["Businesses listed", count(data.listings)], ["Businesses claimed", count(data.listings_claimed)]]],
    ["Waiting for you", [["Claims to review", count(data.claims_pending)], ["Open support tickets", count(data.tickets_open)]]],
  ];
  return (
    <section aria-labelledby="admin-overview-title" className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="admin-overview-title" className="text-xl font-semibold">Overview</h3>
        <p className="text-xs text-muted-foreground">Updated {new Date(dataUpdatedAt).toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" })} · <button type="button" className="text-primary" onClick={() => void refetch()}>Refresh</button></p>
      </div>
      {groups.map(([title, cards]) => (
        <div key={title}>
          <h4 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">{title}</h4>
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {cards.map(([label, value, note]) => (
              <div key={label} className="rounded-xl border bg-card p-4">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</dd>
                {note && <dd className="mt-1 text-xs text-muted-foreground">{note}</dd>}
              </div>
            ))}
          </dl>
        </div>
      ))}
    </section>
  );
}
