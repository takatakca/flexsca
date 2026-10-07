import QuoteList from "@/components/lead-detail/QuoteList";
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Send, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function CustomerRequest() {
  const { id } = useParams();
  const { user } = useAuth();
  const [selectedPro, setSelectedPro] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['customer-request', id, user?.id], enabled: !!id && !!user,
    queryFn: async () => {
      const claim = await supabase.rpc('claim_customer_leads');
      if (claim.error) throw new Error('Verify your email to view your requests.');
      const [request, providers, messages] = await Promise.all([
        supabase.from('leads').select('id,category,location_text,status,details,created_at,archived').eq('id', id!).eq('customer_user_id', user!.id).single(),
        supabase.rpc('customer_request_providers', { p_lead_id: id! }),
        supabase.from('lead_messages').select('id,agent_id,sender_type,message,created_at').eq('lead_id', id!).order('created_at'),
      ]);
      if (request.error || providers.error || messages.error) throw new Error('Unable to load this request. Check that you are signed in with the email used to post it.');
      return { request: request.data, providers: providers.data ?? [], messages: messages.data ?? [] };
    },
  });
  useEffect(() => { if (!selectedPro && data?.providers.length) setSelectedPro(data.providers[0].user_id); }, [selectedPro, data?.providers]);
  const refreshMessages = useCallback(() => { void refetch(); }, [refetch]);
  useRealtimeMessages(id, refreshMessages);
  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id || !selectedPro || !text.trim() || sending) return;
    setSending(true);
    try {
      const { error } = await supabase.from('lead_messages').insert({ lead_id: id, agent_id: selectedPro, sender_type: 'customer', message: text.trim() });
      if (error) throw error;
      setText('');
      await refetch();
    } catch { toast.error('Unable to send your message. Please try again.'); }
    finally { setSending(false); }
  };
  const closeRequest = async () => {
    const { error } = await supabase.rpc('close_customer_request', { p_lead_id: id! });
    if (error) toast.error('Unable to close your request.');
    else { toast.success('Request closed. Existing conversations remain available.'); await refetch(); }
  };
  const thread = data?.messages.filter(m => m.agent_id === selectedPro || m.agent_id === null) ?? [];
  return <div className="max-w-6xl mx-auto px-4 py-6 md:py-10">
    <Link to="/my-requests" className="inline-flex items-center gap-2 text-primary text-sm mb-6"><ArrowLeft className="h-4 w-4" />My requests</Link>
    {isLoading ? <p role="status">Loading your request…</p> : error ? <div role="alert" className="space-y-4"><p>{error.message}</p><Button onClick={() => void refetch()}>Try again</Button></div> : data && <>
      <div className="flex flex-wrap justify-between gap-4 mb-8"><div><p className="text-sm text-muted-foreground mb-2">{data.request.archived ? 'Closed request' : 'Open request'} · {formatDistanceToNow(new Date(data.request.created_at), { addSuffix: true })}</p><h1 className="text-3xl font-bold">{data.request.category}</h1><p className="text-muted-foreground mt-2">{data.request.location_text}</p></div>
        {!data.request.archived && <AlertDialog><AlertDialogTrigger asChild><Button variant="outline">Close request</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Close this request?</AlertDialogTitle><AlertDialogDescription>New professionals will no longer be able to unlock this request. Your existing conversations will remain available.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep open</AlertDialogCancel><AlertDialogAction onClick={() => void closeRequest()}>Close request</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
      </div>
      {data.request.details && <div className="p-5 border rounded-xl mb-6"><h2 className="font-semibold mb-2">Your request details</h2><p className="whitespace-pre-wrap text-sm">{data.request.details}</p></div>}
      <div className="mb-6"><QuoteList leadId={id!} customer onDecision={() => void refetch()} /></div>
      <div className="grid md:grid-cols-[280px_1fr] border rounded-xl overflow-hidden bg-card">
        <aside className="border-b md:border-b-0 md:border-r p-4"><h2 className="font-semibold mb-4">Interested professionals</h2>{data.providers.length ? <div className="space-y-2">{data.providers.map(pro => <button key={pro.user_id} onClick={() => setSelectedPro(pro.user_id)} aria-pressed={selectedPro === pro.user_id} className={`w-full text-left rounded-lg p-3 ${selectedPro === pro.user_id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}><p className="font-medium">{pro.company_name}</p><p className="text-xs text-muted-foreground mt-1">Contact unlocked {formatDistanceToNow(new Date(pro.contacted_at), { addSuffix: true })}</p></button>)}</div> : <p className="text-sm text-muted-foreground">No professionals have unlocked your request yet. Conversations will appear here when they respond.</p>}</aside>
        <section className="p-4 md:p-6"><h2 className="font-semibold mb-5">Conversation</h2>{selectedPro ? <><Link to={`/profile/${selectedPro}`} className="text-primary text-sm">View professional profile</Link><div aria-live="polite" className="space-y-3 my-5 max-h-[480px] overflow-y-auto">{thread.map(message => <div key={message.id} className={`p-4 rounded-xl max-w-[90%] ${message.sender_type === 'customer' ? 'ml-auto bg-primary/10' : 'bg-muted'}`}><p className="text-xs font-medium mb-1">{message.sender_type === 'customer' ? 'You' : message.sender_type === 'system' ? 'FLEXS' : 'Professional'}</p><p className="text-sm whitespace-pre-wrap">{message.message}</p><time className="block text-xs text-muted-foreground mt-2" dateTime={message.created_at}>{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}</time></div>)}</div><form onSubmit={send} className="space-y-3"><label htmlFor="customer-message" className="text-sm font-medium">Your message</label><Textarea id="customer-message" maxLength={4000} value={text} onChange={e => setText(e.target.value)} placeholder="Discuss your needs or ask about a quote…" /><Button disabled={sending || !text.trim()} type="submit"><Send className="h-4 w-4 mr-2" />{sending ? 'Sending…' : 'Send message'}</Button></form></> : <div className="py-12 text-center text-muted-foreground"><MessageSquare className="h-8 w-8 mx-auto mb-3" /><p>Select a professional to start a conversation.</p></div>}</section>
      </div>
    </>}
  </div>;
}
