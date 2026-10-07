import AdminSupportQueue from "@/components/AdminSupportQueue";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
export default function Admin() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['admin-operations', user?.id], enabled: !!user,
    queryFn: async () => {
      const admin = await supabase.rpc('is_platform_admin');
      if (admin.error || !admin.data) throw new Error('Administrator access required.');
      const [leads, refunds] = await Promise.all([supabase.rpc('admin_lead_queue'),supabase.from('lead_refund_requests').select('*').eq('status', 'pending').order('created_at')]);
      if (leads.error || refunds.error) throw new Error('Unable to load operations.');
      return { leads: leads.data ?? [], refunds: refunds.data ?? [] };
    },
  });
  const archive = async (id: string, archived: boolean) => {
    setBusy(true);
    const { error } = await supabase.rpc('admin_archive_lead', { p_lead_id: id, p_archived: archived });
    if (error) toast.error('Unable to update lead.'); else await refetch();
    setBusy(false);
  };
  const refund = async (id: string, approved: boolean) => {
    setBusy(true);
    const { error } = await supabase.rpc('admin_decide_refund', { p_request_id: id, p_approve: approved });
    if (error) toast.error('Unable to resolve refund.'); else { toast.success(approved ? 'Credits refunded.' : 'Refund declined.'); await refetch(); }
    setBusy(false);
  };
  return <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8"><div><p className="text-sm text-primary font-medium">FLEXS OPERATIONS</p><h2 className="text-3xl font-bold mt-2">Marketplace oversight</h2></div>{isLoading ? <p role="status">Loading operations…</p> : error ? <p role="alert">{error.message}</p> : data && <><AdminSupportQueue /><section><h3 className="text-xl font-semibold mb-4">Credit refund requests</h3>{data.refunds.length ? <div className="space-y-3">{data.refunds.map(request => <div key={request.id} className="p-4 border rounded-xl"><p className="text-sm whitespace-pre-wrap mb-3">{request.reason}</p><div className="flex gap-2"><Button size="sm" disabled={busy} onClick={() => void refund(request.id,true)}>Approve credit refund</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => void refund(request.id,false)}>Decline</Button></div></div>)}</div> : <p className="text-muted-foreground">No pending refunds.</p>}</section><section><h3 className="text-xl font-semibold mb-4">Latest 100 requests</h3><div className="overflow-auto border rounded-xl"><table className="w-full text-sm text-left"><thead className="bg-muted"><tr><th className="p-4">Service</th><th className="p-4">City</th><th className="p-4">Status</th><th className="p-4">Unlocks</th><th className="p-4">Action</th></tr></thead><tbody>{data.leads.map(lead => <tr key={lead.id} className="border-t"><td className="p-4">{lead.category}</td><td className="p-4">{lead.city}</td><td className="p-4">{lead.archived ? 'Closed' : lead.status}</td><td className="p-4">{lead.purchases}</td><td className="p-4"><Button variant="outline" size="sm" disabled={busy || lead.status === 'won'} onClick={() => void archive(lead.id,!lead.archived)}>{lead.archived ? 'Restore' : 'Close'}</Button></td></tr>)}</tbody></table></div></section></>}</div>;
}
