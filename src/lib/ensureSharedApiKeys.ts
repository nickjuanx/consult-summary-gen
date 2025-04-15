
import { supabase } from "@/integrations/supabase/client";

export const ensureSharedApiKeysTable = async (): Promise<{ error: string | null }> => {
  try {
    // Check if the shared_api_keys table exists
    const { error: checkError } = await supabase
      .from('shared_api_keys')
      .select('service_name')
      .limit(1);

    // If we get a specific error about the relation not existing, we need to create the table
    if (checkError && checkError.message.includes('relation "public.shared_api_keys" does not exist')) {
      console.log('Creating shared_api_keys table...');
      
      // Call the RPC function to create the table - it takes no parameters
      const { error: createError } = await supabase.rpc('create_shared_api_keys_table');
      
      if (createError) {
        console.error('Error creating shared_api_keys table:', createError);
        return { error: createError.message };
      }
      
      console.log('shared_api_keys table created successfully');
    }
    
    return { error: null };
  } catch (error) {
    console.error('Error in ensureSharedApiKeysTable:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Función para configurar automáticamente la clave API de Groq
export const setupGroqApiKey = async (): Promise<{ error: string | null }> => {
  try {
    const GROQ_API_KEY = "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";
    
    // Verificar si ya existe una clave para Groq
    const { data, error: checkError } = await supabase
      .from('shared_api_keys')
      .select('*')
      .eq('service_name', 'groq')
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking for Groq API key:', checkError);
      return { error: checkError.message };
    }
    
    let upsertError = null;
    
    if (data) {
      // Actualizar el registro existente
      const { error } = await supabase
        .from('shared_api_keys')
        .update({ api_key: GROQ_API_KEY })
        .eq('service_name', 'groq');
      upsertError = error;
    } else {
      // Insertar un nuevo registro
      const { error } = await supabase
        .from('shared_api_keys')
        .insert({ service_name: 'groq', api_key: GROQ_API_KEY });
      upsertError = error;
    }
    
    if (upsertError) {
      console.error('Error setting up Groq API key:', upsertError);
      return { error: upsertError.message };
    }
    
    console.log('Groq API key configured successfully');
    return { error: null };
  } catch (error) {
    console.error('Error in setupGroqApiKey:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
