// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://mawlxmnbxgfyiaimsfwm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hd2x4bW5ieGdmeWlhaW1zZndtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMzcyODgsImV4cCI6MjA1NzcxMzI4OH0.u5vVLnXDh8fGCs1xAoNuf1MrBL57q7Su3KhHPMAmXKI";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);