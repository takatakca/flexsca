import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, Loader2, Paperclip, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const BUCKET = "request-attachments";
const LIMIT = 8 * 1024 * 1024;
const MAX_FILES = 10;
const EXTENSIONS: Record<string,string> = {
  "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png",
};

interface Props {
  leadId: string;
  canUpload?: boolean;
}

// All reads and writes are checked by Postgres RLS. Never use a public URL.
export default function RequestAttachments({ leadId, canUpload = false }: Props) {
  const { user } = useAuth();
  const input = useRef<HTMLInputElement>(null);
  const [working, setWorking] = useState(false);
  const queryClient = useQueryClient();
  const queryKey = ["request-attachments", leadId, user?.id];
  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey,
    enabled: Boolean(user && leadId),
    queryFn: async () => {
      const result = await supabase.from("request_attachments")
        .select("id,lead_id,path,original_name,mime_type,size_bytes,created_at,uploaded_by")
        .eq("lead_id", leadId).order("created_at", { ascending: false }).limit(MAX_FILES + 1);
      if (result.error) throw new Error("Unable to load private documents.");
      return result.data || [];
    },
  });

  const upload = async (file: File) => {
    if (!user || !canUpload || working) return;
    const extension = EXTENSIONS[file.type];
    if (!extension || file.size < 1 || file.size > LIMIT) {
      toast.error("Choose a PDF, JPEG or PNG file, up to 8 MB.");
      return;
    }
    if (data.length >= MAX_FILES) {
      toast.error("This request already has 10 attachments.");
      return;
    }
    setWorking(true);
    const path = `${leadId}/${crypto.randomUUID()}.${extension}`;
    let stored = false;
    try {
      const uploaded = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type, upsert: false, cacheControl: "no-store",
      });
      if (uploaded.error) throw uploaded.error;
      stored = true;
      const registered = await supabase.from("request_attachments").insert({
        lead_id: leadId,
        uploaded_by: user.id,
        path,
        original_name: file.name.slice(0, 140) || "Attachment",
        mime_type: file.type,
        size_bytes: file.size,
      });
      if (registered.error) throw registered.error;
      toast.success("Private attachment added.");
      await queryClient.invalidateQueries({ queryKey });
    } catch {
      if (stored) await supabase.storage.from(BUCKET).remove([path]);
      toast.error("Unable to add the document. Please try again.");
    } finally {
      setWorking(false);
      if (input.current) input.current.value = "";
    }
  };

  const download = async (path: string, name: string) => {
    setWorking(true);
    try {
      const result = await supabase.storage.from(BUCKET).download(path);
      if (result.error || !result.data) throw result.error ?? new Error("Missing file");
      const url = URL.createObjectURL(result.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch {
      toast.error("This file is unavailable or you do not have access.");
    } finally {
      setWorking(false);
    }
  };

  const remove = async (path: string, id: string) => {
    if (!canUpload || working) return;
    setWorking(true);
    try {
      // Never delete the metadata until object removal succeeds.
      const file = await supabase.storage.from(BUCKET).remove([path]);
      if (file.error) throw file.error;
      const metadata = await supabase.from("request_attachments").delete().eq("id", id).eq("lead_id", leadId);
      if (metadata.error) throw metadata.error;
      toast.success("Attachment removed.");
      await queryClient.invalidateQueries({ queryKey });
    } catch {
      toast.error("Unable to remove the attachment. Please retry.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <section className="border rounded-xl bg-card p-4 md:p-5 space-y-3" aria-label="Private request attachments">
      <div className="flex gap-2 items-center">
        <Paperclip className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">Private request attachments</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Files stay private to the customer and professionals who unlocked this request. PDFs and images only, 8 MB each.
      </p>
      {canUpload && <div className="space-y-2">
        <label htmlFor={`file-${leadId}`} className="block text-sm font-medium">Add a private document</label>
        <input ref={input} id={`file-${leadId}`} type="file"
          accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
          disabled={working || data.length >= MAX_FILES}
          className="block w-full text-sm max-w-full file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-primary"
          onChange={event => { const file = event.target.files?.[0]; if (file) void upload(file); }} />
        <p className="text-xs text-muted-foreground">Up to {MAX_FILES} files. Never upload passwords or payment-card details.</p>
      </div>}
      {isLoading && <p role="status" className="text-sm"><Loader2 className="inline h-4 w-4 mr-2 animate-spin" />Loading attachments…</p>}
      {error && <div role="alert" className="text-sm space-x-3">
        <span>Unable to load private attachments.</span>
        <Button size="sm" variant="outline" onClick={() => void refetch()}>Retry</Button>
      </div>}
      {!isLoading && !error && data.length === 0 && <p className="text-sm text-muted-foreground">No attachments yet.</p>}
      {!error && data.map(item => <div key={item.id} className="flex gap-2 items-center justify-between border rounded-lg p-2 min-w-0">
        <div className="flex gap-2 items-center min-w-0">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm" title={item.original_name}>{item.original_name}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="outline" size="sm" disabled={working}
            onClick={() => void download(item.path, item.original_name)}
            aria-label={`Download ${item.original_name}`}><Download className="h-4 w-4" /></Button>
          {canUpload && <Button variant="ghost" size="sm" disabled={working}
            onClick={() => void remove(item.path, item.id)}
            aria-label={`Remove ${item.original_name}`}><Trash2 className="h-4 w-4" /></Button>}
        </div>
      </div>)}
    </section>
  );
}
