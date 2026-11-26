import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, ClipboardList, HelpCircle, RefreshCw } from 'lucide-react';
import SiteHeader from '@/components/fx/SiteHeader';
import CategoryCard, { SectionTitle } from '@/components/fx/CategoryCard';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

type Filter='all'|'open'|'resolved';
const pageSize=12;
export default function BuyerDashboard(){
  const {user}=useAuth();const navigate=useNavigate();
  const [filter,setFilter]=useState<Filter>('all');const [page,setPage]=useState(0);
  const {data,error,isLoading,isFetching,refetch}=useQuery({queryKey:['customer-requests',user?.id,filter,page],enabled:!!user,retry:false,refetchInterval:30000,queryFn:async()=>{
    const claim=await supabase.rpc('claim_customer_leads');if(claim.error)throw new Error('Verify your email to access requests posted with that address.');
    const select='id,category,status,archived,created_at,location_text';
    let list=supabase.from('leads').select(select,{count:'exact'}).eq('customer_user_id',user!.id);
    if(filter==='open')list=list.eq('archived',false).in('status',['new','contacted']);
    if(filter==='resolved')list=list.or('archived.eq.true,status.in.(won,lost)');
    const [requests,all,open,resolved]=await Promise.all([
      list.order('created_at',{ascending:false}).order('id',{ascending:false}).range(page*pageSize,page*pageSize+pageSize-1),
      supabase.from('leads').select('id',{count:'exact',head:true}).eq('customer_user_id',user!.id),
      supabase.from('leads').select('id',{count:'exact',head:true}).eq('customer_user_id',user!.id).eq('archived',false).in('status',['new','contacted']),
      supabase.from('leads').select('id',{count:'exact',head:true}).eq('customer_user_id',user!.id).or('archived.eq.true,status.in.(won,lost)'),
    ]);
    if([requests,all,open,resolved].some(result=>result.error))throw new Error('Unable to load your requests. Please try again.');
    return {requests:requests.data ?? [],total:requests.count ?? 0,counts:{all:all.count ?? 0,open:open.count ?? 0,resolved:resolved.count ?? 0}};
  }});
  const suggestions=useQuery({queryKey:['customer-service-suggestions'],queryFn:async()=>{
    const {data,error}=await supabase.from('service_categories').select('id,name,slug,icon,hero_image').eq('is_active',true).order('sort_order').limit(4);
    if(error)throw new Error('Service suggestions are unavailable.');return data ?? [];
  }});
  useEffect(()=>{ if(data && page>0 && page*pageSize>=data.total)setPage(Math.max(0,Math.ceil(data.total/pageSize)-1)); },[data,page]);
  const changeFilter=(value:Filter)=>{setFilter(value);setPage(0);};
  return <div className="min-h-screen bg-fx-soft text-fx-ink">
    <a href="#customer-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-white focus:p-3">Skip to requests</a>
    <SiteHeader />
    <main id="customer-content" className="mx-auto max-w-6xl px-gutter pb-16 pt-16">
      {/* Desktop frame 25:6315: title left, "Place new request" right. */}
      <div className="md:flex md:items-center md:justify-between">
        <h1 className="text-center text-4xl md:text-left md:text-[52px]">Your requests</h1>
        <Link to="/post-job" className="hidden rounded-fx-xs bg-accent px-5 py-3 text-sm text-primary md:inline-block">Place new request</Link>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <div role="group" aria-label="Filter customer requests" className="inline-flex rounded-fx-xs bg-card p-1 shadow-fx-card">{(['all','open','resolved'] as const).map(value=><button key={value} aria-pressed={filter===value} onClick={()=>changeFilter(value)} className={`rounded-fx-xs px-4 py-2 text-xs ${filter===value ? 'bg-primary text-primary-foreground' : 'text-fx-secondary hover:bg-fx-sunken'}`}>{value==='all' ? 'All projects' : value==='open' ? 'Open' : 'Resolved'}{!isLoading && !error && data ? <span aria-hidden="true"> ({data.counts[value]})</span> : null}</button>)}</div>
        <button type="button" aria-label="Refresh customer requests" disabled={isFetching} onClick={()=>void refetch()} className="grid size-9 place-items-center rounded-fx-xs bg-card text-fx-secondary shadow-fx-card"><RefreshCw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} /></button>
        <Link to="/customer-notifications" aria-label="Customer notifications" className="grid size-9 place-items-center rounded-fx-xs bg-card text-fx-secondary shadow-fx-card"><Bell className="size-4" /></Link>
        <Link to="/support" aria-label="Customer support" className="grid size-9 place-items-center rounded-fx-xs bg-card text-fx-secondary shadow-fx-card"><HelpCircle className="size-4" /></Link>
      </div>

      <section className="mt-8">
        {isLoading ? <div role="status" className="rounded-fx-xs bg-card p-8 text-center text-fx-muted shadow-fx-card">Loading your requests…</div>
          : error ? <div role="alert" className="rounded-fx-xs bg-card p-6 text-center shadow-fx-card"><p>{error.message}</p><Button variant="outline" className="mt-4" onClick={()=>void refetch()}>Retry requests</Button></div>
          : data?.requests.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{data.requests.map(request=>{
            const resolved=request.archived || ['won','lost'].includes(request.status);
            const status=request.archived ? 'Closed request' : request.status==='won' ? 'Professional chosen' : request.status==='lost' ? 'No longer open' : 'Open for responses';
            const detail=request.archived ? 'Your existing conversations are still available.' : request.status==='won' ? 'View the conversation and the quote you accepted.' : request.status==='lost' ? 'This request is no longer receiving responses.' : 'Professionals can respond. Open the request to see quotes and messages.';
            return <article key={request.id} className="rounded-fx-xs bg-card px-[15px] pb-[30px] pt-7 text-center shadow-fx-card">
              <h2 className="text-xl">{request.category}</h2>
              <p className="mt-3 text-sm text-fx-muted">{formatDistanceToNow(new Date(request.created_at),{addSuffix:true})} · {request.location_text}</p>
              <div className={`mt-4 rounded-fx-xs px-4 py-3 text-xs leading-5 ${resolved ? 'bg-fx-sunken text-fx-secondary' : 'bg-success/10 text-[hsl(146_64%_22%)]'}`}><p className="font-bold">{status}</p><p>{detail}</p></div>
              <Button className="mt-5 h-9 rounded-fx-xs px-[30px] text-xs shadow-fx-button" onClick={()=>navigate(`/my-requests/${request.id}`)}>View request</Button>
            </article>;
          })}</div>
          : <div className="rounded-fx-xs bg-card p-10 text-center shadow-fx-card"><ClipboardList className="mx-auto mb-4 size-10 text-fx-muted" /><h2 className="text-xl">{filter==='all' ? 'Your next project starts here.' : `No ${filter} requests.`}</h2><p className="mb-5 mt-2 text-sm text-fx-muted">{filter==='all' ? 'Tell us what you need to start receiving professional responses.' : 'Try another filter to view your other projects.'}</p>{filter!=='all' && <Button variant="outline" onClick={()=>changeFilter('all')}>Show all projects</Button>}</div>}
        {data && data.total>pageSize && <nav aria-label="Customer request pages" className="mt-6 flex flex-wrap items-center justify-center gap-4"><Button variant="outline" disabled={page===0} onClick={()=>setPage(v=>v-1)}>Previous requests</Button><span className="text-xs text-fx-muted">Page {page+1} of {Math.ceil(data.total/pageSize)}</span><Button variant="outline" disabled={(page+1)*pageSize>=data.total} onClick={()=>setPage(v=>v+1)}>Next requests</Button></nav>}
        <p className="mt-10 text-center md:hidden"><Link to="/post-job" className="inline-block rounded-fx-xs bg-accent px-5 py-2.5 text-xs text-primary">Place new request</Link></p>
      </section>

      <section className="pt-20" aria-labelledby="also-need">
        <SectionTitle id="also-need">You may also need</SectionTitle>
        {suggestions.isLoading ? <p role="status" className="mt-6 text-center text-sm text-fx-muted">Loading services…</p>
          : suggestions.error ? <div role="alert" className="mt-6 text-center"><p className="text-sm text-fx-muted">Service suggestions could not be loaded. Your requests remain available.</p><Button variant="outline" className="mt-3" onClick={()=>void suggestions.refetch()}>Retry suggestions</Button></div>
          : <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">{suggestions.data?.map(category=><CategoryCard key={category.id} category={category} />)}</div>}
        <Link to="/pro" className="mt-8 block rounded-fx-xs bg-accent px-6 py-5 text-center text-sm text-primary">Are you a professional? Register now to find new customers through FLEXS.</Link>
      </section>
    </main>
  </div>;
}
