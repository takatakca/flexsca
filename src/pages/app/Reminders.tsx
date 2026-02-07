import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Loader2,
  Plus,
  Check,
  Clock,
  CalendarDays,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  format,
  formatDistanceToNow,
  isPast,
  differenceInHours,
  differenceInMinutes,
} from "date-fns";
import { toast } from "sonner";

interface Reminder {
  id: string;
  lead_id: string;
  remind_at: string;
  note: string | null;
  status: string;
  created_at: string;
  leads?: {
    category: string;
    location_text: string;
    customer_name: string | null;
  };
}

interface LeadOption {
  id: string;
  category: string;
  customer_name: string | null;
}

function getDueLabel(remindAt: string): { label: string; isOverdue: boolean } {
  const target = new Date(remindAt);
  const now = new Date();

  if (isPast(target)) {
    const minsAgo = differenceInMinutes(now, target);
    if (minsAgo < 60) return { label: `${minsAgo}m overdue`, isOverdue: true };
    const hrsAgo = differenceInHours(now, target);
    if (hrsAgo < 24) return { label: `${hrsAgo}h overdue`, isOverdue: true };
    return { label: formatDistanceToNow(target, { addSuffix: true }) + " overdue", isOverdue: true };
  }

  const minsUntil = differenceInMinutes(target, now);
  if (minsUntil < 60) return { label: `Due in ${minsUntil}m`, isOverdue: false };
  const hrsUntil = differenceInHours(target, now);
  if (hrsUntil < 24) return { label: `Due in ${hrsUntil}h`, isOverdue: false };
  return { label: `Due ${formatDistanceToNow(target, { addSuffix: true })}`, isOverdue: false };
}

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newReminder, setNewReminder] = useState({
    lead_id: "",
    remind_at: "",
    note: "",
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchReminders = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("reminders")
      .select("*, leads(category, location_text, customer_name)")
      .order("remind_at", { ascending: true });

    if (data) setReminders(data as any);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchReminders();

    supabase
      .from("leads")
      .select("id, category, customer_name")
      .then(({ data }) => {
        if (data) setLeads(data);
      });
  }, [user]);

  const handleMarkDone = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const { error } = await supabase
      .from("reminders")
      .update({ status: "done" })
      .eq("id", id);

    if (!error) {
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "done" } : r))
      );
      toast.success("Reminder marked as done");
    }
  };

  const handleCreate = async () => {
    if (!user || !newReminder.lead_id || !newReminder.remind_at) return;

    const { error } = await supabase.from("reminders").insert({
      lead_id: newReminder.lead_id,
      user_id: user.id,
      remind_at: new Date(newReminder.remind_at).toISOString(),
      note: newReminder.note || null,
    });

    if (!error) {
      toast.success("Reminder created");
      setDialogOpen(false);
      setNewReminder({ lead_id: "", remind_at: "", note: "" });
      fetchReminders();
    } else {
      toast.error("Failed to create reminder");
    }
  };

  const handleReminderClick = (leadId: string) => {
    navigate(`/app/leads/${leadId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground font-medium">Loading reminders…</p>
      </div>
    );
  }

  const openReminders = reminders.filter((r) => r.status === "open");
  const overdueReminders = openReminders.filter((r) => isPast(new Date(r.remind_at)));
  const upcomingReminders = openReminders.filter((r) => !isPast(new Date(r.remind_at)));
  const doneReminders = reminders.filter((r) => r.status === "done");

  return (
    <div className="p-4 space-y-4">
      {/* Create button */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full rounded-xl h-11">
            <Plus className="h-4 w-4 mr-2" /> New reminder
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create reminder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Select
              value={newReminder.lead_id}
              onValueChange={(v) =>
                setNewReminder((prev) => ({ ...prev, lead_id: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a lead" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.category}{lead.customer_name ? ` — ${lead.customer_name}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="datetime-local"
              value={newReminder.remind_at}
              onChange={(e) =>
                setNewReminder((prev) => ({
                  ...prev,
                  remind_at: e.target.value,
                }))
              }
            />

            <Textarea
              placeholder="Add a note (optional)"
              value={newReminder.note}
              onChange={(e) =>
                setNewReminder((prev) => ({ ...prev, note: e.target.value }))
              }
              rows={3}
            />

            <Button
              onClick={handleCreate}
              disabled={!newReminder.lead_id || !newReminder.remind_at}
              className="w-full rounded-xl"
            >
              Create reminder
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {openReminders.length === 0 && doneReminders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center mb-4">
            <Bell className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            No reminders yet
          </h2>
          <p className="text-muted-foreground max-w-xs">
            Create reminders to follow up on your leads at the right time.
          </p>
        </div>
      ) : (
        <>
          {/* Overdue */}
          {overdueReminders.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-destructive uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Overdue ({overdueReminders.length})
              </h3>
              {overdueReminders.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  onMarkDone={handleMarkDone}
                  onClick={() => handleReminderClick(reminder.lead_id)}
                />
              ))}
            </div>
          )}

          {/* Upcoming */}
          {upcomingReminders.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Upcoming ({upcomingReminders.length})
              </h3>
              {upcomingReminders.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  onMarkDone={handleMarkDone}
                  onClick={() => handleReminderClick(reminder.lead_id)}
                />
              ))}
            </div>
          )}

          {/* Done */}
          {doneReminders.length > 0 && (
            <div className="space-y-3 pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Completed ({doneReminders.length})
              </h3>
              {doneReminders.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  onMarkDone={handleMarkDone}
                  onClick={() => handleReminderClick(reminder.lead_id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ReminderCard({
  reminder,
  onMarkDone,
  onClick,
}: {
  reminder: Reminder;
  onMarkDone: (e: React.MouseEvent, id: string) => void;
  onClick: () => void;
}) {
  const isDone = reminder.status === "done";
  const dueInfo = !isDone ? getDueLabel(reminder.remind_at) : null;
  const leadData = (reminder as any).leads;

  return (
    <Card
      className={`p-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98] transition-transform ${
        isDone ? "opacity-60" : ""
      } ${dueInfo?.isOverdue ? "border-destructive/50" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium text-foreground truncate">
              {leadData?.category || "Lead"}
            </span>
            {dueInfo?.isOverdue && (
              <Badge variant="destructive" className="text-xs shrink-0">
                Overdue
              </Badge>
            )}
            {isDone && (
              <Badge variant="secondary" className="text-xs shrink-0">
                Done
              </Badge>
            )}
          </div>

          {leadData?.customer_name && (
            <p className="text-xs text-muted-foreground mb-1">
              {leadData.customer_name}
            </p>
          )}

          {reminder.note && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {reminder.note}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(reminder.remind_at), "PPp")}
            </span>
            {dueInfo && (
              <span className={dueInfo.isOverdue ? "text-destructive font-medium" : "text-primary font-medium"}>
                {dueInfo.label}
              </span>
            )}
          </div>
        </div>

        {!isDone && (
          <Button
            size="icon"
            variant="outline"
            className="shrink-0 h-9 w-9 rounded-full ml-2"
            onClick={(e) => onMarkDone(e, reminder.id)}
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}
