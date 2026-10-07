import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function QuoteList({ leadId, customer = false, onDecision }: { leadId: string; customer?: boolean; onDecision?: () => void }) {
  const { user } = useAuth();
  const [deciding, setDeciding] = useState<string | null>(null);
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['quotes', leadId, user?.id], enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('responses').select('*').eq('lead_id', leadId).order('created_at', { ascending: false });
      if (error) throw new Error('Unable to load quotes.');
      return data;
    },
  });
  const decide = async (quoteId: string, decision: 'accepted' | 'declined') => {
    setDeciding(quoteId);
    try {
      const { error } = await supabase.rpc('decide_quote', { p_quote_id: quoteId, p_decision: decision });
      if (error) throw error;
      toast.success(`Quote ${decision}.`);
      await refetch();
      onDecision?.();
    } catch { toast.error('Unable to update this quote. Please refresh and try again.'); }
    finally { setDeciding(null); }
  };
  const money = (n: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(n);
  return <section className="space-y-3"><h2 className="font-semibold">{customer ? 'Compare quotes' : 'Your quotes'}</h2>
    {isLoading ? <p role="status" className="text-sm text-muted-foreground">Loading quotes…</p> : error ? <p role="alert">{error.message}</p> : data?.length ? data.map(quote => <div key={quote.id} className="rounded-xl border p-4 space-y-2"><div className="flex justify-between gap-4"><p className="font-semibold">{quote.price_min !== null ? money(quote.price_min) : 'Price to be discussed'}{quote.price_max !== null ? ` – ${money(quote.price_max)}` : ''}</p><span className="text-sm capitalize">{quote.status}</span></div><p className="text-sm whitespace-pre-wrap">{quote.message}</p>{customer && <a className="text-sm text-primary" href={`/profile/${quote.pro_id}`}>View professional profile</a>}<p className="text-xs text-muted-foreground">{quote.availability?.replace(/_/g, ' ')} · {formatDistanceToNow(new Date(quote.created_at), { addSuffix: true })}</p>{customer && quote.status === 'sent' && <div className="flex gap-2"><Button size="sm" disabled={!!deciding} onClick={() => void decide(quote.id, 'accepted')}>Accept quote</Button><Button size="sm" variant="outline" disabled={!!deciding} onClick={() => void decide(quote.id, 'declined')}>Decline</Button></div>}</div>) : <p className="text-sm text-muted-foreground">No quotes yet.</p>}
  </section>;
}
