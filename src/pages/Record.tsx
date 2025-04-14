import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { processRecording } from "@/services/api";
import { ElevenLabsClient } from 'elevenlabs';
import { useVideoRecorder } from "@/hooks/useVideoRecorder";
import { VideoPreview } from "@/components/record/video-preview";
import { RecordingControls } from "@/components/record/recording-controls";
import { ProgressTimer } from "@/components/record/progress-timer";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

// Initialize the ElevenLabs client
const client = new ElevenLabsClient({
  apiKey: "sk_5107b1d8a09b89f5713d704698dc754fd7cbd02cb76763af",
});

export default function Record() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { state, controls, MAX_DURATION } = useVideoRecorder(videoRef);

  const handleProcess = async () => {
    if (!state.videoBlob) {
      toast({
        title: "No recording available",
        description: "Please record your speech before processing.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const videoFile = new File([state.videoBlob], "recording.webm", { type: "video/webm" });
      const recording = await processRecording(videoFile);
      
      // Create a new blob from the file to ensure consistency
      const fileBlob = new Blob([videoFile], { type: videoFile.type });
      const blobUrl = URL.createObjectURL(fileBlob);

      const recordingData = {
        id: recording.id,
        fileName: videoFile.name,
        fileType: videoFile.type,
        fileSize: videoFile.size,
        blobUrl: blobUrl,
        previewUrl: blobUrl,
        isRecorded: true
      };

      // Store in localStorage without the blob
      const storageData = {
        ...recordingData
      };
      localStorage.setItem('recordingData', JSON.stringify(storageData));
      
      toast({
        title: "Recording processed",
        description: "Your recording has been saved. You can now generate the transcript.",
      });
      
      navigate(`/analysis/${recording.id}`, {
        state: recordingData
      });
    } catch (error) {
      console.error("Error processing recording:", error);
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to process your recording. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Record Your Speech</h1>
        <p className="text-muted-foreground">
          Record yourself for up to 45 seconds. Try to maintain eye contact with the camera.
        </p>
      </div>
      
      <Card className="mb-8">
        <CardContent className="p-6 flex flex-col items-center">
          <VideoPreview 
            videoRef={videoRef}
            hasPermission={state.permission}
            isRecording={state.recording}
          />

          {!state.recording && localStorage.getItem('recording') && (
            <div className="w-full flex justify-center mb-4">
              <Button
                variant="outline"
                className="bg-primary/80 hover:bg-primary text-white hover:text-white"
                onClick={controls.playRecording}
              >
                <Play className="h-6 w-6 mr-2" /> Play Recording
              </Button>
            </div>
          )}

          <ProgressTimer 
            elapsedTime={state.elapsedTime}
            maxDuration={MAX_DURATION}
            isVisible={state.recording || state.paused}
          />
          
          <RecordingControls 
            state={state}
            controls={controls}
            handleProcess={handleProcess}
          />
        </CardContent>
      </Card>
      
      <div className="bg-secondary/20 p-6 rounded-lg text-center">
        <h3 className="text-lg font-medium mb-2">Recording Tips</h3>
        <ul className="text-sm text-muted-foreground list-disc list-inside text-left max-w-xl mx-auto space-y-1">
          <li>Speak clearly and at a moderate pace</li>
          <li>Position your camera at eye level</li>
          <li>Ensure good lighting on your face</li>
          <li>Minimize background noise and distractions</li>
          <li>Practice good posture and maintain eye contact</li>
        </ul>
      </div>
    </div>
  );
}