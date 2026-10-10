import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
export default function AdminSupportQueue(){
  const {user}=useAuth();
  const {data,error,isLoading,refetch}=useQuery({queryKey:['admin-support',user?.id],enabled:!!user,refetchInterval:30000,queryFn:async()=>{
    const admin=await supabase.rpc('is_platform_admin');if(admin.error || !admin.data)throw new Error('Administrator access required.');
    const {data,error}=await supabase.from('support_tickets').select('id,subject,category,created_at').eq('status','open').order('created_at').limit(100);
    if(error)throw new Error('Unable to load support requests.');return data ?? [];
  }});
  return <section className="space-y-4"><h3 className="text-xl font-semibold">Support requests</h3>{isLoading ? <p role="status">Loading support queue…</p> : error ? <div role="alert"><p>{error.message}</p><Button onClick={()=>void refetch()}>Retry support queue</Button></div> : data?.length ? <div className="space-y-3">{data.map(ticket=><Link key={ticket.id} to={`/support/${ticket.id}`} className="block border rounded-xl p-4"><p className="font-medium">{ticket.subject}</p><p className="text-sm text-muted-foreground mt-1">{ticket.category} · {new Date(ticket.created_at).toLocaleDateString()}</p></Link>)}</div> : <p className="text-muted-foreground">No open support tickets.</p>}<p className="text-xs text-muted-foreground">Oldest 100 open tickets. Open a ticket to reply or close it.</p></section>;
}
