import { Progress } from "@/components/ui/progress";

interface Props {
  completion: number;
}

export default function ProfileCompletionMeter({ completion }: Props) {
  const getColor = () => {
    if (completion >= 80) return "text-green-600";
    if (completion >= 50) return "text-yellow-600";
    return "text-destructive";
  };

  const getLabel = () => {
    if (completion >= 90) return "Looking great! 🔥";
    if (completion >= 70) return "Almost there! 💪";
    if (completion >= 40) return "Good start 👍";
    return "Let's get started ✨";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          Profile strength
        </span>
        <span className={`text-sm font-bold ${getColor()}`}>{completion}%</span>
      </div>
      <Progress value={completion} className="h-3" />
      <p className="text-xs text-muted-foreground">{getLabel()}</p>
    </div>
  );
}
