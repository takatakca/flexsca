import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { availabilityLabel, lowestPricedQuoteId, sortQuotes, type QuoteSort } from '@/lib/quote-compare';

interface QuoteListProps {
  leadId: string;
  customer?: boolean;
  onDecision?: () => void;
  /** Customer view: business names by professional id, so each quote says who sent it. */
  proNames?: Record<string, string>;
  /** Customer view: open the conversation with this professional. */
  onMessage?: (proId: string) => void;
}

const money = (n: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(n);
const STATUS_STYLE: Record<string, string> = {
  accepted: 'bg-[hsl(146_64%_36%/0.12)] text-[hsl(146_64%_22%)]',
  declined: 'bg-muted text-muted-foreground',
  sent: 'bg-primary/10 text-primary',
};

export default function QuoteList({ leadId, customer = false, onDecision, proNames, onMessage }: QuoteListProps) {
  const { user } = useAuth();
  const [deciding, setDeciding] = useState<string | null>(null);
  const [sort, setSort] = useState<QuoteSort>('price');
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
  const price = (quote: { price_min: number | null; price_max: number | null }) =>
    `${quote.price_min !== null ? money(quote.price_min) : quote.price_max !== null ? `Up to ${money(quote.price_max)}` : 'Price to be discussed'}${quote.price_min !== null && quote.price_max !== null ? ` – ${money(quote.price_max)}` : ''}`;
  const comparing = customer && (data?.length ?? 0) >= 2;
  const sorted = useMemo(() => (comparing && data ? sortQuotes(data, sort) : data ?? []), [comparing, data, sort]);
  const lowest = useMemo(() => (comparing && data ? lowestPricedQuoteId(data) : null), [comparing, data]);

  return <section className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-semibold">{customer ? 'Compare quotes' : 'Your quotes'}{comparing ? <span className="ml-2 text-sm font-normal text-muted-foreground">{`${data!.length} quotes`}</span> : null}</h2>
      {comparing && <div role="group" aria-label="Sort by" className="inline-flex rounded-lg border p-0.5 text-sm">
        {(['price', 'newest'] as const).map(option => <button key={option} type="button" aria-pressed={sort === option} onClick={() => setSort(option)} className={`min-h-9 rounded-md px-3 ${sort === option ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>{option === 'price' ? 'Lowest price first' : 'Newest first'}</button>)}
      </div>}
    </div>
    {isLoading ? <p role="status" className="text-sm text-muted-foreground">Loading quotes…</p> : error ? <p role="alert">{error.message}</p> : !data?.length ? <p className="text-sm text-muted-foreground">No quotes yet.</p>
      : comparing ? <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="Quotes side by side">
        {sorted.map(quote => {
          const name = proNames?.[quote.pro_id] ?? 'Professional';
          return <li key={quote.id} aria-label={`Quote from ${name}`} className={`flex flex-col rounded-xl border bg-card p-4 ${quote.status === 'accepted' ? 'border-primary ring-1 ring-primary' : ''} ${quote.status === 'declined' ? 'opacity-70' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold leading-snug" translate="no">{name}</p>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[quote.status] ?? STATUS_STYLE.sent}`}>{quote.status}</span>
            </div>
            <p className="mt-3 text-xl font-bold">{price(quote)}</p>
            <p className="mt-1 min-h-4 text-xs font-medium text-primary">{lowest === quote.id ? 'Lowest price' : ''}</p>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Availability</dt><dd>{availabilityLabel(quote.availability)}</dd>
              <dt className="text-muted-foreground">Received</dt><dd>{formatDistanceToNow(new Date(quote.created_at), { addSuffix: true })}</dd>
            </dl>
            <p className="mt-3 flex-1 whitespace-pre-wrap text-sm" translate="no">{quote.message}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <a className="text-primary" href={`/profile/${quote.pro_id}`}>View professional profile</a>
              {onMessage && <button type="button" className="text-primary" onClick={() => onMessage(quote.pro_id)}>Message</button>}
            </div>
            {quote.status === 'sent' && <div className="mt-3 flex gap-2">
              <Button size="sm" className="flex-1" disabled={!!deciding} aria-label={`Accept quote from ${name}`} onClick={() => void decide(quote.id, 'accepted')}>Accept quote</Button>
              <Button size="sm" variant="outline" disabled={!!deciding} aria-label={`Decline quote from ${name}`} onClick={() => void decide(quote.id, 'declined')}>Decline</Button>
            </div>}
          </li>;
        })}
      </ul>
      : data.map(quote => <div key={quote.id} className="rounded-xl border p-4 space-y-2"><div className="flex justify-between gap-4"><p className="font-semibold">{price(quote)}</p><span className="text-sm capitalize">{quote.status}</span></div><p className="text-sm whitespace-pre-wrap">{quote.message}</p>{customer && <a className="text-sm text-primary" href={`/profile/${quote.pro_id}`}>View professional profile</a>}<p className="text-xs text-muted-foreground">{quote.availability?.replace(/_/g, ' ')} · {formatDistanceToNow(new Date(quote.created_at), { addSuffix: true })}</p>{customer && quote.status === 'sent' && <div className="flex gap-2"><Button size="sm" disabled={!!deciding} onClick={() => void decide(quote.id, 'accepted')}>Accept quote</Button><Button size="sm" variant="outline" disabled={!!deciding} onClick={() => void decide(quote.id, 'declined')}>Decline</Button></div>}</div>)}
  </section>;
}
