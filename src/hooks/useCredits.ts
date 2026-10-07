import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useCredits() {
  const {user}=useAuth();
  const query=useQuery({queryKey:['credit-wallet',user?.id],enabled:!!user,queryFn:async()=>{
    const [wallet,transactions]=await Promise.all([
      supabase.from('credit_wallets').select('balance').eq('user_id',user!.id).single(),
      supabase.from('credit_transactions').select('id,delta,reason,lead_id,created_at').eq('user_id',user!.id).order('created_at',{ascending:false}).limit(50),
    ]);
    if(wallet.error || transactions.error) throw new Error('Unable to load your credit balance and history.');
    return {balance:wallet.data.balance,transactions:transactions.data ?? []};
  }});
  return {balance:query.data?.balance ?? null,transactions:query.data?.transactions ?? [],loading:query.isLoading,error:query.error,refetch:query.refetch};
}
