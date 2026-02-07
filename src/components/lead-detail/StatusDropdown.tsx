import { useState } from "react";
import { ChevronDown, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CustomStatus } from "@/hooks/useCustomStatuses";

interface StatusDropdownProps {
  statuses: CustomStatus[];
  currentStatusId: string | null;
  leadId: string;
  onStatusChanged: (statusId: string) => void;
}

export default function StatusDropdown({
  statuses,
  currentStatusId,
  leadId,
  onStatusChanged,
}: StatusDropdownProps) {
  const [updating, setUpdating] = useState(false);

  const current = statuses.find((s) => s.id === currentStatusId);
  const pending = statuses.filter((s) => s.category === "pending");
  const hired = statuses.filter((s) => s.category === "hired");
  const archived = statuses.filter((s) => s.category === "archived");

  const handleSelect = async (statusId: string) => {
    if (statusId === currentStatusId) return;
    setUpdating(true);

    const { error } = await supabase.rpc("set_lead_custom_status", {
      p_lead_id: leadId,
      p_status_id: statusId,
    });

    if (!error) {
      onStatusChanged(statusId);
      const selected = statuses.find((s) => s.id === statusId);
      toast.success(`Status updated to "${selected?.name}"`);
    } else {
      toast.error("Failed to update status");
    }
    setUpdating(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={updating}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border transition-colors bg-background hover:bg-accent"
          style={
            current
              ? {
                  borderColor: current.color,
                  color: current.color,
                  backgroundColor: `${current.color}15`,
                }
              : undefined
          }
        >
          {current && (
            <Circle className="h-2.5 w-2.5 fill-current" />
          )}
          {current?.name || "Set status"}
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-popover z-50">
        {pending.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">Pending</DropdownMenuLabel>
            {pending.map((s) => (
              <StatusItem
                key={s.id}
                status={s}
                isActive={s.id === currentStatusId}
                onSelect={handleSelect}
              />
            ))}
          </>
        )}
        {hired.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">Hired</DropdownMenuLabel>
            {hired.map((s) => (
              <StatusItem
                key={s.id}
                status={s}
                isActive={s.id === currentStatusId}
                onSelect={handleSelect}
              />
            ))}
          </>
        )}
        {archived.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">Archived</DropdownMenuLabel>
            {archived.map((s) => (
              <StatusItem
                key={s.id}
                status={s}
                isActive={s.id === currentStatusId}
                onSelect={handleSelect}
              />
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StatusItem({
  status,
  isActive,
  onSelect,
}: {
  status: CustomStatus;
  isActive: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <DropdownMenuItem
      onClick={() => onSelect(status.id)}
      className={`flex items-center gap-2 cursor-pointer ${isActive ? "font-bold" : ""}`}
    >
      <Circle
        className="h-3 w-3 shrink-0"
        style={{ color: status.color, fill: status.color }}
      />
      <span className="text-sm">{status.name}</span>
    </DropdownMenuItem>
  );
}
