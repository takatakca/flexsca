import { supabase } from '@/integrations/supabase/client';

export async function createFollowUp(input: { leadId: string; remindAt: string; note: string; requestId: string }) {
  const date = new Date(input.remindAt);
  if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now() || date.getTime() > Date.now() + 365 * 86400000) {
    throw new Error('Choose a future time within the next year.');
  }
  if (input.note.trim().length > 2000) throw new Error('Keep your note within 2,000 characters.');
  const { data, error } = await supabase.rpc('create_follow_up', {
    p_lead_id: input.leadId, p_remind_at: date.toISOString(), p_note: input.note.trim() || null, p_request_id: input.requestId,
  });
  if (error) throw new Error('Unable to save your reminder. Please try again.');
  return data;
}
