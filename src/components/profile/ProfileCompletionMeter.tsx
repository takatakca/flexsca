import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";

interface Props {
  completion: number;
}

export default function ProfileCompletionMeter({ completion }: Props) {
  const getColor = () => {
    if (completion >= 80) return "text-green-600";
    return "text-warning";
  };

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">
        Your profile is{" "}
        <span className={getColor()}>{completion}% complete</span>
      </h2>

      {/* Progress bar with checkmark indicator */}
      <div className="relative">
        <Progress value={completion} className="h-2.5 bg-muted" />
        <div
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-300"
          style={{ left: `calc(${Math.max(completion, 4)}% - 14px)` }}
        >
          <div className="flex items-center justify-center h-7 w-7 rounded-full bg-warning text-warning-foreground shadow-md">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
      </div>

      {completion < 80 && (
        <>
          <p className="text-sm font-medium text-warning">
            Take two minutes to improve your profile
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Make the best first impression with a great profile — this is what
            customers will look at first when choosing which professional to hire.
          </p>
        </>
      )}

      {completion >= 80 && (
        <p className="text-sm text-muted-foreground">
          Looking great! Your profile is almost complete. 🔥
        </p>
      )}
    </div>
  );
}
