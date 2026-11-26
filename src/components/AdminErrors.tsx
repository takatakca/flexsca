import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Row { message: string; path: string | null; agent: string | null; occurrences: number; first_seen: string; last_seen: string; stack: string | null }

/** Owner dashboard: errors visitors hit in their browsers during the last seven days. */
export default function AdminErrors() {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["admin-client-errors"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_client_errors" as never);
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });
  return (
    <section aria-labelledby="admin-errors-title">
      <h3 id="admin-errors-title" className="mb-1 text-xl font-semibold">Errors on the site</h3>
      <p className="mb-4 text-sm text-muted-foreground">What went wrong in visitors' browsers in the last 7 days. No personal data is recorded.</p>
      {isLoading ? <p role="status">Loading errors…</p>
        : error ? <div role="alert"><p>Unable to load the error log.</p><button type="button" className="mt-2 text-primary" onClick={() => void refetch()}>Retry error log</button></div>
        : !data?.length ? <p className="rounded-xl border bg-card p-4 text-muted-foreground">No error recorded. </p>
        : <ul className="space-y-3">{data.map(row => (
          <li key={`${row.message}|${row.path}`} className="rounded-xl border bg-card p-4">
            <p translate="no" className="break-words font-medium text-foreground">{row.message}</p>
            <p className="mt-1 text-sm text-muted-foreground"><span translate="no">{row.path ?? "—"}</span> · {row.occurrences} times · last {new Date(row.last_seen).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}</p>
            {row.stack && <details className="mt-2 text-xs text-muted-foreground"><summary className="cursor-pointer">Technical details</summary><pre translate="no" className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words">{row.stack}</pre></details>}
          </li>
        ))}</ul>}
    </section>
  );
}
