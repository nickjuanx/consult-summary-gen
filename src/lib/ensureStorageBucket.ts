
import { supabase } from "@/integrations/supabase/client";

export const ensureConsultationAudiosBucket = async (): Promise<void> => {
  try {
    // Check if bucket exists
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error("Error listing storage buckets:", bucketError);
      return; // No need to throw an error, just log it
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === 'consultation-audios');
    
    // Create bucket if it doesn't exist
    if (!bucketExists) {
      console.log("Creating consultation-audios bucket...");
      const { error: createError } = await supabase.storage.createBucket('consultation-audios', {
        public: true,
        fileSizeLimit: 52428800, // 50MB limit
      });
      
      if (createError) {
        console.error("Error creating consultation-audios bucket:", createError);
        return; // No need to throw an error, just log it
      } else {
        console.log("Successfully created consultation-audios bucket");
      }
    } else {
      console.log("consultation-audios bucket already exists");
    }
    
    return Promise.resolve();
  } catch (error) {
    console.error("Error ensuring consultation-audios bucket:", error);
    return; // No need to throw an error, just log it
  }
};
