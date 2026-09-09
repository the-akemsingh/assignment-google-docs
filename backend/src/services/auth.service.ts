// src/services/auth.service.ts
import { supabase } from "../config/supabase";
import { env } from "../config/env";
import jwt from "jsonwebtoken";
import { User } from "../types/express"; // type for returned user row (we'll augment later)

/**
 * Find a user by email. Returns the user row or null if not found.
 */
export async function findUserByEmail(email: string) {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, name")
    .eq("email", email)
    .single();
  if (error && error.code !== "PGRST116") {
    // PGRST116 = No rows found – treat as null, otherwise throw
    throw error;
  }
  return data as User | null;
}

/**
 * Sign a JWT for the given user.
 */
export function signToken(user: User) {
  const payload = { sub: user.id, email: user.email };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "24h" });
}
