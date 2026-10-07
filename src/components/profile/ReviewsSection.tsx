import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Copy, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function ReviewsSection() {
  const {user}=useAuth();
  const [deleting,setDeleting]=useState<string|null>(null);
  const {data,error,isLoading,refetch}=useQuery({queryKey:['provider-review-management',user?.id],enabled:!!user,queryFn:async()=>{
    const {data,error}=await supabase.from('provider_reviews').select('id,reviewer_name,rating,review_text,source,verified,created_at').eq('user_id',user!.id).order('created_at',{ascending:false}).limit(100);
    if(error)throw new Error('Unable to load your reviews.');return data ?? [];
  }});
  const copy=async()=>{
    try {await navigator.clipboard.writeText(new URL(`/profile/${user!.id}`,window.location.origin).toString());toast.success('Public profile link copied.');}
    catch{toast.error('Unable to copy the link. Use View public profile instead.');}
  };
  const remove=async(id:string)=>{
    if(deleting || !user)return;setDeleting(id);
    try {
      const {data,error}=await supabase.from('provider_reviews').delete().eq('id',id).eq('user_id',user.id).eq('verified',false).select('id').maybeSingle();
      if(error || !data)throw new Error('Review not deleted');
      await refetch();toast.success('Imported review deleted.');
    }catch{toast.error('Unable to delete this review. Verified customer reviews cannot be deleted by professionals.');}
    finally{setDeleting(null);}
  };
  const average=data?.length ? (data.reduce((sum,r)=>sum+r.rating,0)/data.length).toFixed(1) : null;
  return <section className="space-y-5"><h3 className="text-xl font-semibold">Customer reviews</h3>
    <p className="text-sm text-muted-foreground">FLEXS customers can publish a verified review from their request after accepting your quote. Verification confirms that customer relationship; it does not certify completed work. Imported reviews remain unverified.</p>
    <div className="flex flex-wrap gap-3"><Button variant="outline" onClick={()=>void copy()} disabled={!user}><Copy className="h-4 w-4 mr-2" />Copy profile link</Button><Button asChild variant="outline"><Link to={`/profile/${user?.id}`}>View public profile</Link></Button></div>
    {isLoading ? <p role="status">Loading reviews…</p> : error ? <div role="alert" className="space-y-3"><p>{error.message}</p><Button onClick={()=>void refetch()}>Retry reviews</Button></div> : !data?.length ? <p className="text-muted-foreground">No customer reviews yet.</p> : <>
      <p className="flex items-center gap-2 font-semibold"><Star className="h-5 w-5 text-amber-500" />{average} / 5 · {data.length} most recent reviews</p>
      <div className="space-y-3">{data.map(review=><article key={review.id} className="border rounded-xl p-4 space-y-2"><div className="flex flex-wrap justify-between gap-3"><p className="font-medium">{review.reviewer_name || 'Customer'} · {review.rating} / 5</p><time className="text-xs text-muted-foreground" dateTime={review.created_at}>{new Date(review.created_at).toLocaleDateString()}</time></div>
        <p className="text-xs text-primary">{review.verified ? review.source==='flexs' ? 'Verified FLEXS customer' : 'Verified review' : 'Imported · Unverified'}</p>
        {review.review_text && <p className="text-sm whitespace-pre-wrap">{review.review_text}</p>}
        {!review.verified && <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="sm" disabled={!!deleting}>Delete imported review</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this imported review?</AlertDialogTitle><AlertDialogDescription>This removes this unverified imported review from your public profile.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep review</AlertDialogCancel><AlertDialogAction onClick={()=>void remove(review.id)}>Delete review</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
      </article>)}</div>
    </>}
  </section>;
}
