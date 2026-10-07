import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useUnreadNotifications() {
  const {user}=useAuth();
  return useQuery({
    queryKey:['unread-notifications',user?.id],enabled:!!user,refetchInterval:30000,
    queryFn:async()=>{
      const collected=await supabase.rpc('collect_due_follow_ups');
      if(collected.error) throw new Error('Unable to refresh due follow-ups.');
      const {count,error}=await supabase.from('notifications').select('id',{count:'exact',head:true}).eq('user_id',user!.id).is('read_at',null);
      if(error) throw new Error('Unable to load unread updates.');
      return count ?? 0;
    },
  });
}
