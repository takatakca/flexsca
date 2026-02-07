import { useState } from "react";
import { Clock, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const quickOptions = [
  { label: "In 1 hour", hours: 1 },
  { label: "In 4 hours", hours: 4 },
  { label: "Tomorrow", hours: 24 },
  { label: "In 3 days", hours: 72 },
  { label: "In 1 week", hours: 168 },
];

interface ReminderModalProps {
  open: boolean;
  onClose: () => void;
  leadId: string;
  leadCategory: string;
  customerName: string | null;
}

export default function ReminderModal({
  open,
  onClose,
  leadId,
  leadCategory,
  customerName,
}: ReminderModalProps) {
  const { user } = useAuth();
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleQuickSet = async (hours: number) => {
    if (!user) return;
    setSaving(true);

    const remindAt = new Date();
    remindAt.setHours(remindAt.getHours() + hours);

    const { error } = await supabase.from("reminders").insert({
      lead_id: leadId,
      user_id: user.id,
      remind_at: remindAt.toISOString(),
      note: note.trim() || null,
    });

    if (!error) {
      toast.success("Reminder set!");
      setNote("");
      onClose();
    } else {
      toast.error("Failed to set reminder");
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Set reminder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-sm font-medium text-foreground">{leadCategory}</p>
            {customerName && (
              <p className="text-xs text-muted-foreground">{customerName}</p>
            )}
          </div>

          <Textarea
            placeholder="Add a note (optional)…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="resize-none"
          />

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Quick set</p>
            <div className="grid grid-cols-2 gap-2">
              {quickOptions.map((opt) => (
                <Button
                  key={opt.label}
                  variant="outline"
                  className="rounded-xl h-10 text-sm"
                  disabled={saving}
                  onClick={() => handleQuickSet(opt.hours)}
                >
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
