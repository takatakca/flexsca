import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  Trash2,
  Star,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
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
  const [loading, setLoading] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
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

    const fetchData = async () => {
      const [profileRes, reviewsRes] = await Promise.all([
        supabase.from("provider_profiles").select("profile_photo_url").eq("user_id", user.id).maybeSingle(),
        supabase.from("provider_reviews").select("rating").eq("user_id", user.id),
      ]);

      if (profileRes.data?.profile_photo_url) {
        setProfilePhoto(profileRes.data.profile_photo_url);
      }

      if (reviewsRes.data && reviewsRes.data.length > 0) {
        setReviewCount(reviewsRes.data.length);
        const sum = reviewsRes.data.reduce((acc, r) => acc + r.rating, 0);
        setAvgRating(sum / reviewsRes.data.length);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

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

      {/* Profile avatar + rating */}
      <div className="bg-muted flex flex-col items-center py-8">
        <div className="h-28 w-28 rounded-lg bg-muted-foreground/10 overflow-hidden flex items-center justify-center">
          {profilePhoto ? (
            <img src={profilePhoto} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <svg className="h-16 w-16 text-muted-foreground/40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v2h20v-2c0-3.3-6.7-5-10-5z" />
            </svg>
          )}
        </div>
        <div className="flex items-center gap-1 mt-3">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`h-5 w-5 ${s <= Math.round(avgRating) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`}
            />
          ))}
          <span className="text-sm text-muted-foreground ml-1">({reviewCount})</span>
        </div>
      </div>

      {/* ── Profile ── */}
      <SectionHeader label="Profile" />

      <SettingsRow
        title="My profile"
        description="Your profile is key to attracting customers. Update your profile to stand out"
        onClick={() => navigate("/app/settings/profile")}
      />
      <Separator className="mx-4" />

      <SettingsRow
        title="Reviews"
        description="All your reviews in one place"
        onClick={() => navigate("/app/settings/profile", { state: { section: "reviews" } })}
      />
      <Separator className="mx-4" />

      <SettingsRow
        title="Account details"
        description="Your email address and password you use to log in, and the phone numbers we use to contact you privately"
        onClick={() => navigate("/app/settings/account")}
      />

      {/* ── Lead settings ── */}
      <SectionHeader label="Lead settings" />

      <SettingsRow
        title="My services"
        description="Tell us what services you provide so we can send you the most relevant leads"
        onClick={() => navigate("/app/settings/profile", { state: { section: "services" } })}
      />
      <Separator className="mx-4" />

      <SettingsRow
        title="My locations"
        description="Tell us what locations you provide your services in"
        onClick={() => navigate("/app/settings/profile", { state: { section: "location" } })}
      />
      <Separator className="mx-4" />

      <SettingsRow
        title="Custom statuses"
        description="Manage your lead statuses and pipeline"
        onClick={() => navigate("/app/settings/statuses")}
      />

      {/* ── Account & Credits ── */}
      <SectionHeader label="Account & Credits" />

      <SettingsRow
        title="My credits"
        description="View credit history and buy credits to contact more customers"
        onClick={() => navigate("/app/settings/credits")}
      />

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

      <Separator className="mx-4" />

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
      <div className="bg-muted py-2" />
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
}: {
  title: string;
  description: string;
  onClick: () => void;
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
      <ChevronRight className="h-5 w-5 text-muted-foreground ml-2 shrink-0" />
    </button>
  );
}
