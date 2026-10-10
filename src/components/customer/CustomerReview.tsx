import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

type ReviewStatus = { providerId: string; companyName: string; review: { id: string; rating: number; text: string } | null } | null;

export default function CustomerReview({ leadId }: { leadId: string }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['customer-review', leadId, user?.id], enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('customer_review_status', { p_lead_id: leadId });
      if (error) throw new Error('Unable to load your review.');
      return data as ReviewStatus;
    },
  });
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting || text.trim().length < 10) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('submit_customer_review', { p_lead_id: leadId, p_rating: rating, p_text: text.trim() });
      if (error) throw error;
      await refetch();
      toast.success('Your verified customer review is published.');
    } catch { toast.error('Unable to publish your review. Please try again.'); }
    finally { setSubmitting(false); }
  };
  if (isLoading) return null;
  if (error) return <div role="alert" className="border rounded-xl p-4 mb-6"><p>{error.message}</p><Button variant="outline" className="mt-3" onClick={() => void refetch()}>Retry review</Button></div>;
  if (!data) return null;
  return <section className="border rounded-xl p-5 mb-6 space-y-3">
    <h2 className="font-semibold">{data.review ? 'Your published review' : `Review ${data.companyName}`}</h2>
    {data.review ? <><p className="text-sm font-medium">{data.review.rating} / 5 · Verified FLEXS customer</p><p className="text-sm whitespace-pre-wrap">{data.review.text}</p></> : <form onSubmit={submit} className="space-y-3">
      <p className="text-sm text-muted-foreground">Share your experience with the professional whose quote you accepted. Your first name, rating, and comments will appear publicly. Reviews are final once submitted.</p>
      <label htmlFor={`rating-${leadId}`} className="block text-sm font-medium">Rating</label>
      <select id={`rating-${leadId}`} value={rating} onChange={e => setRating(Number(e.target.value))} className="border rounded-lg bg-background p-2">
        {[5,4,3,2,1].map(value => <option key={value} value={value}>{value} / 5</option>)}
      </select>
      <label htmlFor={`review-${leadId}`} className="block text-sm font-medium">Your experience</label>
      <Textarea id={`review-${leadId}`} value={text} onChange={e => setText(e.target.value)} minLength={10} maxLength={2000} required placeholder="Describe your experience without sharing contact or payment details." />
      <Button type="submit" disabled={submitting || text.trim().length < 10}>{submitting ? 'Publishing…' : 'Publish review'}</Button>
    </form>}
  </section>;
}
