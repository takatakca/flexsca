import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Bell,
  ChevronDown,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Lead {
  id: string;
  category: string;
  location_text: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  details: string | null;
  status: string;
  archived: boolean;
  created_at: string;
}

const statusColors: Record<string, string> = {
  new: "bg-primary text-primary-foreground",
  contacted: "bg-warning text-warning-foreground",
  won: "bg-success text-success-foreground",
  lost: "bg-destructive text-destructive-foreground",
};

const statusOptions = ["new", "contacted", "won", "lost"] as const;

interface LeadHeaderProps {
  lead: Lead;
  onStatusChange: (status: string) => void;
  onArchiveToggle: () => void;
  reminderOpen: boolean;
  onReminderOpenChange: (open: boolean) => void;
  reminderDate: string;
  onReminderDateChange: (date: string) => void;
  reminderNote: string;
  onReminderNoteChange: (note: string) => void;
  onCreateReminder: () => void;
}

export default function LeadHeader({
  lead,
  onStatusChange,
  onArchiveToggle,
  reminderOpen,
  onReminderOpenChange,
  reminderDate,
  onReminderDateChange,
  reminderNote,
  onReminderNoteChange,
  onCreateReminder,
}: LeadHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="border-b p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => navigate("/app/leads")}
          className="flex items-center gap-1 text-sm text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="flex items-center gap-2">
          {/* Archive button */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={onArchiveToggle}
          >
            {lead.archived ? (
              <ArchiveRestore className="h-4 w-4" />
            ) : (
              <Archive className="h-4 w-4" />
            )}
          </Button>

          {/* Reminder button */}
          <Dialog open={reminderOpen} onOpenChange={onReminderOpenChange}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                <Bell className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set reminder for {lead.category}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Input
                  type="datetime-local"
                  value={reminderDate}
                  onChange={(e) => onReminderDateChange(e.target.value)}
                />
                <Textarea
                  placeholder="Add a note (optional)"
                  value={reminderNote}
                  onChange={(e) => onReminderNoteChange(e.target.value)}
                  rows={2}
                />
                <Button
                  onClick={onCreateReminder}
                  disabled={!reminderDate}
                  className="w-full rounded-xl"
                >
                  Create reminder
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Status dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                  statusColors[lead.status] || "bg-muted text-foreground"
                }`}
              >
                {lead.status}
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {statusOptions.map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => onStatusChange(s)}
                  className={lead.status === s ? "font-bold" : ""}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <h2 className="text-xl font-bold text-foreground mb-2">{lead.category}</h2>

      <div className="space-y-1 text-sm text-muted-foreground">
        <p className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4" /> {lead.location_text}
        </p>
        {lead.customer_name && <p>Customer: {lead.customer_name}</p>}
        {lead.customer_phone && (
          <p className="flex items-center gap-1.5">
            <Phone className="h-4 w-4" /> {lead.customer_phone}
          </p>
        )}
        {lead.customer_email && (
          <p className="flex items-center gap-1.5">
            <Mail className="h-4 w-4" /> {lead.customer_email}
          </p>
        )}
      </div>

      {lead.details && (
        <Card className="mt-3 p-3 bg-muted/50">
          <p className="text-sm text-foreground">{lead.details}</p>
        </Card>
      )}

      {lead.archived && (
        <div className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
          This lead is archived
        </div>
      )}
    </div>
  );
}
