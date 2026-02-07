import {
  ChevronsLeft,
  Bell,
  Info,
  CheckCircle2,
  ListChecks,
  Phone,
  Mail,
  Coins,
} from "lucide-react";

/* ─── "Be the 1st to respond" banner ─── */
interface FirstToRespondProps {
  isFirstToRespond: boolean;
}

export function FirstToRespondBanner({ isFirstToRespond }: FirstToRespondProps) {
  if (!isFirstToRespond) return null;

  return (
    <div className="mx-4 mt-4 rounded-xl border border-[hsl(160,50%,85%)] bg-[hsl(160,50%,95%)] px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <ChevronsLeft className="h-5 w-5 text-[hsl(160,60%,40%)]" />
        <span className="text-sm font-semibold text-foreground">
          Be the 1st to respond
        </span>
      </div>
      <Info className="h-4.5 w-4.5 text-muted-foreground" />
    </div>
  );
}

/* ─── Set Reminder button ─── */
interface SetReminderButtonProps {
  onSetReminder: () => void;
}

export function SetReminderButton({ onSetReminder }: SetReminderButtonProps) {
  return (
    <button
      onClick={onSetReminder}
      className="mx-4 mt-3 w-[calc(100%-2rem)] rounded-xl border border-border bg-muted/50 py-3 flex items-center justify-center gap-2.5 text-sm font-semibold text-primary hover:bg-muted transition-colors"
    >
      <Bell className="h-4.5 w-4.5" />
      Set reminder
    </button>
  );
}

/* ─── Highlights section ─── */
interface HighlightsProps {
  hasVerifiedPhone: boolean;
  hasAdditionalDetails: boolean;
}

export function Highlights({
  hasVerifiedPhone,
  hasAdditionalDetails,
}: HighlightsProps) {
  if (!hasVerifiedPhone && !hasAdditionalDetails) return null;

  return (
    <div className="px-4 mt-4">
      <div className="flex items-center gap-1.5 mb-2.5">
        <h3 className="text-base font-bold text-foreground">Highlights</h3>
        <Info className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex flex-wrap gap-2">
        {hasVerifiedPhone && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground">
            <CheckCircle2 className="h-4 w-4 text-[hsl(160,60%,40%)]" />
            Verified phone
          </span>
        )}
        {hasAdditionalDetails && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground">
            <ListChecks className="h-4 w-4 text-muted-foreground" />
            Additional details
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Masked Contact Details (before unlock) ─── */
function maskPhone(phone: string) {
  // Show area code, mask the rest: (514) •••-••••
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 10) {
    return `(${digits.slice(0, 3)}) •••-••••`;
  }
  return phone.replace(/[a-zA-Z0-9]/g, "•");
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return "•••@•••.com";
  const first = local.charAt(0);
  return `${first}${"•".repeat(Math.min(local.length - 1, 6))}@${domain.charAt(0)}${"•".repeat(Math.min(domain.length - 1, 5))}`;
}

interface MaskedContactDetailsProps {
  phone: string | null;
  email: string | null;
  isContacted: boolean;
}

export function ContactDetailsSection({
  phone,
  email,
  isContacted,
}: MaskedContactDetailsProps) {
  if (!phone && !email) return null;

  return (
    <div className="px-4 mt-4">
      <div className="flex items-center gap-1.5 mb-2.5">
        <h3 className="text-base font-bold text-foreground">Contact Details</h3>
        <Info className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        {phone && (
          <div className="flex items-center gap-2.5">
            <Phone className="h-4 w-4 text-muted-foreground" />
            {isContacted ? (
              <a
                href={`tel:${phone}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                {phone}
              </a>
            ) : (
              <span className="text-sm font-medium text-foreground">
                {maskPhone(phone)}{" "}
                <CheckCircle2 className="inline h-3.5 w-3.5 text-[hsl(160,60%,40%)]" />
              </span>
            )}
          </div>
        )}
        {email && (
          <div className="flex items-center gap-2.5">
            <Mail className="h-4 w-4 text-muted-foreground" />
            {isContacted ? (
              <a
                href={`mailto:${email}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                {email}
              </a>
            ) : (
              <span className="text-sm font-medium text-foreground">
                {maskEmail(email)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Credits cost display ─── */
interface CreditsCostProps {
  creditsCost: number;
}

export function CreditsCostDisplay({ creditsCost }: CreditsCostProps) {
  return (
    <div className="px-4 mt-4 flex items-center gap-2">
      <Coins className="h-5 w-5 text-primary" />
      <span className="text-base font-bold text-foreground">
        {creditsCost} Credits
      </span>
    </div>
  );
}
