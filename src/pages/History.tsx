
import { CalendarClock } from "lucide-react";

export default function History() {
  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-lg">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-primary/10">
            <CalendarClock className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-primary">History Coming Soon</h1>
        <p className="text-muted-foreground mb-6">
          We're working on a comprehensive history page that will allow you to track your speech
          improvement progress over time. This feature will be available in the next update.
        </p>
        <div className="inline-flex h-2 bg-muted rounded-full overflow-hidden w-48">
          <div className="bg-primary h-full w-2/3 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
