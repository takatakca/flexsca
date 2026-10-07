import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { z } from 'zod';

export default function AccountSettings() {
  const {user}=useAuth();
  const [name,setName]=useState<string|null>(null);
  const [email,setEmail]=useState('');
  const [saving,setSaving]=useState(false);
  const {data,error,isLoading,refetch}=useQuery({queryKey:['account-settings',user?.id],enabled:!!user,queryFn:async()=>{
    const {data,error}=await supabase.from('profiles').select('display_name').eq('id',user!.id).single();
    if(error)throw new Error('Unable to load account settings.');return data;
  }});
  const saveName=async(event:React.FormEvent)=>{
    event.preventDefault();if(saving || !user)return;setSaving(true);
    try {
      const {error}=await supabase.from('profiles').update({display_name:(name ?? data?.display_name ?? '').trim() || null}).eq('id',user.id);
      if(error)throw error;await refetch();toast.success('Account name saved.');
    } catch {toast.error('Unable to save your account name.');}finally {setSaving(false);}
  };
  const changeEmail=async(event:React.FormEvent)=>{
    event.preventDefault();if(saving)return;
    if(!z.string().email().max(254).safeParse(email.trim()).success){toast.error('Enter a valid email address.');return;}
    setSaving(true);
    try {
      const {error}=await supabase.auth.updateUser({email:email.trim()},{emailRedirectTo:new URL('/auth/callback',window.location.origin).toString()});
      if(error)throw error;setEmail('');toast.info('Email change requested. Follow the confirmation instructions sent to your email accounts.');
    }catch{toast.error('Unable to request this email change. Try again shortly.');}finally{setSaving(false);}
  };
  return <div className="max-w-2xl mx-auto p-5 md:p-8 space-y-6"><Link to="/app/settings" className="text-sm text-primary">Back to Settings</Link><h2 className="text-2xl font-bold">Account settings</h2>
    {isLoading ? <p role="status">Loading account settings…</p> : error ? <div role="alert"><p>{error.message}</p><Button onClick={()=>void refetch()}>Retry account settings</Button></div> : <form onSubmit={saveName} className="border rounded-xl p-5 space-y-3"><label htmlFor="account-name" className="block font-medium">Account name</label><Input id="account-name" autoComplete="name" maxLength={100} value={name ?? data?.display_name ?? ''} onChange={e=>setName(e.target.value)} /><Button disabled={saving} type="submit">Save account name</Button></form>}
    <form onSubmit={changeEmail} className="border rounded-xl p-5 space-y-3"><h3 className="font-semibold">Sign-in email</h3><p className="text-sm">{user?.email}</p><p className="text-sm text-muted-foreground">A new sign-in email requires confirmation. Your public business contact details are managed separately in your profile.</p><label htmlFor="account-email" className="block text-sm font-medium">New email address</label><Input id="account-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} /><Button type="submit" disabled={saving || !email.trim() || email.trim()===user?.email}>Request email change</Button></form>
    <section className="border rounded-xl p-5 space-y-3"><h3 className="font-semibold">Password</h3><p className="text-sm text-muted-foreground">Request an email reset link to change your password securely.</p><Button asChild variant="outline"><Link to="/auth/forgot-password" state={{email:user?.email}}>Reset password</Link></Button></section>
  </div>;
}
