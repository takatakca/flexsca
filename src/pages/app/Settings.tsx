import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  LogOut,
  ChevronRight,
  Loader2,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import WalletCard from "@/components/WalletCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState({
    newLeads: true,
    messages: true,
    reminders: true,
  });

  // Handle purchase return
  useEffect(() => {
    const purchase = searchParams.get("purchase");
    if (purchase === "success") {
      toast.success("Payment successful! Credits added to your account.");
      setSearchParams({}, { replace: true });
    } else if (purchase === "cancel") {
      toast.info("Purchase cancelled.");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, email")
        .eq("id", user.id)
        .single();

      if (data) {
        setDisplayName(data.display_name || "");
        setEmail(data.email || user.email || "");
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to save profile");
    } else {
      toast.success("Profile saved");
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth/welcome", { replace: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-primary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-center text-base font-semibold text-foreground">
          Settings
        </h1>
        <div className="w-6" />
      </div>

      {/* ── My account ── */}
      <SectionHeader label="My account" />

      <SettingsRow
        title="Account details"
        description="Your name and email for FLEX'S to contact you"
        onClick={() => {}}
      />

      <div className="px-4 py-4 space-y-3 bg-background">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">
            Display name
          </label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="rounded-xl"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">
            Email
          </label>
          <Input value={email} disabled className="rounded-xl opacity-60" />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full text-sm font-semibold text-primary py-2 hover:underline"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      <Separator />

      <SettingsRow
        title="Your profile"
        description="Set up your business profile to contact more customers"
        onClick={() => navigate("/app/settings/profile")}
        chevron
      />

      <Separator />

      <SettingsRow
        title="Custom statuses"
        description="Manage your lead statuses and pipeline"
        onClick={() => navigate("/app/settings/statuses")}
        chevron
      />

      <Separator />

      {/* Wallet */}
      <div className="px-4 py-4">
        <WalletCard />
      </div>

      {/* ── My notifications ── */}
      <SectionHeader label="My notifications" />

      <div className="bg-background px-4 py-4 space-y-0">
        <p className="text-sm font-semibold text-foreground mb-1">
          Notifications
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Decide how you want to communicate across FLEX'S and how you want us
          to contact you
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">New leads</span>
            <Switch
              checked={notifications.newLeads}
              onCheckedChange={(v) =>
                setNotifications((p) => ({ ...p, newLeads: v }))
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Messages</span>
            <Switch
              checked={notifications.messages}
              onCheckedChange={(v) =>
                setNotifications((p) => ({ ...p, messages: v }))
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Reminders</span>
            <Switch
              checked={notifications.reminders}
              onCheckedChange={(v) =>
                setNotifications((p) => ({ ...p, reminders: v }))
              }
            />
          </div>
        </div>
      </div>

      {/* ── Support ── */}
      <SectionHeader label="Support" />

      <SettingsRow
        title="Support"
        description="Contact us if you need anything"
        onClick={() => {}}
      />

      <Separator />

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button className="w-full text-left px-4 py-4 hover:bg-muted/30 transition-colors bg-background">
            <p className="text-sm font-semibold text-destructive">
              Delete Account
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              This action will delete both your buyer and seller accounts.
            </p>
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent and cannot be undone. All your data,
              leads, credits, and profile information will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Logout ── */}
      <div className="py-6">
        <button
          onClick={handleLogout}
          className="w-full text-center text-base font-semibold text-foreground py-3 hover:bg-muted/30 transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Version */}
      <p className="text-center text-sm text-muted-foreground pb-4">
        v1.0.0
      </p>
    </div>
  );
}

/* ── Section header (grey background strip) ── */

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="bg-muted px-4 py-3">
      <h2 className="text-base font-medium text-muted-foreground">{label}</h2>
    </div>
  );
}

/* ── Reusable settings row ── */

function SettingsRow({
  title,
  description,
  onClick,
  chevron,
}: {
  title: string;
  description: string;
  onClick: () => void;
  chevron?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-4 flex items-center hover:bg-muted/30 transition-colors bg-background"
    >
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
      {chevron && <ChevronRight className="h-5 w-5 text-muted-foreground ml-2 shrink-0" />}
    </button>
  );
}
