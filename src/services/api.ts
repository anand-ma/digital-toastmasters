
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

// Updated function to analyze a transcript using Anthropic Claude API
export async function analyzeTranscript(transcript: string): Promise<SpeechAnalysisResult> {
  try {
    // Define the prompt for Claude
    const prompt = `
      Please analyze this speech transcript and provide feedback:
      
      """
      ${transcript}
      """
      
      Analyze the transcript for:
      1. Filler words (um, uh, like, you know, etc.) - count each one
      2. Speaking pace in words per minute (calculate based on word count)
      3. Grammar issues with specific text segments and suggested improvements
      4. Overall confidence level on a scale of 0-100
      5. Body language assessment (if any visual cues are mentioned)
      6. Overall score on a scale of 0-100
      7. Detailed feedback paragraph
      
      Return ONLY a JSON object with this exact structure:
      {
        "fillerWordCount": number,
        "fillerWords": [{"word": string, "count": number}],
        "paceWpm": number,
        "paceRating": "Slow" | "Good" | "Fast",
        "grammarIssues": [{"text": string, "suggestion": string, "position": [number, number]}],
        "confidenceScore": number,
        "bodyLanguage": {
          "posture": number,
          "gestures": number,
          "eyeContact": number
        },
        "overallScore": number,
        "feedback": string
      }
      
      Notes:
      - For paceRating, use "Slow" for < 110 wpm, "Good" for 110-150 wpm, and "Fast" for > 150 wpm
      - If no body language cues are mentioned, estimate reasonable scores around 70-80
      - If grammar is perfect, return an empty array for grammarIssues
      - Make the feedback actionable and specific
      - Be encouraging but honest in your assessment
    `;
    
    // Call the Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': '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',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const result = await response.json();
    const analysisText = result.content[0].text;
    
    // Extract the JSON object from the response
    // Claude's response might include some text before or after the JSON
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse analysis from Claude');
    }

    const analysis = JSON.parse(jsonMatch[0]) as SpeechAnalysisResult;
    
    // Ensure all required properties are present
    return {
      fillerWordCount: analysis.fillerWordCount || 0,
      fillerWords: analysis.fillerWords || [],
      paceWpm: analysis.paceWpm || 120,
      paceRating: analysis.paceRating || "Good",
      grammarIssues: analysis.grammarIssues || [],
      confidenceScore: analysis.confidenceScore || 75,
      bodyLanguage: analysis.bodyLanguage || {
        posture: 75,
        gestures: 75,
        eyeContact: 75,
      },
      overallScore: analysis.overallScore || 75,
      feedback: analysis.feedback || "Analysis could not be completed."
    };
  } catch (error) {
    console.error("Error analyzing transcript with Claude:", error);
    
    // Fall back to a basic analysis if the API call fails
    return {
      fillerWordCount: 0,
      fillerWords: [],
      paceWpm: 120,
      paceRating: "Good",
      grammarIssues: [],
      confidenceScore: 75,
      bodyLanguage: {
        posture: 75,
        gestures: 75,
        eyeContact: 75,
      },
      overallScore: 75,
      feedback: "We couldn't analyze your transcript in detail. Please try again later."
    };
  }
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
