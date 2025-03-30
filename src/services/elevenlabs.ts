
import { supabase } from '@/lib/supabase';

// Function to fetch the ElevenLabs API key from Supabase
export async function getElevenLabsApiKey(): Promise<string> {
  try {
    // Get the key from the api_keys table
    const { data, error } = await supabase
      .from('api_keys')
      .select('value')
      .eq('name', 'elevenlabs_api_key')
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching ElevenLabs API key:', error);
      throw new Error('Failed to fetch API key');
    }
    
    // If no data found, throw an error
    if (!data) {
      throw new Error('ElevenLabs API key not found in database');
    }
    
    return data.value;
  } catch (error) {
    console.error('Error in getElevenLabsApiKey:', error);
    throw error; // Rethrow the error to be handled by the calling function
  }
}
