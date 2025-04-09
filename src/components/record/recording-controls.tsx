import { Play, Pause, RefreshCw, StopCircle, Mic, FileVideo } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VideoRecorderState, VideoRecorderControls } from "@/hooks/useVideoRecorder";

interface RecordingControlsProps {
  state: VideoRecorderState;
  controls: VideoRecorderControls;
  handleProcess?: () => Promise<void>;
}

export function RecordingControls({ state, controls, handleProcess }: RecordingControlsProps) {
  const {
    recording,
    paused,
    videoBlob,
    permission,
    isProcessing
  } = state;

  const {
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    playRecording
  } = controls;

  return (
    <div className="flex flex-wrap gap-4 justify-center">
      {!recording && !videoBlob && (
        <Button 
          onClick={startRecording} 
          disabled={!permission || isProcessing}
          size="lg"
          className="gap-2"
        >
          <Mic className="h-5 w-5" /> Start Recording
        </Button>
      )}
      
      {recording && !paused && (
        <>
          <Button onClick={pauseRecording} variant="outline" size="lg" className="gap-2">
            <Pause className="h-5 w-5" /> Pause
          </Button>
          <Button onClick={stopRecording} variant="destructive" size="lg" className="gap-2">
            <StopCircle className="h-5 w-5" /> Stop
          </Button>
        </>
      )}
      
      {recording && paused && (
        <>
          <Button onClick={resumeRecording} variant="outline" size="lg" className="gap-2">
            <Play className="h-5 w-5" /> Resume
          </Button>
          <Button onClick={stopRecording} variant="destructive" size="lg" className="gap-2">
            <StopCircle className="h-5 w-5" /> Stop
          </Button>
        </>
      )}
      
      {videoBlob && !recording && (
        <>
          <Button onClick={resetRecording} variant="outline" size="lg" className="gap-2">
            <RefreshCw className="h-5 w-5" /> Record Again
          </Button>
          <Button 
            onClick={handleProcess} 
            disabled={isProcessing}
            size="lg"
            className="gap-2"
          >
            {isProcessing ? (
              <>
                <div className="h-5 w-5 border-2 border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <FileVideo className="h-5 w-5 mr-2" />
                Transcribe Recording
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
} 