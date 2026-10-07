import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
export default function RefundRequest({ leadId }: { leadId: string }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const submit = async () => {
    setBusy(true);
    const { error } = await supabase.rpc('request_lead_refund', { p_lead_id: leadId, p_reason: reason.trim() });
    setBusy(false);
    if (error) toast.error('Unable to submit your refund request.');
    else { setSubmitted(true); toast.success('Refund request received for review.'); }
  };
  return <details className="rounded-xl border p-4"><summary className="text-sm font-medium cursor-pointer">Report a problem with this lead</summary>{submitted ? <p className="mt-3 text-sm">Your request is awaiting review. Approved refunds return lead credits to your wallet.</p> : <div className="mt-3 space-y-3"><label htmlFor="refund-reason" className="text-sm">Tell us what went wrong</label><Textarea id="refund-reason" value={reason} onChange={e => setReason(e.target.value)} maxLength={2000} placeholder="For example, invalid contact information or a duplicate request…" /><Button variant="outline" disabled={busy || reason.trim().length < 10} onClick={() => void submit()}>{busy ? 'Submitting…' : 'Request credit refund'}</Button></div>}</details>;
}
