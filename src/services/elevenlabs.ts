
import { supabase } from '@/integrations/supabase/client';

// Function to fetch the ElevenLabs API key from Supabase
export async function getElevenLabsApiKey(): Promise<string> {
  try {
    console.log('Fetching ElevenLabs API key from Supabase...');
    
    // Get the key from the api_keys table
    const { data, error } = await supabase
      .from('api_keys')
      .select('value')
      .eq('name', 'elevenlabs_api_key')
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching ElevenLabs API key:', error);
      throw new Error(`Failed to fetch API key: ${error.message}`);
    }
    
    // If no data found, throw an error
    if (!data || !data.value) {
      console.error('ElevenLabs API key not found in database or is empty');
      throw new Error('ElevenLabs API key not found in database or is empty');
    }
    
    console.log('Successfully retrieved ElevenLabs API key');
    return data.value;
  } catch (error) {
    console.error('Error in getElevenLabsApiKey:', error);
    throw error; // Rethrow the error to be handled by the calling function
  }
}
