import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, LogOut, User, Bell, Tag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import WalletCard from "@/components/WalletCard";

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
    <div className="p-4 space-y-4 pb-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-primary mb-2"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Profile */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl"
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Wallet */}
      <WalletCard />

      {/* Notifications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Tag className="h-4 w-4" /> Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="w-full rounded-xl"
          >
            <LogOut className="h-4 w-4 mr-2" /> Log out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
