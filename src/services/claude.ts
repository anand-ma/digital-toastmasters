
import { supabase } from '@/integrations/supabase/client';
import type { SpeechAnalysisResult } from './api';

// Function to fetch the API key from Supabase
async function getAnthropicApiKey(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('value')
      .eq('name', 'anthropic_api_key')
      .single();
    
    if (error) {
      console.error('Error fetching Anthropic API key:', error);
      throw new Error('Failed to fetch API key');
    }
    
    return data.value;
  } catch (error) {
    console.error('Error in getAnthropicApiKey:', error);
    throw new Error('Failed to retrieve Anthropic API key');
  }
}

export async function analyzeTranscriptWithClaude(transcript: string): Promise<SpeechAnalysisResult> {
  try {
    // Get the API key from Supabase
    const apiKey = await getAnthropicApiKey();
    
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
        'x-api-key': apiKey,
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
      const errorText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const analysisText = result.content[0].text;
    
    // Extract the JSON object from the response
    // Claude's response might include some text before or after the JSON
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Claude response');
    }
    
    try {
      const analysisResult = JSON.parse(jsonMatch[0]);
      
      // Validate the response has the expected structure
      if (!analysisResult || 
          typeof analysisResult.fillerWordCount !== 'number' || 
          !Array.isArray(analysisResult.fillerWords) ||
          typeof analysisResult.paceWpm !== 'number' ||
          !analysisResult.paceRating ||
          !Array.isArray(analysisResult.grammarIssues) ||
          typeof analysisResult.confidenceScore !== 'number' ||
          !analysisResult.bodyLanguage ||
          typeof analysisResult.overallScore !== 'number' ||
          typeof analysisResult.feedback !== 'string') {
        throw new Error('Invalid response structure from Claude');
      }
      
      return analysisResult as SpeechAnalysisResult;
    } catch (parseError) {
      console.error('Error parsing Claude response:', parseError);
      throw new Error('Failed to parse Claude analysis result');
    }
  } catch (error) {
    console.error('Error in Claude analysis:', error);
    // Fallback to a basic analysis result if the API call fails
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
      feedback: "We were unable to provide a detailed analysis. Please try again later."
    };
  }
}
