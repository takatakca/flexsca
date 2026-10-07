import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, RefreshCw, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Health={pending:number;delivered:number;exhausted:number;leased:number;lastDeliveredAt:string|null;oldestPendingAt:string|null;recent:{id:string;occurred_at:string;attempts:number;last_status:number|null;delivered_at:string|null;next_attempt_at:string;leased:boolean|null}[]};
export default function AdminIntegrationHealth(){
  const {user}=useAuth();const [busy,setBusy]=useState<string|null>(null);
  const {data,error,isLoading,refetch}=useQuery({queryKey:['admin-attribution-health',user?.id],enabled:!!user,refetchInterval:30000,queryFn:async()=>{
    const {data,error}=await supabase.rpc('admin_attribution_health');if(error)throw new Error('Unable to read integration delivery status.');return data as Health;
  }});
  const retry=async(id:string)=>{
    if(busy)return;setBusy(id);
    try{const {data,error}=await supabase.rpc('admin_retry_attribution',{p_id:id});if(error)throw error;toast.success(data ? 'Event queued for another delivery attempt.' : 'Event is already queued.');await refetch();}
    catch{toast.error('Unable to retry. Refresh to check whether this event was delivered or is currently leased.');}finally{setBusy(null);}
  };
  return <section className="rounded-2xl border bg-white p-5 md:p-6 space-y-5"><div className="flex flex-wrap justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[0.15em] text-orange-700 font-semibold">Independent products · server integration</p><h3 className="text-xl font-semibold mt-2">TakaTak event delivery</h3></div><Button variant="outline" aria-label="Refresh integration status" onClick={()=>void refetch()}><RefreshCw className="size-4 mr-2" />Refresh</Button></div>
    {isLoading ? <p role="status">Loading event delivery…</p> : error ? <div role="alert"><p>{error.message}</p><Button variant="outline" className="mt-3" onClick={()=>void refetch()}>Retry integration status</Button></div> : data && <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[['Awaiting delivery',data.pending],['Delivered events',data.delivered],['Retries exhausted',data.exhausted],['Delivery in progress',data.leased]].map(([label,value])=><div key={label} className="rounded-xl bg-muted/50 p-4"><p className="text-2xl font-semibold">{value}</p><p className="text-xs text-muted-foreground mt-1">{label}</p></div>)}</div>
      <p className="text-sm text-muted-foreground">{data.lastDeliveredAt ? `Last successful event: ${new Date(data.lastDeliveredAt).toLocaleString()}. This records a past delivery, not current endpoint availability.` : 'No successful event delivery has been recorded. Configuration and live connectivity remain unverified.'}</p>
      {!!data.recent.length && <div className="overflow-x-auto border rounded-xl"><table className="w-full text-sm text-left"><caption className="text-left px-4 py-3 text-xs text-muted-foreground">Latest 20 opaque events. Customer contacts and documents are excluded.</caption><thead className="bg-muted/50"><tr><th className="px-4 py-3">Event</th><th className="px-4 py-3">State</th><th className="px-4 py-3">Attempts</th><th className="px-4 py-3">HTTP</th><th className="px-4 py-3">Action</th></tr></thead><tbody>{data.recent.map(event=><tr key={event.id} className="border-t"><td className="p-4 font-mono text-xs" title={event.id}>{event.id.slice(0,8)}</td><td className="p-4">{event.delivered_at ? 'Delivered' : event.leased ? 'In progress' : event.attempts>=12 ? 'Exhausted' : 'Queued'}</td><td className="p-4">{event.attempts}</td><td className="p-4">{event.last_status || '—'}</td><td className="p-4">{!event.delivered_at && !event.leased && event.attempts>=12 && <Button size="sm" variant="outline" disabled={!!busy} onClick={()=>void retry(event.id)}><RotateCcw className="size-3.5 mr-2" />Retry event</Button>}</td></tr>)}</tbody></table></div>}
    </>}
    <div className="border-t pt-4 flex flex-wrap justify-between gap-3 text-xs text-muted-foreground"><p>Retries keep the same event ID. Fix the underlying failure before replaying.</p><Link to="/help/takatak" className="text-primary inline-flex items-center gap-1">Connection boundaries <ArrowUpRight className="size-3" /></Link></div>
  </section>;
}
