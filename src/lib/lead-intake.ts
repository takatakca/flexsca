import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

export type AnswerValue = string | string[];
export const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Valid email required').max(255),
  phone: z.string().trim().max(40).optional(),
  location: z.string().trim().min(1, 'Location is required').max(200),
  details: z.string().trim().max(2000).optional(),
});
const uuid = z.string().uuid();
const attributionKey = 'flexs.attribution';
export function captureAttribution(search: string) {
  const value = new URLSearchParams(search).get('ttclid');
  if (value && uuid.safeParse(value).success) {
    try { sessionStorage.setItem(attributionKey, value); } catch { /* Storage can be unavailable. */ }
  }
}
export function currentAttribution(): string | null {
  try {
    const value = sessionStorage.getItem(attributionKey);
    return uuid.safeParse(value).success ? value : null;
  } catch { return null; }
}
export async function submitLead(category: string, form: z.infer<typeof contactSchema>, answers: Record<string, AnswerValue>, urgent = false) {
  const clean = contactSchema.parse(form);
  const [city, postal] = clean.location.split(',').map(v => v.trim());
  const isUrgent = urgent || Object.values(answers).flat().some(v => /emergency|asap|as soon as possible/i.test(v));
  const { data, error } = await supabase.rpc('submit_lead', {
    p_category: category, p_location_text: clean.location, p_city: city || null, p_postal_code: postal || null,
    p_customer_name: clean.name, p_customer_email: clean.email, p_customer_phone: clean.phone || null,
    p_details: clean.details || null, p_answers: answers, p_is_urgent: isUrgent, p_attribution_id: currentAttribution(),
  });
  if (error || !data) throw new Error('Unable to submit your request. Please try again.');
  return data;
}
