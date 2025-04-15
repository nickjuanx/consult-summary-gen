
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
      
      // Call the RPC function to create the table
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
