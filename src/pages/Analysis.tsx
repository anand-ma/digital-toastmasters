
import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  FileText, 
  Video,
  BarChart3,
  MessageSquare,
  ChevronsUpDown,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { 
  processRecording, 
  transcribeAudio, 
  type Recording,
  type Transcript,
  type SpeechAnalysisResult
} from "@/services/api";
import { analyzeTranscriptWithClaude } from "@/services/claude";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ElevenLabsClient } from 'elevenlabs';
import { getElevenLabsApiKey } from '@/services/elevenlabs';

// Initialize the ElevenLabs client with state
let client: ElevenLabsClient | null = null;

export default function Analysis() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { toast } = useToast();
  
  const [recording, setRecording] = useState<Recording | null>(null);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [analysis, setAnalysis] = useState<SpeechAnalysisResult | null>(null);
  
  // Add state for active tab
  const [activeTab, setActiveTab] = useState<string>("transcript");
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  
  // Add this state to store the recording data
  const [recordingData, setRecordingData] = useState<any>(null);
  const [isClientInitialized, setIsClientInitialized] = useState<boolean>(false);

  // Initialize the ElevenLabs client
  useEffect(() => {
    const initializeClient = async () => {
      try {
        const apiKey = await getElevenLabsApiKey();
        client = new ElevenLabsClient({
          apiKey: apiKey,
        });
        setIsClientInitialized(true);
      } catch (error) {
        console.error("Error initializing ElevenLabs client:", error);
        toast({
          title: "Error",
          description: "Failed to initialize speech-to-text service. Please try again later.",
          variant: "destructive",
        });
      }
    };

    initializeClient();
  }, [toast]);
  
  // Update the initial useEffect to get recording data
  useEffect(() => {
    const fetchRecordingData = async () => {
      try {
        // Try to get data from localStorage first
        const storedData = localStorage.getItem('recordingData');
        let data;
        
        if (storedData) {
          data = JSON.parse(storedData);
        } else if (location.state) {
          // Fallback to location state if localStorage is empty
          data = location.state;
          // Store it in localStorage for future use
          localStorage.setItem('recordingData', JSON.stringify(data));
        }

        if (data) {
          setRecordingData(data);
          // Set the recording with the data
          setRecording({
            id: data.id,
            title: data.fileName,
            date: new Date().toISOString(),
            duration: 0, // You might want to calculate this
            videoUrl: data.blobUrl,
            audioUrl: data.blobUrl
          });
        } else {
          throw new Error('No recording data found');
        }
      } catch (error) {
        console.error("Error fetching recording data:", error);
        toast({
          title: "Error loading recording",
          description: "Failed to load the recording data. Please try uploading again.",
          variant: "destructive",
        });
      }
    };

    fetchRecordingData();
  }, [id, location.state, toast]);
  
  // Add cleanup for preview URL when component unmounts
  useEffect(() => {
    return () => {
      const storedData = localStorage.getItem('recordingData');
      if (storedData) {
        const { previewUrl } = JSON.parse(storedData);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
      }
    };
  }, []);
  
  const handleTranscribe = async () => {
    if (!recordingData) {
      toast({
        title: "No recording found",
        description: "Please upload a file first.",
        variant: "destructive",
      });
      return;
    }
    
    if (!client || !isClientInitialized) {
      toast({
        title: "Service not ready",
        description: "Speech-to-text service is not initialized. Please try again later.",
        variant: "destructive",
      });
      return;
    }
    
    setIsTranscribing(true);
    
    try {
      // Fetch the file from the blob URL
      const response = await fetch(recordingData.blobUrl);
      const blob = await response.blob();
      
      const audioFile = new File([blob], recordingData.fileName, {
        type: recordingData.fileType
      });

      const transcription = await client.speechToText.convert({
        file: audioFile,
        model_id: "scribe_v1",
      });

      // Get the video duration
      const video = document.createElement('video');
      video.src = recordingData.blobUrl;
      await new Promise(resolve => {
        video.addEventListener('loadedmetadata', resolve);
      });
      const duration = Math.floor(video.duration);

      // Create segments for every 10 seconds
      const segmentLength = 10; // 10 seconds per segment
      const numberOfSegments = Math.ceil(duration / segmentLength);
      const wordsArray = transcription.text.split(' ');
      const wordsPerSegment = Math.ceil(wordsArray.length / numberOfSegments);

      const segments = Array.from({ length: numberOfSegments }, (_, index) => {
        const start = index * segmentLength;
        const end = Math.min((index + 1) * segmentLength, duration);
        
        // Get words for this segment
        const startWord = index * wordsPerSegment;
        const endWord = Math.min((index + 1) * wordsPerSegment, wordsArray.length);
        const segmentText = wordsArray.slice(startWord, endWord).join(' ');

        return {
          text: segmentText,
          start: start,
          end: end,
          confidence: 0.9 // Default confidence value
        };
      });

      const newTranscript: Transcript = {
        text: transcription.text,
        segments: segments
      };

      setTranscript(newTranscript);
      
      toast({
        title: "Transcription complete",
        description: "Your speech has been transcribed successfully.",
      });
    } catch (error) {
      console.error("Error transcribing audio:", error);
      toast({
        title: "Transcription failed",
        description: `Failed to transcribe: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };
  
  // Add this function to handle segment click
  const handleSegmentClick = (startTime: number) => {
    const videoElement = document.querySelector('video');
    if (videoElement) {
      videoElement.currentTime = startTime;
      videoElement.play();
    }
  };
  
  const handleAnalyze = async () => {
    if (!transcript || !transcript.text) {
      toast({
        title: "Transcript required",
        description: "Please transcribe your speech before analyzing.",
        variant: "destructive",
      });
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      // Use the new Claude service instead of the mock API
      const result = await analyzeTranscriptWithClaude(transcript.text);
      setAnalysis(result);
      
      // Set the active tab to analysis when analysis is complete
      setActiveTab("analysis");
      
      toast({
        title: "Analysis complete",
        description: "Your speech has been analyzed successfully.",
      });
    } catch (error) {
      console.error("Error analyzing transcript:", error);
      toast({
        title: "Analysis failed",
        description: `Failed to analyze your speech: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };
  
  const handleSkipBack = () => {
    setCurrentTime(Math.max(0, currentTime - 10));
  };
  
  const handleSkipForward = () => {
    setCurrentTime(Math.min(duration, currentTime + 10));
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };
  
  // Add cleanup for blob URLs
  useEffect(() => {
    return () => {
      if (recordingData?.blobUrl) {
        URL.revokeObjectURL(recordingData.blobUrl);
      }
    };
  }, [recordingData]);
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {recording ? (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">{recording.title}</h1>
            <p className="text-muted-foreground">
              Recorded on {new Date(recording.date).toLocaleDateString()} • {recording.duration}s
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Video/Audio Player Section */}
            <div className="lg:col-span-2">
              <Card className="mb-8">
                <CardHeader className="pb-0">
                  <CardTitle>Recording Playback</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Video Player */}
                  <div className="aspect-video bg-black rounded-md overflow-hidden mb-4">
                    {recording.videoUrl ? (
                      <video
                        src={recording.videoUrl}
                        className="w-full h-full"
                        controls
                        playsInline
                        // These props would be controlled in a real implementation
                        // muted={isMuted}
                        // onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                        // onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                        // onPlay={() => setIsPlaying(true)}
                        // onPause={() => setIsPlaying(false)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <p className="text-muted-foreground">Video not available</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Custom Controls - These would be functional in a real implementation */}
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                    <Progress value={(currentTime / duration) * 100} className="h-1" />
                    <div className="flex justify-between items-center pt-2">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon" onClick={handleMuteToggle}>
                          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                        </Button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon" onClick={handleSkipBack}>
                          <SkipBack className="h-5 w-5" />
                        </Button>
                        <Button variant="default" size="icon" className="h-10 w-10 rounded-full" onClick={handlePlayPause}>
                          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleSkipForward}>
                          <SkipForward className="h-5 w-5" />
                        </Button>
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* Placeholder for additional controls */}
                        <div className="w-8"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Tabs for Transcript and Analysis */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="transcript" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Transcript
                  </TabsTrigger>
                  <TabsTrigger value="analysis" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" /> Analysis
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="transcript" className="p-4 border rounded-md mt-2">
                  {transcript ? (
                    <div className="space-y-4">
                      <div className="whitespace-pre-wrap text-foreground">
                        {transcript.text}
                      </div>
                      
                      <Accordion type="single" collapsible className="mt-4">
                        <AccordionItem value="segments">
                          <AccordionTrigger>
                            <span className="flex items-center gap-2 text-sm">
                              <ChevronsUpDown className="h-4 w-4" /> View Time Segments
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 mt-2">
                              {transcript.segments.map((segment, index) => (
                                <div 
                                  key={index} 
                                  className="p-2 rounded border hover:bg-muted/30 transition-colors cursor-pointer"
                                  onClick={() => handleSegmentClick(segment.start)}
                                >
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="text-muted-foreground">
                                      {formatTime(segment.start)} - {formatTime(segment.end)}
                                    </span>
                                    <span className="text-xs bg-primary/10 rounded-full px-2 py-0.5">
                                      {Math.round(segment.confidence * 100)}% confidence
                                    </span>
                                  </div>
                                  <p className="text-sm">{segment.text}</p>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground mb-4">
                        No transcript available. Generate a transcript to see your speech text.
                      </p>
                      <Button 
                        onClick={handleTranscribe}
                        disabled={isTranscribing}
                      >
                        {isTranscribing ? (
                          <>
                            <div className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin mr-2"></div>
                            Transcribing...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 mr-2" /> Generate Transcript
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="analysis" className="p-4 border rounded-md mt-2">
                  {analysis ? (
                    <div className="space-y-6">
                      {/* Overall Score */}
                      <div className="flex flex-col items-center py-4">
                        <div className="relative">
                          <svg className="w-32 h-32">
                            <circle
                              className="text-muted/20 stroke-current"
                              strokeWidth="8"
                              fill="transparent"
                              r="56"
                              cx="64"
                              cy="64"
                            />
                            <circle
                              className="text-primary stroke-current"
                              strokeWidth="8"
                              strokeLinecap="round"
                              fill="transparent"
                              r="56"
                              cx="64"
                              cy="64"
                              strokeDasharray="351.86"
                              strokeDashoffset={351.86 - (351.86 * analysis.overallScore) / 100}
                              transform="rotate(-90 64 64)"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-3xl font-bold">{analysis.overallScore}</div>
                          </div>
                        </div>
                        <p className="mt-2 font-semibold text-lg">Overall Score</p>
                      </div>
                      
                      {/* Metrics Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <Card>
                          <CardContent className="p-4 text-center">
                            <p className="text-sm text-muted-foreground">Pace</p>
                            <p className="text-2xl font-semibold">{analysis.paceWpm}</p>
                            <p className="text-sm">words/min</p>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              analysis.paceRating === "Good" ? "bg-green-100 text-green-800" :
                              analysis.paceRating === "Slow" ? "bg-blue-100 text-blue-800" :
                              "bg-yellow-100 text-yellow-800"
                            }`}>
                              {analysis.paceRating}
                            </span>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4 text-center">
                            <p className="text-sm text-muted-foreground">Filler Words</p>
                            <p className="text-2xl font-semibold">{analysis.fillerWordCount}</p>
                            <p className="text-sm">detected</p>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              analysis.fillerWordCount <= 2 ? "bg-green-100 text-green-800" :
                              analysis.fillerWordCount <= 5 ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                            }`}>
                              {analysis.fillerWordCount <= 2 ? "Excellent" :
                               analysis.fillerWordCount <= 5 ? "Average" : "Needs Work"}
                            </span>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4 text-center">
                            <p className="text-sm text-muted-foreground">Grammar</p>
                            <p className="text-2xl font-semibold">{analysis.grammarIssues.length}</p>
                            <p className="text-sm">issues</p>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              analysis.grammarIssues.length === 0 ? "bg-green-100 text-green-800" :
                              analysis.grammarIssues.length <= 2 ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                            }`}>
                              {analysis.grammarIssues.length === 0 ? "Perfect" :
                               analysis.grammarIssues.length <= 2 ? "Good" : "Needs Work"}
                            </span>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4 text-center">
                            <p className="text-sm text-muted-foreground">Confidence</p>
                            <p className="text-2xl font-semibold">{analysis.confidenceScore}</p>
                            <p className="text-sm">out of 100</p>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              analysis.confidenceScore >= 80 ? "bg-green-100 text-green-800" :
                              analysis.confidenceScore >= 60 ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                            }`}>
                              {analysis.confidenceScore >= 80 ? "Strong" :
                               analysis.confidenceScore >= 60 ? "Average" : "Work on it"}
                            </span>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Details Accordion */}
                      <Accordion type="multiple" className="mt-8">
                        {/* Filler Words Analysis */}
                        <AccordionItem value="filler-words">
                          <AccordionTrigger>Filler Words</AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4">
                              <p className="text-muted-foreground">
                                Filler words can reduce the impact of your message. Here are the filler words detected in your speech:
                              </p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                                {analysis.fillerWords.map((item, index) => (
                                  <div key={index} className="flex justify-between p-2 bg-muted/20 rounded">
                                    <span>"{item.word}"</span>
                                    <span className="font-semibold">{item.count}×</span>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-4 p-4 bg-primary/5 rounded">
                                <h4 className="font-medium flex items-center gap-2">
                                  <Zap className="h-4 w-4 text-primary" /> Tip
                                </h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Try to replace filler words with brief pauses. Pausing gives you time to think and adds emphasis to your message.
                                </p>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        
                        {/* Grammar Issues */}
                        <AccordionItem value="grammar-issues">
                          <AccordionTrigger>Grammar Suggestions</AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4">
                              {analysis.grammarIssues.length > 0 ? (
                                <>
                                  <p className="text-muted-foreground">
                                    These grammar issues were detected in your speech:
                                  </p>
                                  <div className="space-y-3">
                                    {analysis.grammarIssues.map((issue, index) => (
                                      <div key={index} className="p-3 border rounded">
                                        <div className="flex justify-between mb-2">
                                          <span className="font-medium">Original</span>
                                          <span className="text-red-500 text-sm">Issue detected</span>
                                        </div>
                                        <p className="p-2 bg-red-50 rounded text-sm mb-3">"{issue.text}"</p>
                                        <div className="font-medium mb-2">Suggestion</div>
                                        <p className="p-2 bg-green-50 rounded text-sm">"{issue.suggestion}"</p>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                <p className="text-green-600 flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full bg-green-600"></span> No significant grammar issues detected
                                </p>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        
                        {/* Body Language Analysis - Only shown if available */}
                        {analysis.bodyLanguage && (
                          <AccordionItem value="body-language">
                            <AccordionTrigger>Body Language</AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-4">
                                <p className="text-muted-foreground">
                                  Your body language contributes significantly to how your message is received:
                                </p>
                                
                                <div className="space-y-3">
                                  <div>
                                    <div className="flex justify-between mb-1">
                                      <span className="text-sm">Posture</span>
                                      <span className={`text-sm ${getScoreColor(analysis.bodyLanguage.posture)}`}>
                                        {analysis.bodyLanguage.posture}/100
                                      </span>
                                    </div>
                                    <Progress value={analysis.bodyLanguage.posture} className="h-2" />
                                  </div>
                                  
                                  <div>
                                    <div className="flex justify-between mb-1">
                                      <span className="text-sm">Gestures</span>
                                      <span className={`text-sm ${getScoreColor(analysis.bodyLanguage.gestures)}`}>
                                        {analysis.bodyLanguage.gestures}/100
                                      </span>
                                    </div>
                                    <Progress value={analysis.bodyLanguage.gestures} className="h-2" />
                                  </div>
                                  
                                  <div>
                                    <div className="flex justify-between mb-1">
                                      <span className="text-sm">Eye Contact</span>
                                      <span className={`text-sm ${getScoreColor(analysis.bodyLanguage.eyeContact)}`}>
                                        {analysis.bodyLanguage.eyeContact}/100
                                      </span>
                                    </div>
                                    <Progress value={analysis.bodyLanguage.eyeContact} className="h-2" />
                                  </div>
                                </div>
                                
                                <div className="mt-4 p-4 bg-primary/5 rounded">
                                  <h4 className="font-medium flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-primary" /> Tip
                                  </h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Maintain good posture, use natural hand gestures to emphasize points, and try to maintain eye contact with your audience (or camera) for more effective communication.
                                  </p>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        )}
                      </Accordion>
                      
                      {/* AI Feedback */}
                      <Card className="mt-8">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" /> AI Feedback
                          </CardTitle>
                          <CardDescription>
                            A comprehensive analysis of your presentation
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="whitespace-pre-wrap">
                            {analysis.feedback}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      {transcript ? (
                        <>
                          <p className="text-muted-foreground mb-4">
                            Your transcript is ready. Analyze it to get detailed feedback on your presentation.
                          </p>
                          <Button 
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                          >
                            {isAnalyzing ? (
                              <>
                                <div className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin mr-2"></div>
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <BarChart3 className="h-4 w-4 mr-2" /> Analyze Speech
                              </>
                            )}
                          </Button>
                        </>
                      ) : (
                        <p className="text-muted-foreground">
                          You need to generate a transcript before you can analyze your speech.
                        </p>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Analysis Summary Sidebar */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Analysis Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {analysis ? (
                    <div className="space-y-6">
                      <div className="flex flex-col items-center p-4 bg-muted/20 rounded-lg">
                        <div className="text-4xl font-bold text-primary mb-2">
                          {analysis.overallScore}
                        </div>
                        <p className="text-sm text-muted-foreground">Your Overall Score</p>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Pace</span>
                            <span className="text-sm">{analysis.paceRating}</span>
                          </div>
                          <Progress value={
                            analysis.paceRating === "Good" ? 90 :
                            analysis.paceRating === "Slow" ? 60 : 70
                          } className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Grammar</span>
                            <span className="text-sm">
                              {analysis.grammarIssues.length === 0 ? "Excellent" :
                               analysis.grammarIssues.length <= 2 ? "Good" : "Needs Work"}
                            </span>
                          </div>
                          <Progress value={
                            analysis.grammarIssues.length === 0 ? 100 :
                            analysis.grammarIssues.length <= 2 ? 75 : 50
                          } className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Filler Words</span>
                            <span className="text-sm">
                              {analysis.fillerWordCount} detected
                            </span>
                          </div>
                          <Progress value={
                            analysis.fillerWordCount <= 2 ? 90 :
                            analysis.fillerWordCount <= 5 ? 70 : 50
                          } className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Confidence</span>
                            <span className="text-sm">{analysis.confidenceScore}/100</span>
                          </div>
                          <Progress value={analysis.confidenceScore} className="h-2" />
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <h4 className="font-medium mb-2">Key Takeaways</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="h-5 w-5 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-xs mt-0.5">✓</span>
                            <span>Well-structured presentation with clear points</span>
                          </li>
                          {analysis.fillerWordCount > 2 && (
                            <li className="flex items-start gap-2">
                              <span className="h-5 w-5 rounded-full bg-yellow-100 text-yellow-800 flex items-center justify-center text-xs mt-0.5">!</span>
                              <span>Reduce filler words like "um" and "like"</span>
                            </li>
                          )}
                          {analysis.paceRating !== "Good" && (
                            <li className="flex items-start gap-2">
                              <span className="h-5 w-5 rounded-full bg-yellow-100 text-yellow-800 flex items-center justify-center text-xs mt-0.5">!</span>
                              <span>
                                {analysis.paceRating === "Fast" ? "Slow down your speaking pace" : "Pick up your speaking pace"}
                              </span>
                            </li>
                          )}
                          {analysis.grammarIssues.length > 0 && (
                            <li className="flex items-start gap-2">
                              <span className="h-5 w-5 rounded-full bg-yellow-100 text-yellow-800 flex items-center justify-center text-xs mt-0.5">!</span>
                              <span>Review grammar suggestions for clearer communication</span>
                            </li>
                          )}
                        </ul>
                      </div>
                      
                      <Button variant="outline" className="w-full" onClick={() => window.print()}>
                        Export Report
                      </Button>
                    </div>
                  ) : transcript ? (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground mb-4">
                        Your transcript is ready, but hasn't been analyzed yet.
                      </p>
                      <Button 
                        onClick={handleAnalyze} 
                        disabled={isAnalyzing}
                        className="w-full"
                      >
                        {isAnalyzing ? "Analyzing..." : "Analyze Speech"}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground mb-4">
                        Start by transcribing your speech to see analysis.
                      </p>
                      <Button 
                        onClick={handleTranscribe} 
                        disabled={isTranscribing}
                        className="w-full"
                      >
                        {isTranscribing ? "Transcribing..." : "Generate Transcript"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}
