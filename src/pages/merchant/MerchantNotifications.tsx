import { Bell } from "lucide-react";

export default function MerchantNotifications() {
  return (
    <div className="px-4 py-6 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Bell className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">No notifications</h2>
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        You'll be notified about profile views, reviews, and customer activity here.
      </p>
    </div>
  );
}
