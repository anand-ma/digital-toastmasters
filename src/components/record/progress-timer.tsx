import { Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProgressTimerProps {
  elapsedTime: number;
  maxDuration: number;
  isVisible: boolean;
}

export function ProgressTimer({ elapsedTime, maxDuration, isVisible }: ProgressTimerProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <div className="w-full mb-6">
      <div className="flex justify-between mb-2">
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
          <span className="timer-display">
            {formatTime(elapsedTime)} / {formatTime(maxDuration)}
          </span>
        </div>
        <span className="text-muted-foreground">
          {Math.round((elapsedTime / maxDuration) * 100)}%
        </span>
      </div>
      <Progress value={(elapsedTime / maxDuration) * 100} className="h-2" />
    </div>
  );
} 