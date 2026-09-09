import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

// Initialize Supabase client with service role key (backend trusted)
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
