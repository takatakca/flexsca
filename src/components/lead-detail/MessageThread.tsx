import { format } from "date-fns";

interface Message {
  id: string;
  sender_type: string;
  message: string;
  created_at: string;
}

interface MessageThreadProps {
  messages: Message[];
}

export default function MessageThread({ messages }: MessageThreadProps) {
  if (messages.length === 0) {
    return (
      <p className="text-center text-muted-foreground text-sm py-8">
        No messages yet. Send a response to get started!
      </p>
    );
  }

  return (
    <>
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.sender_type === "pro" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
              msg.sender_type === "pro"
                ? "bg-primary text-primary-foreground rounded-br-md"
                : msg.sender_type === "system"
                ? "bg-muted text-muted-foreground rounded-bl-md italic"
                : "bg-muted text-foreground rounded-bl-md"
            }`}
          >
            <p className="text-sm">{msg.message}</p>
            <p
              className={`text-xs mt-1 ${
                msg.sender_type === "pro"
                  ? "text-primary-foreground/70"
                  : "text-muted-foreground"
              }`}
            >
              {format(new Date(msg.created_at), "HH:mm")}
            </p>
          </div>
        </div>
      ))}
    </>
  );
}
