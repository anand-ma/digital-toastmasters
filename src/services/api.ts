// Mock data and API service interfaces

// Speech analysis result type
export interface SpeechAnalysisResult {
  fillerWordCount: number;
  fillerWords: { word: string; count: number }[];
  paceWpm: number;
  paceRating: "Slow" | "Good" | "Fast";
  grammarIssues: { text: string; suggestion: string; position: [number, number] }[];
  confidenceScore: number;
  bodyLanguage?: {
    posture: number;
    gestures: number;
    eyeContact: number;
  };
  overallScore: number;
  feedback: string;
}

// Transcript segment type
export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  confidence: number;
}

// Transcript type
export interface Transcript {
  segments: TranscriptSegment[];
  text: string;
}

// Recording type
export interface Recording {
  id: string;
  title: string;
  date: string;
  duration: number;
  videoUrl?: string;
  audioUrl?: string;
  transcript?: Transcript;
  analysis?: SpeechAnalysisResult;
}

// Mock function to process a recording
export async function processRecording(file: File): Promise<Recording> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Generate a mock recording response
  return {
    id: Math.random().toString(36).substring(2, 15),
    title: file.name.split(".")[0] || "Untitled Recording",
    date: new Date().toISOString(),
    duration: 45, // Assuming 45 seconds for all recordings
    videoUrl: URL.createObjectURL(file),
    audioUrl: URL.createObjectURL(file),
  };
}

// Mock function to transcribe audio
export async function transcribeAudio(recordingId: string): Promise<Transcript> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Return mock transcript data
  return {
    segments: [
      { start: 0, end: 5.2, text: "Hello, my name is Sarah and today I'm going to talk about artificial intelligence.", confidence: 0.95 },
      { start: 5.4, end: 11.8, text: "Um, AI has transformed many industries, like, you know, healthcare and education.", confidence: 0.88 },
      { start: 12.0, end: 20.5, text: "One of the most significant advantages of AI is its ability to process large amounts of data quickly and identify patterns.", confidence: 0.92 },
      { start: 21.0, end: 28.3, text: "However, there are also concerns about, um, privacy and ethical considerations that we need to address.", confidence: 0.85 },
      { start: 28.5, end: 45.0, text: "In conclusion, AI offers tremendous benefits but requires careful implementation with proper oversight to ensure it serves humanity's best interests. Thank you for your attention.", confidence: 0.93 },
    ],
    text: "Hello, my name is Sarah and today I'm going to talk about artificial intelligence. Um, AI has transformed many industries, like, you know, healthcare and education. One of the most significant advantages of AI is its ability to process large amounts of data quickly and identify patterns. However, there are also concerns about, um, privacy and ethical considerations that we need to address. In conclusion, AI offers tremendous benefits but requires careful implementation with proper oversight to ensure it serves humanity's best interests. Thank you for your attention."
  };
}

// Mock function to analyze a transcript
export async function analyzeTranscript(transcript: string): Promise<SpeechAnalysisResult> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 4000));
  
  // Return mock analysis data
  return {
    fillerWordCount: 4,
    fillerWords: [
      { word: "um", count: 2 },
      { word: "like", count: 1 },
      { word: "you know", count: 1 },
    ],
    paceWpm: 125,
    paceRating: "Good",
    grammarIssues: [
      { 
        text: "like, you know,", 
        suggestion: "such as", 
        position: [91, 103] 
      },
    ],
    confidenceScore: 82,
    bodyLanguage: {
      posture: 85,
      gestures: 70,
      eyeContact: 75,
    },
    overallScore: 80,
    feedback: "Your speech was well-structured with a clear introduction, body, and conclusion. Try to minimize filler words like 'um' and 'you know'. Your pace is good at 125 words per minute, making it easy to follow. Consider using more specific language instead of phrases like 'like, you know'. Overall, you delivered a clear and informative presentation on AI."
  };
}

// Mock function to get user recordings
export async function getUserRecordings(): Promise<Recording[]> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock recordings data
  return [
    {
      id: "rec123",
      title: "AI Presentation",
      date: "2023-09-15T14:30:00Z",
      duration: 45,
      analysis: {
        fillerWordCount: 4,
        fillerWords: [{ word: "um", count: 2 }, { word: "like", count: 1 }, { word: "you know", count: 1 }],
        paceWpm: 125,
        paceRating: "Good",
        grammarIssues: [{ text: "like, you know,", suggestion: "such as", position: [91, 103] }],
        confidenceScore: 82,
        overallScore: 80,
        feedback: "Your speech was well-structured with a clear introduction, body, and conclusion. Try to minimize filler words like 'um' and 'you know'."
      }
    },
    {
      id: "rec456",
      title: "Team Meeting Introduction",
      date: "2023-09-10T09:15:00Z",
      duration: 30,
      analysis: {
        fillerWordCount: 2,
        fillerWords: [{ word: "um", count: 1 }, { word: "so", count: 1 }],
        paceWpm: 110,
        paceRating: "Good",
        grammarIssues: [],
        confidenceScore: 88,
        overallScore: 85,
        feedback: "Great job on your team introduction! Your pace was appropriate and you maintained good clarity throughout."
      }
    },
    {
      id: "rec789",
      title: "Product Pitch",
      date: "2023-09-05T16:45:00Z",
      duration: 60,
      analysis: {
        fillerWordCount: 8,
        fillerWords: [{ word: "um", count: 3 }, { word: "like", count: 2 }, { word: "actually", count: 3 }],
        paceWpm: 145,
        paceRating: "Fast",
        grammarIssues: [{ text: "me and my team", suggestion: "my team and I", position: [45, 58] }],
        confidenceScore: 75,
        overallScore: 70,
        feedback: "Your product pitch contained valuable information, but was delivered too quickly. Try to slow down and reduce filler words to improve clarity."
      }
    }
  ];
}

// Add a function to check if an API key exists in the database
export async function checkApiKeyExists(keyName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('value')
      .eq('name', keyName)
      .single();
    
    if (error || !data) {
      console.error(`API key ${keyName} not found:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error checking for ${keyName}:`, error);
    return false;
  }
}
