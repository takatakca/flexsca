import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { customerReturnPath } from '@/lib/auth-navigation';

export default function ForgotPassword() {
  const location = useLocation();
  const [email,setEmail] = useState((location.state as {email?:string} | null)?.email ?? '');
  const [sending,setSending] = useState(false);
  const [sent,setSent] = useState(false);
  const [error,setError] = useState('');
  const next = customerReturnPath(new URLSearchParams(location.search).get('next'));
  const loginPath = `/auth/login${next ? `?next=${encodeURIComponent(next)}` : ''}`;
  const submit = async (event:React.FormEvent) => {
    event.preventDefault();
    if (sending) return;
    if (!z.string().email().max(254).safeParse(email.trim()).success) { setError('Enter a valid email address.'); return; }
    setSending(true); setError('');
    try {
      const redirect = new URL('/auth/reset-password',window.location.origin);
      if (next) redirect.searchParams.set('next',next);
      const {error} = await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:redirect.toString()});
      if (error) throw error;
      setSent(true);
    } catch { setError('Unable to request a reset link right now. Please try again shortly.'); }
    finally { setSending(false); }
  };
  return <main className="min-h-screen flex items-center justify-center px-5 py-10 bg-background"><div className="w-full max-w-md rounded-xl border p-6 space-y-5">
    <Link to="/" className="text-primary font-bold text-xl">FLEXS</Link>
    <h1 className="text-2xl font-bold">{sent ? 'Check your email' : 'Reset your password'}</h1>
    {sent ? <p className="text-muted-foreground">If an account uses this email, a password reset link will arrive shortly. Check your spam folder too.</p> : <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-muted-foreground">Enter the email you use for FLEXS. We’ll send a link to choose a new password.</p>
      <label htmlFor="recovery-email" className="block text-sm font-medium">Email address</label>
      <Input id="recovery-email" type="email" autoComplete="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} required />
      <Button type="submit" disabled={sending || !email.trim()} className="w-full">{sending ? 'Sending…' : 'Send reset link'}</Button>
    </form>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Link to={loginPath} className="inline-block text-sm text-primary">Back to login</Link>
  </div></main>;
}
