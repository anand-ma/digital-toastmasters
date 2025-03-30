
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

// Function to fetch the ElevenLabs API key from Supabase
export async function getElevenLabsApiKey(): Promise<string> {
  try {
    // Check if key exists first
    const { data, error } = await supabase
      .from('api_keys')
      .select('value')
      .eq('name', 'elevenlabs_api_key')
      .single();
    
    if (error) {
      console.error('Error fetching ElevenLabs API key:', error);
      throw new Error(`Failed to fetch ElevenLabs API key: ${error.message}`);
    }
    
    if (!data || !data.value) {
      throw new Error('ElevenLabs API key not found in database');
    }
    
    return data.value;
  } catch (error) {
    console.error('Error in getElevenLabsApiKey:', error);
    throw new Error(`Failed to retrieve ElevenLabs API key: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Function to check if ElevenLabs API key is configured
export async function isElevenLabsConfigured(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('value')
      .eq('name', 'elevenlabs_api_key')
      .single();
      
    if (error) {
      console.error('Error checking ElevenLabs configuration:', error);
      return false;
    }
    
    // Ensure the API key actually has a value
    if (!data || !data.value || data.value === 'YOUR_ELEVENLABS_API_KEY_HERE') {
      console.error('ElevenLabs API key is missing or set to placeholder value');
      return false;
    }
    
    return data.value.length > 0;
  } catch (error) {
    console.error('ElevenLabs API is not configured:', error);
    return false;
  }
}

// Helper function to handle transcription errors with meaningful messages
export function handleElevenLabsError(error: any): string {
  if (typeof error === 'object' && error !== null) {
    if (error.message) {
      if (error.message.includes('API key')) {
        return 'Invalid ElevenLabs API key. Please check your API key in Supabase settings.';
      }
      if (error.message.includes('rate limit')) {
        return 'ElevenLabs rate limit reached. Please try again later.';
      }
      return error.message;
    }
  }
  
  return 'An unknown error occurred with the ElevenLabs service.';
}
