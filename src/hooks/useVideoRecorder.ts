import { useState, useRef, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

export interface VideoRecorderState {
  permission: boolean;
  recording: boolean;
  paused: boolean;
  elapsedTime: number;
  videoBlob: Blob | null;
  isProcessing: boolean;
  previewUrl: string | null;
  storedRecording: string | null;
}

export interface VideoRecorderControls {
  startRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  resetRecording: () => Promise<void>;
  playRecording: () => Promise<void>;
}

const MAX_DURATION = 45; // 45 seconds

export const useVideoRecorder = (videoRef: React.RefObject<HTMLVideoElement>) => {
  const { toast } = useToast();
  const [state, setState] = useState<VideoRecorderState>({
    permission: false,
    recording: false,
    paused: false,
    elapsedTime: 0,
    videoBlob: null,
    isProcessing: false,
    previewUrl: null,
    storedRecording: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const progressIntervalRef = useRef<number | null>(null);

  // Request camera and microphone permissions
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          videoRef.current.play().catch(error => {
            console.error("Error playing video:", error);
          });
        }
        
        setState(prev => ({ ...prev, permission: true }));
      } catch (err) {
        console.error("Error accessing media devices:", err);
        setState(prev => ({ ...prev, permission: false }));
        toast({
          title: "Permission Denied",
          description: "Please allow camera and microphone access to record your speech.",
          variant: "destructive",
        });
      }
    };
    
    requestPermissions();
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      
      if (progressIntervalRef.current) {
        cancelAnimationFrame(progressIntervalRef.current);
      }
    };
  }, [toast, videoRef]);

  const startRecording = () => {
    if (!state.permission) {
      toast({
        title: "Permission Required",
        description: "Camera and microphone permissions are required to record.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      chunksRef.current = [];
      setState(prev => ({
        ...prev,
        elapsedTime: 0,
        videoBlob: null,
        previewUrl: null,
        storedRecording: null,
      }));
      
      const stream = videoRef.current?.srcObject as MediaStream;
      if (!stream) {
        throw new Error("No media stream available");
      }

      const mimeTypes = [
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=h264,opus',
        'video/webm',
        'video/mp4'
      ];

      const selectedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
      if (!selectedMimeType) {
        throw new Error("No supported MIME type found for recording");
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 128000
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(1000);
      setState(prev => ({ ...prev, recording: true, paused: false }));

      const startTime = Date.now();
      const stopTime = startTime + (MAX_DURATION * 1000);
      
      const updateProgress = () => {
        const currentTime = Date.now();
        const elapsed = Math.floor((currentTime - startTime) / 1000);
        
        if (currentTime >= stopTime) {
          stopRecording();
          return;
        }
        
        setState(prev => ({ ...prev, elapsedTime: elapsed }));
        progressIntervalRef.current = requestAnimationFrame(updateProgress);
      };
      
      progressIntervalRef.current = requestAnimationFrame(updateProgress);

      if (videoRef.current) {
        videoRef.current.muted = false;
      }

      toast({
        title: "Recording Started",
        description: "Your recording has begun.",
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Recording Error",
        description: "Failed to start recording. Please try again.",
        variant: "destructive",
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && state.recording && !state.paused) {
      mediaRecorderRef.current.pause();
      if (progressIntervalRef.current) {
        cancelAnimationFrame(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setState(prev => ({ ...prev, paused: true }));
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && state.recording && state.paused) {
      mediaRecorderRef.current.resume();
      const currentTime = Date.now();
      const elapsed = state.elapsedTime;
      const remainingTime = MAX_DURATION - elapsed;
      const stopTime = currentTime + (remainingTime * 1000);
      
      const updateProgress = () => {
        const now = Date.now();
        const newElapsed = elapsed + Math.floor((now - currentTime) / 1000);
        
        if (now >= stopTime) {
          stopRecording();
          return;
        }
        
        setState(prev => ({ ...prev, elapsedTime: newElapsed }));
        progressIntervalRef.current = requestAnimationFrame(updateProgress);
      };
      
      progressIntervalRef.current = requestAnimationFrame(updateProgress);
      setState(prev => ({ ...prev, paused: false }));
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || !state.recording) {
      return;
    }

    try {
      if (progressIntervalRef.current) {
        cancelAnimationFrame(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      mediaRecorderRef.current.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          setState(prev => ({ ...prev, videoBlob: blob }));

          const reader = new FileReader();
          reader.onloadend = () => {
            try {
              const base64data = reader.result as string;
              const base64String = base64data.split(',')[1];
              localStorage.setItem('recording', base64String);
              setState(prev => ({ ...prev, storedRecording: base64String }));
              
              if (videoRef.current) {
                videoRef.current.controls = true;
              }
              
              toast({
                title: "Recording Complete",
                description: "Your recording has been saved successfully.",
              });
            } catch (error) {
              console.error("Error saving to localStorage:", error);
              toast({
                title: "Save Error",
                description: "Failed to save the recording.",
                variant: "destructive",
              });
            }
          };
          reader.readAsDataURL(blob);
        }
      };

      mediaRecorderRef.current.requestData();
      mediaRecorderRef.current.stop();
      setState(prev => ({ ...prev, recording: false, paused: false }));

      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }

    } catch (error) {
      console.error("Error stopping recording:", error);
      toast({
        title: "Recording Error",
        description: "Failed to stop recording properly.",
        variant: "destructive",
      });
    }
  };

  const resetRecording = async () => {
    try {
      if (videoRef.current) {
        videoRef.current.pause();
        
        if (videoRef.current.src) {
          URL.revokeObjectURL(videoRef.current.src);
          videoRef.current.src = '';
        }
        
        if (videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
        }
      }

      if (state.previewUrl) {
        URL.revokeObjectURL(state.previewUrl);
      }

      setState(prev => ({
        ...prev,
        videoBlob: null,
        storedRecording: null,
        elapsedTime: 0,
        paused: false,
        recording: false,
        previewUrl: null
      }));

      localStorage.removeItem('recording');

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          videoRef.current.play().catch(error => {
            console.error("Error playing video:", error);
          });
        }

        startRecording();

        toast({
          title: "Recording Reset",
          description: "Starting a new recording...",
        });
      } catch (error) {
        console.error("Error getting media stream:", error);
        toast({
          title: "Camera Error",
          description: "Failed to access camera. Please check permissions.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error resetting recording:", error);
      toast({
        title: "Reset Error",
        description: "Failed to reset the recording state.",
        variant: "destructive",
      });
    }
  };

  const playRecording = async () => {
    try {
      const savedRecording = localStorage.getItem('recording');
      
      if (!savedRecording) {
        toast({
          title: "No Recording Found",
          description: "There is no saved recording to play.",
          variant: "destructive",
        });
        return;
      }

      if (!videoRef.current) {
        console.error("Video element not found");
        return;
      }

      if (videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }

      try {
        const byteString = atob(savedRecording);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        
        for (let i = 0; i < byteString.length; i++) {
          uint8Array[i] = byteString.charCodeAt(i);
        }
        
        const blob = new Blob([arrayBuffer], { type: 'video/webm' });
        const url = URL.createObjectURL(blob);

        videoRef.current.src = url;
        videoRef.current.muted = false;
        videoRef.current.controls = true;
        videoRef.current.style.objectFit = "contain";

        videoRef.current.load();
        
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              toast({
                title: "Playing Recording",
                description: "Your recording is now playing. Use the video controls to pause, play, or adjust volume.",
              });
            })
            .catch(error => {
              console.error("Error playing video:", error);
              toast({
                title: "Click to Play",
                description: "Please click the play button in the video player.",
              });
            });
        }

      } catch (error) {
        console.error("Error processing video data:", error);
        toast({
          title: "Playback Error",
          description: "Failed to process the recording.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in playRecording:", error);
      toast({
        title: "Playback Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  return {
    state,
    controls: {
      startRecording,
      pauseRecording,
      resumeRecording,
      stopRecording,
      resetRecording,
      playRecording,
    },
    MAX_DURATION,
  };
}; 