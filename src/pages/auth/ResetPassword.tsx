import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { customerReturnPath } from '@/lib/auth-navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ResetPassword() {
  const {session,loading} = useAuth();
  const location = useLocation();
  const [password,setPassword] = useState('');
  const [confirm,setConfirm] = useState('');
  const [saving,setSaving] = useState(false);
  const [complete,setComplete] = useState(false);
  const [error,setError] = useState('');
  const next = customerReturnPath(new URLSearchParams(location.search).get('next'));
  const query = next ? `?next=${encodeURIComponent(next)}` : '';
  const submit = async (event:React.FormEvent) => {
    event.preventDefault();
    if (saving || !session) return;
    if (password.length<12 || password.length>128) { setError('Use a password between 12 and 128 characters.'); return; }
    if (password!==confirm) { setError('The passwords do not match.'); return; }
    setSaving(true);setError('');
    try {
      const {error} = await supabase.auth.updateUser({password});
      if (error) throw error;
      setComplete(true);setPassword('');setConfirm('');
      const signout = await supabase.auth.signOut({scope:'global'});
      if (signout.error) setError('Your password was updated, but signing out other sessions failed. Sign out from Settings when your connection returns.');
    } catch { setError('Unable to update your password. The link may have expired, or your password may not meet the account requirements.'); }
    finally { setSaving(false); }
  };
  return <main className="min-h-screen flex items-center justify-center px-5 py-10 bg-background"><div className="w-full max-w-md rounded-xl border p-6 space-y-5">
    <Link to="/" className="text-primary font-bold text-xl">FLEXS</Link>
    <h1 className="text-2xl font-bold">{complete ? 'Password updated' : 'Choose a new password'}</h1>
    {loading ? <p role="status">Checking your reset link…</p> : complete ? <><p>Sign in with your new password.</p><Button asChild><Link to={`/auth/login${query}`}>Go to login</Link></Button></> : !session ? <><p className="text-muted-foreground">This reset link is missing or has expired. Request a new link to continue.</p><Button asChild><Link to={`/auth/forgot-password${query}`}>Request a new reset link</Link></Button></> : <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-muted-foreground">Use a unique password with at least 12 characters. After it is updated, your sessions will be signed out.</p>
      <label htmlFor="new-password" className="block text-sm font-medium">New password</label>
      <Input id="new-password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={password} onChange={e=>setPassword(e.target.value)} />
      <label htmlFor="confirm-password" className="block text-sm font-medium">Confirm new password</label>
      <Input id="confirm-password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={confirm} onChange={e=>setConfirm(e.target.value)} />
      <Button type="submit" disabled={saving || password.length<12 || !confirm} className="w-full">{saving ? 'Updating…' : 'Update password'}</Button>
    </form>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div></main>;
}
