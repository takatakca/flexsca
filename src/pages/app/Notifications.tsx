import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
export default function Notifications({ customer = false }: { customer?: boolean }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['notifications', user?.id], enabled: !!user, refetchInterval: 30_000,
    queryFn: async () => {
      const collection = await supabase.rpc('collect_due_follow_ups');
      if (collection.error) throw new Error('Unable to refresh due reminders.');
      await queryClient.invalidateQueries({queryKey:['unread-notifications',user?.id]});
      const { data, error } = await supabase.from('notifications').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(50);
      if (error) throw new Error('Unable to load notifications.');
      return data;
    },
  });
  const markRead = async (id: string) => {
    const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
    if (error) toast.error('Unable to update notification.'); else { await refetch(); await queryClient.invalidateQueries({queryKey:['unread-notifications',user?.id]}); }
  };
  return <div className="max-w-4xl mx-auto p-4 md:p-8"><h1 className="text-2xl font-bold mb-6">Notifications</h1>{isLoading ? <p role="status">Loading notifications…</p> : error ? <div role="alert"><p>{error.message}</p><Button onClick={() => void refetch()}>Try again</Button></div> : data?.length ? <div className="space-y-3">{data.map(item => <div key={item.id} className={`p-4 border rounded-xl flex flex-wrap items-center justify-between gap-3 ${item.read_at ? '' : 'bg-primary/5'}`}><div>{item.support_ticket_id ? <Link to={`/support/${item.support_ticket_id}`} className="font-medium">{item.title}</Link> : item.lead_id ? <Link to={`${customer ? '/my-requests' : '/app/leads'}/${item.lead_id}`} className="font-medium">{item.title}</Link> : <p>{item.title}</p>}<p className="text-sm text-muted-foreground mt-1">{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</p></div>{!item.read_at && <Button variant="ghost" size="sm" onClick={() => void markRead(item.id)}>Mark read</Button>}</div>)}</div> : <div className="py-12 text-center text-muted-foreground"><Bell className="h-8 w-8 mx-auto mb-3" /><p>You’re all caught up.</p></div>}</div>;
}
