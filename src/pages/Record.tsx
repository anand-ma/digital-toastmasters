import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Pause, RefreshCw, StopCircle, Clock, MicOff, Mic, FileVideo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { processRecording } from "@/services/api";
import { ElevenLabsClient } from 'elevenlabs';
import { getElevenLabsApiKey, isElevenLabsConfigured, handleElevenLabsError } from "@/services/elevenlabs";

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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const [elevenLabsClient, setElevenLabsClient] = useState<ElevenLabsClient | null>(null);

  const MAX_DURATION = 45; // 45 seconds

  // Initialize ElevenLabsClient
  useEffect(() => {
    const initializeClient = async () => {
      try {
        const isConfigured = await isElevenLabsConfigured();
        
        if (!isConfigured) {
          toast({
            title: "Configuration Error",
            description: "ElevenLabs API key is missing or invalid. Please check your Supabase settings.",
            variant: "destructive",
          });
          return;
        }
        
        try {
          const apiKey = await getElevenLabsApiKey();
          
          if (!apiKey || apiKey === 'YOUR_ELEVENLABS_API_KEY_HERE') {
            toast({
              title: "API Key Error",
              description: "Your ElevenLabs API key appears to be invalid or is still set to the default value.",
              variant: "destructive",
            });
            return;
          }
          
          const client = new ElevenLabsClient({
            apiKey: apiKey,
          });
          
          setElevenLabsClient(client);
          console.log("ElevenLabs client initialized successfully");
        } catch (error) {
          console.error("Error initializing ElevenLabs client:", error);
          toast({
            title: "Error",
            description: `Failed to initialize speech-to-text service: ${error instanceof Error ? error.message : String(error)}`,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error checking ElevenLabs configuration:", error);
        toast({
          title: "Error",
          description: "Failed to check speech-to-text service configuration.",
          variant: "destructive",
        });
      }
    };
    
    initializeClient();
  }, [toast]);

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
    
    // Clean up function
    return () => {
      // Stop all media tracks
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      
      // Clear timer if active
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [toast]);

  const startTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    timerIntervalRef.current = window.setInterval(() => {
      setElapsedTime(prev => {
        if (prev >= MAX_DURATION) {
          stopRecording();
          return MAX_DURATION;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const startRecording = () => {
    if (!permission) {
      toast({
        title: "Permission Required",
        description: "Camera and microphone permissions are required to record.",
        variant: "destructive",
      });
      return;
    }
    
    // Reset variables
    chunksRef.current = [];
    setElapsedTime(0);
    
    // Get media stream
    const stream = videoRef.current?.srcObject as MediaStream;
    if (!stream) return;
    
    // Create MediaRecorder with specific options
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp8,opus',
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
    
    // Handle recording stopped
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setVideoBlob(blob);
      // Create and set preview URL
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      stopTimer();
      setRecording(false);
      setPaused(false);
    };
    
    // Start recording
    mediaRecorder.start();
    startTimer();
    setRecording(true);
    setPaused(false);
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recording && !paused) {
      mediaRecorderRef.current.pause();
      stopTimer();
      setPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recording && paused) {
      mediaRecorderRef.current.resume();
      startTimer();
      setPaused(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      stopTimer();
    }
  };

  const resetRecording = () => {
    if (videoRef.current && videoRef.current.src) {
      URL.revokeObjectURL(videoRef.current.src);
      videoRef.current.src = '';
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setVideoBlob(null);
    setElapsedTime(0);
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
    
    if (!elevenLabsClient) {
      toast({
        title: "Service not ready",
        description: "Speech-to-text service is not ready. Please try again later.",
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
        console.log("Starting transcription with ElevenLabs...");
        const transcription = await elevenLabsClient.speechToText.convert({
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
        const errorMessage = handleElevenLabsError(transcriptionError);
        throw new Error(errorMessage);
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

  const playRecording = () => {
    if (videoRef.current && videoBlob) {
      // Stop current playback and remove existing source
      videoRef.current.pause();
      if (videoRef.current.src) {
        URL.revokeObjectURL(videoRef.current.src);
      }

      // Create new blob URL
      const url = URL.createObjectURL(videoBlob);
      videoRef.current.src = url;
      videoRef.current.muted = false;

      // Play the video
      videoRef.current.play().catch(error => {
        console.error("Error playing video:", error);
        toast({
          title: "Playback Error",
          description: "Failed to play the recording.",
          variant: "destructive",
        });
      });

      // Clean up URL only when switching source or component unmounts
      videoRef.current.onloadeddata = () => {
        // Video is loaded and ready to play
        console.log("Video loaded successfully");
      };
    }
  };

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
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-6">
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
              autoPlay 
              muted={!recording} 
              playsInline 
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error("Video error:", e);
              }}
              onEnded={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                }
              }}
            />
            
            {videoBlob && !recording && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Button
                  variant="outline"
                  className="bg-primary/80 hover:bg-primary text-white hover:text-white"
                  onClick={playRecording}
                >
                  <Play className="h-6 w-6 mr-2" /> Play Recording
                </Button>
              </div>
            )}
          </div>
          
          {uploadProgress > 0 && (
            <div className="w-full mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm">Processing...</span>
                <span className="text-sm">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div> 
          )}
          
          <div className="w-full mb-6">
            <div className="flex justify-between mb-2">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                <span>{formatTime(elapsedTime)} / {formatTime(MAX_DURATION)}</span>
              </div>
              <span className="text-muted-foreground">
                {Math.round((elapsedTime / MAX_DURATION) * 100)}%
              </span>
            </div>
            <Progress value={(elapsedTime / MAX_DURATION) * 100} className="h-2" />
          </div>
          
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
