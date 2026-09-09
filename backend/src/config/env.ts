import { z, ZodError } from "zod";
import dotenv from "dotenv";
dotenv.config();

// Define the expected environment variables schema
const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  JWT_SECRET: z.string(),
  PORT: z.string().optional().default("4000"),
});

// Parse and validate environment variables; throws on failure, causing process exit.
export const env = envSchema.parse(process.env);
