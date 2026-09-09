// src/services/shares.service.ts
import { supabase } from "../config/supabase";
import { BadRequestError, NotFoundError } from "../types/errors";
import { User } from "../types/express";

/** Check whether `userId` has a share entry for `documentId`. */
export async function hasShareAccess(documentId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("document_shares")
    .select("id")
    .eq("document_id", documentId)
    .eq("shared_with_user_id", userId)
    .single();
  if (error && error.code !== "PGRST116") {
    // Unexpected error
    throw error;
  }
  return !!data;
}

/** Create a share entry – throws BadRequestError if already exists. */
export async function createShare(documentId: string, sharedWithUserId: string) {
  const { data, error } = await supabase
    .from("document_shares")
    .insert({ document_id: documentId, shared_with_user_id: sharedWithUserId })
    .single();
  if (error) {
    // Unique constraint violation (already shared)
    if (error.code === "23505" || error.message?.includes("duplicate key")) {
      throw new BadRequestError("Document is already shared with this user");
    }
    throw error;
  }
  return data;
}

/** List users a document is shared with (id, email, name). */
export async function listSharesForDocument(documentId: string): Promise<User[]> {
  // First get share rows
  const { data: shares, error: sharesErr } = await supabase
    .from("document_shares")
    .select("shared_with_user_id")
    .eq("document_id", documentId);
  if (sharesErr) throw sharesErr;
  const userIds = shares?.map((s: any) => s.shared_with_user_id) ?? [];
  if (userIds.length === 0) return [];
  const { data: users, error: usersErr } = await supabase
    .from("users")
    .select("id,email,name")
    .in("id", userIds);
  if (usersErr) throw usersErr;
  return users as User[];
}

/** Delete a share entry. */
export async function deleteShare(documentId: string, userId: string) {
  const { data, error } = await supabase
    .from("document_shares")
    .delete()
    .eq("document_id", documentId)
    .eq("shared_with_user_id", userId)
    .single();
  if (error) {
    // If no row found, treat as not found
    if (error.code === "PGRST116") {
      throw new NotFoundError("Share not found");
    }
    throw error;
  }
  return data;
}
