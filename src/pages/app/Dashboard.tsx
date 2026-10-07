import ProviderSalesSummary from "@/components/ProviderSalesSummary";
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Bell, Coins, ClipboardList, MessageSquare, RefreshCw, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['provider-dashboard', user?.id], enabled: !!user,
    queryFn: async () => {
      const results = await Promise.all([
        supabase.from('leads_safe').select('id', { count: 'exact', head: true }).eq('archived', false).in('status', ['new', 'contacted']),
        supabase.from('lead_agent_state').select('lead_id', { count: 'exact', head: true }).eq('agent_id', user!.id).eq('contacted', true),
        supabase.from('reminders').select('id', { count: 'exact', head: true }).eq('user_id', user!.id).eq('status', 'open').lte('remind_at', new Date().toISOString()),
        supabase.from('credit_wallets').select('balance').eq('user_id', user!.id).single(),
        supabase.from('provider_reviews').select('rating').eq('user_id', user!.id),
        supabase.from('leads_safe').select('id,category,city,credits_cost,created_at,is_urgent').eq('archived', false).in('status', ['new', 'contacted']).order('created_at', { ascending: false }).limit(5),
        supabase.rpc('is_platform_admin'),
      ]);
      const failure = results.find(r => r.error)?.error;
      if (failure) throw new Error('We could not load your dashboard. Please try again.');
      const reviews = results[4].data ?? [];
      return {
        admin: results[6].data === true,
        available: results[0].count ?? 0, contacted: results[1].count ?? 0, due: results[2].count ?? 0,
        balance: results[3].data?.balance ?? 0, reviews: reviews.length,
        rating: reviews.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : null,
        recent: results[5].data ?? [],
      };
    },
  });
  if (error) return <div role="alert" className="p-8 space-y-4"><p>{error.message}</p><Button onClick={() => void refetch()}>Try again</Button></div>;
  const stats = [
    { label: 'Marketplace opportunities', value: data?.available, icon: ClipboardList, to: '/app/leads' },
    { label: 'Contacts unlocked', value: data?.contacted, icon: MessageSquare, to: '/app/responses' },
    { label: 'Follow-ups due', value: data?.due, icon: Bell, to: '/app/reminders' },
    { label: 'Available credits', value: data?.balance, icon: Coins, to: '/app/settings/credits' },
  ];
  return <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-10 space-y-7">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-orange-700 mb-3">FLEXS FOR PROFESSIONALS</p><h2 className="text-3xl lg:text-4xl font-semibold tracking-[-0.035em]">Your next opportunity starts here.</h2><p className="text-muted-foreground mt-2">Find work, follow up with customers, and keep your business moving.</p></div>
      <Button variant="outline" className="bg-white rounded-xl" onClick={() => void refetch()} aria-label="Refresh dashboard"><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
    </div>
    <div className="rounded-2xl bg-primary px-5 py-5 text-white flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold">Make room for your next project.</p><p className="text-xs text-white/65 mt-1.5">Explore requests and start the conversations that fit your business.</p></div><Button asChild className="bg-white text-primary hover:bg-white/90 rounded-xl"><Link to="/app/leads">Explore opportunities <ArrowRight className="size-4 ml-2" /></Link></Button></div>
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">{stats.map(({ label, value, icon: Icon, to }) => <Link to={to} key={label}><Card className="h-full rounded-2xl shadow-none hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all"><CardContent className="p-5"><Icon className="h-10 w-10 p-2.5 bg-primary/5 rounded-xl text-primary mb-4" /><p className="text-3xl font-semibold tracking-tight">{isLoading ? '…' : value}</p><p className="text-sm text-muted-foreground mt-1">{label}</p></CardContent></Card></Link>)}</div>
    <ProviderSalesSummary />
    <div className="grid lg:grid-cols-[1fr_300px] items-start gap-6">
      <Card className="rounded-2xl shadow-none"><CardContent className="p-5 md:p-6"><div className="flex items-center justify-between gap-4 mb-5"><h3 className="text-lg font-semibold">Latest opportunities</h3><Link to="/app/leads" className="text-sm text-primary flex items-center gap-1">View all <ArrowRight className="h-4 w-4" /></Link></div>
        {isLoading ? <p role="status" className="text-muted-foreground py-8">Loading opportunities…</p> : data?.recent.length ? <div className="divide-y">{data.recent.map(lead => <Link key={lead.id} to={`/app/leads/${lead.id}`} className="flex items-center justify-between gap-4 py-4 hover:text-primary"><div><p className="font-semibold">{lead.category} {lead.is_urgent && <span className="text-xs text-amber-700 ml-2">Urgent</span>}</p><p className="text-sm text-muted-foreground mt-1">{lead.city || 'Location provided'} · {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}</p></div><span className="text-sm whitespace-nowrap">{lead.credits_cost} credits</span></Link>)}</div> : <div className="py-10 text-center"><ClipboardList className="h-8 w-8 text-muted-foreground mx-auto mb-3" /><p>No open opportunities right now.</p><p className="text-sm text-muted-foreground mt-1">Check back for new customer requests.</p></div>}
      </CardContent></Card>
      <div className="space-y-4">{data?.admin && <Button asChild variant="outline" className="w-full"><Link to="/app/admin">Marketplace operations</Link></Button>}<Card className="rounded-2xl shadow-none"><CardContent className="p-5"><h3 className="font-semibold mb-3">Build customer confidence</h3><p className="text-sm text-muted-foreground mb-4">Introduce your business, add your services, and show examples of your work.</p><Button asChild className="w-full"><Link to="/app/settings/profile">Complete your profile</Link></Button></CardContent></Card>
        <Card className="rounded-2xl shadow-none"><CardContent className="p-5"><div className="flex items-center gap-2"><Star className="h-5 w-5 text-amber-500" /><h3 className="font-semibold">Customer reviews</h3></div><p className="text-2xl font-bold mt-3">{isLoading ? '…' : data?.rating ?? 'No ratings yet'}</p><p className="text-sm text-muted-foreground mt-1">{data?.reviews ?? 0} {(data?.reviews ?? 0)===1 ? 'review' : 'reviews'} on your profile</p></CardContent></Card>
        <a href="https://takatak.ca/services/lead-generation" target="_blank" rel="noopener noreferrer" className="block p-5 rounded-xl bg-primary/5 border border-primary/10"><p className="font-semibold">Grow with TakaTak</p><p className="text-sm text-muted-foreground mt-2">Explore the services behind your next stage of growth.</p><span className="text-primary text-sm mt-3 inline-flex items-center gap-2">Explore services <ArrowRight className="h-4 w-4" /></span></a>
      </div>
    </div>
  </div>;
}
