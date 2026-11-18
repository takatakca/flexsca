import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import SiteHeader from '@/components/fx/SiteHeader';
import SiteFooter from '@/components/fx/SiteFooter';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function Support(){
  const {id}=useParams();
  // Frames 609:843, 610:988, 610:1295: header, breadcrumb, then the request form or the conversation.
  return <div className="min-h-screen bg-background"><SiteHeader /><main className="mx-auto max-w-3xl space-y-6 px-gutter py-8">
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-3 text-[13px] text-fx-ink"><Link to="/help" className="hover:text-primary">Help centre</Link><span aria-hidden="true">/</span>{id ? <><Link to="/support" className="hover:text-primary">My support tickets</Link><span aria-hidden="true">/</span><span aria-current="page">Conversation</span></> : <span aria-current="page">Submit a request</span>}</nav>
    {id ? <SupportThread id={id} /> : <SupportInbox />}</main><SiteFooter /></div>;
}
function SupportInbox(){
  const {user}=useAuth();const navigate=useNavigate();
  const [subject,setSubject]=useState('');const [category,setCategory]=useState('general');const [message,setMessage]=useState('');const [saving,setSaving]=useState(false);const [page,setPage]=useState(0);
  const request=useRef({key:'',id:''});
  const {data,error,isLoading,refetch}=useQuery({queryKey:['support-inbox',user?.id,page],enabled:!!user,queryFn:async()=>{
    const {data,error,count}=await supabase.from('support_tickets').select('id,subject,category,status,created_at,updated_at',{count:'exact'}).eq('user_id',user!.id).order('updated_at',{ascending:false}).order('id',{ascending:false}).range(page*20,page*20+19);
    if(error)throw new Error('Unable to load support tickets.');return {tickets:data ?? [],total:count ?? 0};
  }});
  const create=async(event:React.FormEvent)=>{
    event.preventDefault();if(saving || subject.trim().length<3 || message.trim().length<10)return;
    setSaving(true);const key=JSON.stringify([subject.trim(),category,message.trim()]);if(request.current.key!==key)request.current={key,id:crypto.randomUUID()};
    try {
      const {data,error}=await supabase.rpc('create_support_ticket',{p_subject:subject.trim(),p_category:category,p_message:message.trim(),p_request_id:request.current.id});
      if(error || !data)throw error;toast.success('Support ticket created.');navigate(`/support/${data}`);
    }catch{toast.error('Unable to submit your support request. Please try again shortly.');}finally{setSaving(false);}
  };
  const field='h-[42px] w-full rounded-fx-xs border border-fx-secondary bg-white px-4 text-sm text-fx-ink focus:border-primary focus:outline-none';
  return <><h1 className="pt-6 text-[28px] text-fx-ink">Submit a request</h1><p className="text-sm text-fx-secondary">Tickets are private to your account and the FLEXS support team.</p>
    <form onSubmit={create} className="space-y-6">
      <div><p id="support-topic-label" className="mb-3 text-fx-ink">What is your issue or question regarding?</p>
        <select id="support-category" aria-label="Topic" value={category} onChange={e=>setCategory(e.target.value)} className={field}><option value="general">I need help with something else</option><option value="credits">Credits, billing or a credit refund</option><option value="account">Account access</option><option value="privacy">Account deletion or data request</option></select></div>
      {category==='credits' && <p className="text-sm text-fx-muted">To ask for credits back on a request you unlocked, open that request and use its refund form: the team then sees the request directly. <Link to="/help/credit-refunds" className="text-primary">How credit refunds work</Link></p>}
      <div><p className="mb-3 text-fx-ink">Your email address</p><p className={`${field} flex items-center bg-fx-soft text-fx-secondary`}>{user?.email}</p></div>
      <div><label htmlFor="support-subject" className="mb-3 block text-fx-ink">Subject</label><input id="support-subject" required minLength={3} maxLength={120} value={subject} onChange={e=>setSubject(e.target.value)} className={field} /></div>
      <div><label htmlFor="support-message" className="mb-3 block text-lg text-fx-ink">Describe your issue</label><textarea id="support-message" required minLength={10} maxLength={4000} rows={9} value={message} onChange={e=>setMessage(e.target.value)} className="w-full rounded-fx-xs border border-fx-secondary bg-white px-4 py-3 text-sm text-fx-ink focus:border-primary focus:outline-none" />
        <p className="mt-2 text-sm text-fx-muted">{category==='privacy' ? 'The team will review your request. Creating a ticket does not delete your account or data.' : 'Give as much detail as you can. You can add more in the conversation afterwards.'}</p></div>
      <Button type="submit" className="h-11 rounded-fx-xs px-8 shadow-fx-button" disabled={saving || subject.trim().length<3 || message.trim().length<10}>{saving ? 'Submitting…' : 'Submit support ticket'}</Button>
    </form>
    <section className="space-y-3 border-t border-fx-line pt-8"><h2 className="text-xl text-fx-ink">Your tickets</h2>{isLoading ? <p role="status">Loading tickets…</p> : error ? <div role="alert"><p>{error.message}</p><Button onClick={()=>void refetch()}>Retry tickets</Button></div> : data?.tickets.length ? data.tickets.map(ticket=><Link key={ticket.id} to={`/support/${ticket.id}`} className="block border rounded-xl p-4 hover:border-primary"><p className="font-medium">{ticket.subject}</p><p className="text-sm text-muted-foreground mt-1">{ticket.status==='open' ? 'Open' : 'Closed'} · {ticket.category} · Updated {formatDistanceToNow(new Date(ticket.updated_at),{addSuffix:true})}</p></Link>) : <p className="text-muted-foreground">No support tickets yet.</p>}
      {data && data.total>20 && <nav aria-label="Support ticket pages" className="flex justify-center gap-4"><Button variant="outline" disabled={page===0} onClick={()=>setPage(v=>v-1)}>Previous tickets</Button><span className="self-center text-sm">Page {page+1} of {Math.ceil(data.total/20)}</span><Button variant="outline" disabled={(page+1)*20>=data.total} onClick={()=>setPage(v=>v+1)}>Next tickets</Button></nav>}
    </section>
  </>;
}
function SupportThread({id}:{id:string}){
  const {user}=useAuth();const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);const [page,setPage]=useState(0);const request=useRef({key:'',id:''});
  const {data,error,isLoading,refetch}=useQuery({queryKey:['support-thread',user?.id,id,page],enabled:!!user,refetchInterval:30000,queryFn:async()=>{
    const [ticket,messages]=await Promise.all([supabase.from('support_tickets').select('id,subject,category,status,updated_at').eq('id',id).single(),supabase.from('support_messages').select('id,message,is_staff,created_at',{count:'exact'}).eq('ticket_id',id).order('created_at',{ascending:false}).order('id',{ascending:false}).range(page*100,page*100+99)]);
    if(ticket.error || messages.error)throw new Error('Unable to load this ticket. Check that you are signed in with the account that created it.');return {ticket:ticket.data,messages:[...(messages.data ?? [])].reverse(),total:messages.count ?? 0};
  }});
  const reply=async(event:React.FormEvent)=>{
    event.preventDefault();if(busy || !message.trim())return;setBusy(true);const key=JSON.stringify([id,message.trim()]);if(request.current.key!==key)request.current={key,id:crypto.randomUUID()};
    try {const {error}=await supabase.rpc('reply_support_ticket',{p_ticket_id:id,p_message:message.trim(),p_request_id:request.current.id});if(error)throw error;setMessage('');setPage(0);request.current={key:'',id:''};await refetch();}
    catch{toast.error('Unable to send your reply. Please try again.');}finally{setBusy(false);}
  };
  const status=async()=>{
    if(busy || !data)return;setBusy(true);
    try{const {error}=await supabase.rpc('set_support_ticket_status',{p_ticket_id:id,p_status:data.ticket.status==='open' ? 'closed' : 'open'});if(error)throw error;await refetch();}
    catch{toast.error('Unable to update the ticket.');}finally{setBusy(false);}
  };
  if(isLoading)return <p role="status">Loading support conversation…</p>;
  if(error)return <div role="alert" className="space-y-3"><p>{error.message}</p><Button onClick={()=>void refetch()}>Retry conversation</Button></div>;
  if(!data)return null;
  return <><div className="flex flex-wrap justify-between gap-4"><div><h1 className="text-2xl font-bold">{data.ticket.subject}</h1><p className="text-sm text-muted-foreground mt-2">{data.ticket.category} · {data.ticket.status==='open' ? 'Open ticket' : 'Closed ticket'}</p></div><Button variant="outline" disabled={busy} onClick={()=>void status()}>{data.ticket.status==='open' ? 'Close ticket' : 'Reopen ticket'}</Button></div>
    <div className="space-y-3" aria-live="polite">{data.messages.map(item=><article key={item.id} className={`border rounded-xl p-4 ${item.is_staff ? 'bg-primary/5' : ''}`}><p className="text-sm font-semibold">{item.is_staff ? 'FLEXS support' : 'Customer'}</p><p className="text-sm whitespace-pre-wrap mt-2">{item.message}</p><time className="block text-xs text-muted-foreground mt-3" dateTime={item.created_at}>{formatDistanceToNow(new Date(item.created_at),{addSuffix:true})}</time></article>)}</div>
    {data.total>100 && <nav aria-label="Support conversation pages" className="flex gap-3"><Button variant="outline" disabled={(page+1)*100>=data.total} onClick={()=>setPage(v=>v+1)}>Older messages</Button><span className="self-center text-sm">Page {page+1} of {Math.ceil(data.total/100)}</span><Button variant="outline" disabled={page===0} onClick={()=>setPage(v=>v-1)}>Newer messages</Button></nav>}
    {data.ticket.status==='open' && <form onSubmit={reply} className="space-y-3"><label htmlFor="support-reply" className="block text-sm font-medium">Your reply</label><Textarea id="support-reply" required maxLength={4000} value={message} onChange={e=>setMessage(e.target.value)} /><Button type="submit" disabled={busy || !message.trim()}>Send support reply</Button></form>}
  </>;
}
