import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function NotificationPreferences() {
  const {user}=useAuth();
  const [saving,setSaving]=useState(false);
  const {data,error,isLoading,refetch}=useQuery({
    queryKey:['notification-preferences',user?.id],enabled:!!user,
    queryFn:async()=>{
      const {data,error}=await supabase.from('notification_preferences').select('messages,reminders').eq('user_id',user!.id).maybeSingle();
      if(error) throw new Error('Unable to load notification preferences.');
      return data ?? {messages:true,reminders:true};
    },
  });
  const save=async(key:'messages'|'reminders',value:boolean)=>{
    if(!data || saving)return;
    setSaving(true);
    try {
      const next={...data,[key]:value};
      const {error}=await supabase.rpc('set_notification_preferences',{p_messages:next.messages,p_reminders:next.reminders});
      if(error)throw error;
      await refetch();toast.success('Notification preferences saved.');
    } catch {toast.error('Unable to save your preferences. Please try again.');}
    finally {setSaving(false);}
  };
  return <section className="px-4 py-4 space-y-4"><h2 className="text-sm font-semibold">In-app notifications</h2><p className="text-sm text-muted-foreground">Choose which new updates appear in FLEXS. Existing notifications remain available. Due reminders are collected while the app is open; email, SMS, and device push are not enabled.</p>
    {isLoading ? <p role="status">Loading preferences…</p> : error ? <div role="alert"><p>{error.message}</p><Button variant="outline" onClick={()=>void refetch()}>Retry preferences</Button></div> : data && <>
      <label className="flex justify-between gap-4 items-center text-sm">Messages and quote decisions<Switch aria-label="Message notifications" disabled={saving} checked={data.messages} onCheckedChange={value=>void save('messages',value)} /></label>
      <label className="flex justify-between gap-4 items-center text-sm">Due follow-up reminders<Switch aria-label="Reminder notifications" disabled={saving} checked={data.reminders} onCheckedChange={value=>void save('reminders',value)} /></label>
    </>}
  </section>;
}
