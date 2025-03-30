
import { supabase } from '@/integrations/supabase/client';

// Function to fetch the ElevenLabs API key from Supabase
export async function getElevenLabsApiKey(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('value')
      .eq('name', 'elevenlabs_api_key')
      .single();
    
    if (error) {
      console.error('Error fetching ElevenLabs API key:', error);
      throw new Error('Failed to fetch ElevenLabs API key');
    }
    
    if (!data || !data.value) {
      throw new Error('ElevenLabs API key not found in database');
    }
    
    return data.value;
  } catch (error) {
    console.error('Error in getElevenLabsApiKey:', error);
    throw new Error('Failed to retrieve ElevenLabs API key');
  }
}

