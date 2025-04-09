import { MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  hasPermission: boolean;
  isRecording: boolean;
}

export function VideoPreview({ videoRef, hasPermission, isRecording }: VideoPreviewProps) {
  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-4">
      {!hasPermission && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/90">
          <MicOff className="h-16 w-16 mb-4" />
          <p className="text-center max-w-md">
            Camera and microphone access is required to record your speech.
          </p>
          <Button 
            variant="outline" 
            className="mt-4 bg-primary/80 hover:bg-primary text-white hover:text-white"
            onClick={() => window.location.reload()}
          >
            Grant Permissions
          </Button>
        </div>
      )}
      
      <video 
        ref={videoRef} 
        playsInline 
        className="w-full h-full"
        controls={!isRecording}
        muted={isRecording}
        style={{ objectFit: isRecording ? "cover" : "contain" }}
      />
    </div>
  );
} 