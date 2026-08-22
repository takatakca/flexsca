import { MessageSquare } from "lucide-react";

export default function MerchantMessages() {
  return (
    <div className="px-4 py-6 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <MessageSquare className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">No messages yet</h2>
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        When customers contact you through your FLEX'S listing, their messages will appear here.
      </p>
    </div>
  );
}
