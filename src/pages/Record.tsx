import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Pause, RefreshCw, StopCircle, Clock, MicOff, Mic, FileVideo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { processRecording } from "@/services/api";
import { ElevenLabsClient } from 'elevenlabs';

// Initialize the ElevenLabs client outside the component
const client = new ElevenLabsClient({
  apiKey: "sk_5107b1d8a09b89f5713d704698dc754fd7cbd02cb76763af",
});

export default function Record() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [permission, setPermission] = useState<boolean>(false);
  const [recording, setRecording] = useState<boolean>(false);
  const [paused, setPaused] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [storedRecording, setStoredRecording] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const progressIntervalRef = useRef<number | null>(null);

  const MAX_DURATION = 45; // 45 seconds

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
          videoRef.current.muted = true; // Keep muted until recording starts
          videoRef.current.play().catch(error => {
            console.error("Error playing video:", error);
          });
        }
        
        setPermission(true);
      } catch (err) {
        console.error("Error accessing media devices:", err);
        setPermission(false);
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
  }, [toast]);

  // Load recording from localStorage on component mount
  useEffect(() => {
    const savedRecording = localStorage.getItem('recording');
    if (savedRecording) {
      setStoredRecording(savedRecording);
      // Convert base64 to blob
      const byteCharacters = atob(savedRecording);
      const byteArrays = [];
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArrays.push(byteCharacters.charCodeAt(i));
      }
      const blob = new Blob([new Uint8Array(byteArrays)], { type: 'video/webm' });
      setVideoBlob(blob);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    }
  }, []);

  const startRecording = () => {
    if (!permission) {
      toast({
        title: "Permission Required",
        description: "Camera and microphone permissions are required to record.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Reset variables
      chunksRef.current = [];
      setElapsedTime(0);
      setVideoBlob(null);
      setPreviewUrl(null);
      setStoredRecording(null);
      
      // Get media stream
      const stream = videoRef.current?.srcObject as MediaStream;
      if (!stream) {
        throw new Error("No media stream available");
      }

      // Check supported MIME types
      const mimeTypes = [
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=h264,opus',
        'video/webm',
        'video/mp4'
      ];

      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      if (!selectedMimeType) {
        throw new Error("No supported MIME type found for recording");
      }
      
      // Create MediaRecorder with supported MIME type
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 128000
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      // Handle data available event
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      // Start recording
      mediaRecorder.start(1000); // Request data every second
      setRecording(true);
      setPaused(false);

      // Start progress tracking
      const startTime = Date.now();
      const stopTime = startTime + (MAX_DURATION * 1000);
      
      const updateProgress = () => {
        const currentTime = Date.now();
        const elapsed = Math.floor((currentTime - startTime) / 1000);
        
        if (currentTime >= stopTime) {
          // Stop the recording
          if (mediaRecorderRef.current && recording) {
            mediaRecorderRef.current.stop();
            setRecording(false);
            setPaused(false);
            
            // Create final blob
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            setVideoBlob(blob);
            
            // Save to localStorage
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64data = reader.result as string;
              const base64String = base64data.split(',')[1];
              localStorage.setItem('recording', base64String);
              setStoredRecording(base64String);
              
              // Enable video controls
              if (videoRef.current) {
                videoRef.current.controls = true;
              }
              
              // Show success message
              toast({
                title: "Time Limit Reached",
                description: "Recording stopped at 45 seconds. You can now play your recording.",
              });
            };
            reader.readAsDataURL(blob);
            
            // Stop media stream
            if (videoRef.current && videoRef.current.srcObject) {
              const stream = videoRef.current.srcObject as MediaStream;
              stream.getTracks().forEach(track => track.stop());
            }
          }
          return;
        }
        
        setElapsedTime(elapsed);
        if (!paused) {
          progressIntervalRef.current = requestAnimationFrame(updateProgress);
        }
      };
      
      progressIntervalRef.current = requestAnimationFrame(updateProgress);

      // Unmute video when recording starts
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
    if (mediaRecorderRef.current && recording && !paused) {
      mediaRecorderRef.current.pause();
      if (progressIntervalRef.current) {
        cancelAnimationFrame(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recording && paused) {
      mediaRecorderRef.current.resume();
      const currentTime = Date.now();
      const elapsed = elapsedTime;
      const remainingTime = MAX_DURATION - elapsed;
      const stopTime = currentTime + (remainingTime * 1000);
      
      const updateProgress = () => {
        const now = Date.now();
        const newElapsed = elapsed + Math.floor((now - currentTime) / 1000);
        
        if (now >= stopTime) {
          stopRecording();
          return;
        }
        
        setElapsedTime(newElapsed);
        if (!paused) {
          progressIntervalRef.current = requestAnimationFrame(updateProgress);
        }
      };
      
      progressIntervalRef.current = requestAnimationFrame(updateProgress);
      setPaused(false);
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || !recording) {
      return;
    }

    try {
      if (progressIntervalRef.current) {
        cancelAnimationFrame(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      // Set up the data handler before stopping
      mediaRecorderRef.current.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          
          // Create blob from all chunks
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          setVideoBlob(blob);

          // Convert to base64 and save
          const reader = new FileReader();
          reader.onloadend = () => {
            try {
              const base64data = reader.result as string;
              const base64String = base64data.split(',')[1];
              localStorage.setItem('recording', base64String);
              setStoredRecording(base64String);
              
              // Enable video controls
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

      // Stop the recording
      mediaRecorderRef.current.requestData();
      mediaRecorderRef.current.stop();
      setRecording(false);
      setPaused(false);

      // Stop the media stream tracks
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

  // Helper function to convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read blob'));
      reader.readAsDataURL(blob);
    });
  };

  const resetRecording = async () => {
    try {
      // Clear video element
      if (videoRef.current) {
        // Stop any current playback
        videoRef.current.pause();
        
        // Clear video source
        if (videoRef.current.src) {
          URL.revokeObjectURL(videoRef.current.src);
          videoRef.current.src = '';
        }
        
        // Stop and clear existing stream
        if (videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
        }
      }

      // Clear preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

      // Reset all states
      setVideoBlob(null);
      setStoredRecording(null);
      setElapsedTime(0);
      setPaused(false);
      setRecording(false);

      // Clear localStorage
      localStorage.removeItem('recording');

      // Get new media stream
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

        // Start new recording
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

  const handleProcess = async () => {
    if (!videoBlob) {
      toast({
        title: "No recording available",
        description: "Please record your speech before processing.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev + 5;
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return newProgress;
      });
    }, 200);
    
    try {
      // Create a File object from the blob
      const videoFile = new File([videoBlob], "recording.webm", { type: "video/webm" });
      
      // Process the recording
      const recording = await processRecording(videoFile);

      // Convert to audio file for ElevenLabs
      try {
        const transcription = await client.speechToText.convert({
          file: videoFile,
          model_id: "scribe_v1",
        });

        console.log("Transcription result:", transcription.text);

        // Create persistent blob URLs
        const videoBlobUrl = URL.createObjectURL(videoBlob);
        
        // Store recording data with transcription
        const recordingData = {
          id: recording.id,
          fileName: "recording.webm",
          fileType: "video/webm",
          fileSize: videoFile.size,
          transcription: transcription.text,
          isRecorded: true,
          // Add video preview URLs
          blobUrl: videoBlobUrl,
          previewUrl: videoBlobUrl,
          // Store the video blob itself
          videoBlob: videoBlob
        };

        // Store in localStorage (without the blob to avoid size issues)
        const storageData = {
          ...recordingData,
          videoBlob: null // Don't store the blob in localStorage
        };
        localStorage.setItem('recordingData', JSON.stringify(storageData));
        
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        toast({
          title: "Recording processed",
          description: "Your speech has been transcribed successfully!",
        });
        
        // Navigate with complete data including the blob
        navigate(`/analysis/${recording.id}`, {
          state: recordingData
        });
      } catch (transcriptionError) {
        console.error("Transcription error:", transcriptionError);
        throw new Error("Failed to transcribe the recording");
      }
    } catch (error) {
      console.error("Error processing recording:", error);
      clearInterval(progressInterval);
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to process your recording. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const playRecording = async () => {
    console.log("Play recording button clicked");
    
    try {
      // Get recording from localStorage
      const savedRecording = localStorage.getItem('recording');
      console.log("Saved recording exists:", !!savedRecording);
      
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

      // Reset video element
      if (videoRef.current.srcObject) {
        // If we have a camera stream, stop it
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }

      try {
        // Convert base64 to blob
        const byteString = atob(savedRecording);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        
        for (let i = 0; i < byteString.length; i++) {
          uint8Array[i] = byteString.charCodeAt(i);
        }
        
        const blob = new Blob([arrayBuffer], { type: 'video/webm' });
        console.log("Created blob:", blob.size, "bytes");

        // Create object URL
        const url = URL.createObjectURL(blob);
        console.log("Created URL:", url);

        // Configure video element
        videoRef.current.src = url;
        videoRef.current.muted = false;
        videoRef.current.controls = true;
        videoRef.current.style.objectFit = "contain"; // Show full video without cropping

        // Play the video
        console.log("Attempting to play video");
        videoRef.current.load();
        
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("Video playing successfully");
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

  // Add cleanup for video source in the cleanup effect
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.src) {
        URL.revokeObjectURL(videoRef.current.src);
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
          {/* Video Preview */}
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-4">
            {!permission && (
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
              controls={!recording}
              muted={recording}
              style={{ objectFit: recording ? "cover" : "contain" }}
              onLoadedData={() => console.log("Video loaded")}
              onPlay={() => console.log("Video play event")}
              onError={(e) => {
                console.error("Video error:", e);
                toast({
                  title: "Video Error",
                  description: "There was an error with the video playback.",
                  variant: "destructive",
                });
              }}
            />
          </div>

          {/* Play Recording Button - Moved below video */}
          {!recording && localStorage.getItem('recording') && (
            <div className="w-full flex justify-center mb-4">
              <Button
                variant="outline"
                className="bg-primary/80 hover:bg-primary text-white hover:text-white"
                onClick={() => {
                  console.log("Play button clicked");
                  playRecording();
                }}
              >
                <Play className="h-6 w-6 mr-2" /> Play Recording
              </Button>
            </div>
          )}

          {/* Timer and Progress */}
          {(recording || paused) && (
            <div className="w-full mb-6">
              <div className="flex justify-between mb-2">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span className="timer-display">{formatTime(elapsedTime)} / {formatTime(MAX_DURATION)}</span>
                </div>
                <span className="text-muted-foreground">
                  {Math.round((elapsedTime / MAX_DURATION) * 100)}%
                </span>
              </div>
              <Progress value={(elapsedTime / MAX_DURATION) * 100} className="h-2" />
            </div>
          )}
          
          {/* Recording Controls */}
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