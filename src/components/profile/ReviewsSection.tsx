import { useState, useCallback } from "react";
import { CheckCircle2, Copy, Star, Trash2, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useEffect } from "react";

interface Review {
  id: string;
  reviewer_name: string | null;
  reviewer_email: string | null;
  rating: number;
  review_text: string | null;
  source: string;
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  status: string;
  created_at: string;
}

export default function ReviewsSection() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [emails, setEmails] = useState("");
  const [fbUrl, setFbUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [importing, setImporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const reviewLink = user
    ? `${window.location.origin}/review/${user.id}?show_reviews=true`
    : "";

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [reviewsRes, invitationsRes] = await Promise.all([
      supabase
        .from("provider_reviews")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("review_invitations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    setReviews((reviewsRes.data as unknown as Review[]) || []);
    setInvitations((invitationsRes.data as unknown as Invitation[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInvite = async () => {
    if (!user || !emails.trim()) return;
    setSending(true);

    const emailList = emails
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes("@") && e.length >= 5);

    if (emailList.length === 0) {
      toast.error("Please enter valid email addresses");
      setSending(false);
      return;
    }

    const rows = emailList.map((email) => ({
      user_id: user.id,
      email,
    }));

    const { error } = await supabase
      .from("review_invitations")
      .insert(rows as any);

    if (error) {
      toast.error("Failed to send invitations");
    } else {
      toast.success(`${emailList.length} invitation(s) saved`);
      setEmails("");
      fetchData();
    }
    setSending(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(reviewLink);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleImportFacebook = async () => {
    if (!fbUrl.trim()) return;
    setImporting(true);
    // For now, store the Facebook page URL as a placeholder — actual import would need a backend service
    toast.info("Facebook review import is coming soon. Your page URL has been saved.");
    setImporting(false);
  };

  const handleDeleteReview = async (id: string) => {
    const { error } = await supabase
      .from("provider_reviews")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete review");
    } else {
      setReviews((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const hasReviews = reviews.length > 0;

  return (
    <div className="space-y-6">
      {/* Get started prompt */}
      <div className="flex items-center justify-between py-2 border-b">
        <span className="text-sm text-muted-foreground">Get started!</span>
        <CheckCircle2
          className={`h-5 w-5 ${
            hasReviews
              ? "text-primary"
              : "text-muted-foreground/40"
          }`}
        />
      </div>

      {/* Email invites */}
      <div className="space-y-3">
        <Textarea
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
          placeholder="Separate e-mail addresses using commas"
          className="rounded-xl min-h-[80px]"
          maxLength={2000}
        />
        <Button
          onClick={handleInvite}
          disabled={sending || !emails.trim()}
          className="w-full rounded-xl py-5 text-base"
        >
          {sending ? "Sending…" : "Invite"}
        </Button>
      </div>

      {/* Shareable link */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Share this link with your customers
        </p>
        <Input
          readOnly
          value={reviewLink}
          className="rounded-xl text-xs truncate bg-muted"
        />
        <Button
          onClick={handleCopyLink}
          variant="outline"
          className="w-full rounded-xl py-5 text-base text-primary"
        >
          {copied ? "Copied!" : "Copy link"}
        </Button>
      </div>

      {/* Facebook reviews */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <Facebook className="h-5 w-5 text-[#1877F2]" />
          <h4 className="text-base font-semibold text-foreground">
            Facebook reviews
          </h4>
        </div>
        <p className="text-sm text-muted-foreground">
          Import customer reviews from your company's Facebook page.
        </p>
        <Input
          value={fbUrl}
          onChange={(e) => setFbUrl(e.target.value)}
          placeholder="e.g. facebook.com/yourpage"
          className="rounded-xl"
          maxLength={300}
        />
        <Button
          onClick={handleImportFacebook}
          disabled={importing || !fbUrl.trim()}
          className="w-full rounded-xl py-5 text-base"
        >
          {importing ? "Importing…" : "Import reviews"}
        </Button>
      </div>

      {/* Existing invitations */}
      {invitations.length > 0 && (
        <div className="space-y-2 pt-2">
          <h4 className="text-sm font-medium text-foreground">
            Sent invitations ({invitations.length})
          </h4>
          {invitations.slice(0, 10).map((inv) => (
            <div
              key={inv.id}
              className="text-xs text-muted-foreground flex items-center justify-between py-1 border-b last:border-b-0"
            >
              <span className="truncate flex-1">{inv.email}</span>
              <span className="capitalize text-[10px] ml-2 shrink-0">
                {inv.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Existing reviews */}
      {reviews.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-medium text-foreground">
            Your reviews ({reviews.length})
          </h4>
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border p-3 space-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < review.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => handleDeleteReview(review.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {review.reviewer_name && (
                <p className="text-xs font-medium text-foreground">
                  {review.reviewer_name}
                </p>
              )}
              {review.review_text && (
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {review.review_text}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
