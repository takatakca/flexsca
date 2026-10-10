import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type SalesSummary = { quotedRequests:number; acceptedRequests:number; pendingQuotes:number; declinedQuotes:number; pricedAccepted:number; estimatedMin:number; estimatedMax:number; creditsSpent:number; creditsRefunded:number };
const money=(value:number)=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(value);

export default function ProviderSalesSummary() {
  const {user} = useAuth();
  const [period,setPeriod] = useState('30');
  const {data,error,isLoading,refetch} = useQuery({
    queryKey:['provider-sales',user?.id,period],enabled:!!user,
    queryFn: async () => {
      const {data,error}=await supabase.rpc('provider_sales_summary',{p_since:period==='all' ? null : new Date(Date.now()-30*86400000).toISOString()});
      if(error) throw new Error('Unable to load your quote activity.');
      return data as SalesSummary;
    },
  });
  const rate=data?.quotedRequests ? Math.round(data.acceptedRequests/data.quotedRequests*100) : 0;
  return <Card className="rounded-2xl shadow-none"><CardContent className="p-5 md:p-6 space-y-5">
    <div className="flex flex-wrap gap-4 justify-between items-center"><h3 className="text-lg font-semibold">Your quote activity</h3>
      <label className="flex items-center gap-2 text-sm">Period<select aria-label="Quote activity period" className="bg-background border rounded-lg px-3 py-2" value={period} onChange={e=>setPeriod(e.target.value)}><option value="30">Last 30 days</option><option value="all">All time</option></select></label>
    </div>
    {isLoading ? <p role="status">Loading quote activity…</p> : error ? <div role="alert" className="space-y-3"><p>{error.message}</p><Button variant="outline" onClick={()=>void refetch()}>Retry quote activity</Button></div> : data && <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div><p className="text-2xl font-bold">{data.quotedRequests}</p><p className="text-sm text-muted-foreground">Requests quoted</p></div>
        <div><p className="text-2xl font-bold">{data.acceptedRequests}</p><p className="text-sm text-muted-foreground">Quotes accepted</p></div>
        <div><p className="text-2xl font-bold">{data.quotedRequests ? `${rate}%` : '—'}</p><p className="text-sm text-muted-foreground">Request acceptance rate</p></div>
        <div><p className="text-2xl font-bold">{data.pendingQuotes}</p><p className="text-sm text-muted-foreground">Quotes awaiting a decision</p></div>
      </div>
      <div className="border-t pt-4 flex flex-wrap gap-6 justify-between">
        <div><p className="text-sm text-muted-foreground">Accepted quote estimates</p><p className="font-semibold mt-1">{data.pricedAccepted ? `${money(data.estimatedMin)}${data.estimatedMax!==data.estimatedMin ? ` – ${money(data.estimatedMax)}` : ''}` : 'No priced accepted quotes'}</p></div>
        <div><p className="text-sm text-muted-foreground">Lead credits spent / refunded</p><p className="font-semibold mt-1">{data.creditsSpent} / {data.creditsRefunded}</p></div>
      </div>
      <p className="text-xs text-muted-foreground">Quote totals use the date the quote was created. Acceptance counts each request once. Estimates cover {data.pricedAccepted} priced accepted quote{data.pricedAccepted!==1 ? 's' : ''}; they are not collected payments.</p>
    </>}
  </CardContent></Card>;
}
