
import { supabase } from '@/lib/supabase';

// Function to fetch the ElevenLabs API key from Supabase
export async function getElevenLabsApiKey(): Promise<string> {
  try {
    // First try to get the key from the api_keys table
    const { data, error } = await supabase
      .from('api_keys')
      .select('value')
      .eq('name', 'elevenlabs_api_key')
      .maybeSingle(); // Use maybeSingle instead of single to handle no results
    
    if (error) {
      console.error('Error fetching ElevenLabs API key:', error);
      throw new Error('Failed to fetch API key');
    }
    
    // If no data found, throw a more specific error
    if (!data) {
      throw new Error('ElevenLabs API key not found in database');
    }
    
    return data.value;
  } catch (error) {
    console.error('Error in getElevenLabsApiKey:', error);
    // Fallback to a default key for development purposes only (should be removed in production)
    const fallbackKey = 'sk_b28a30dd43efe6a7c4f107d8a7536d5573e3161c1c2104aa';
    console.warn('Using fallback API key. This should be removed in production!');
    return fallbackKey;
  }
}
