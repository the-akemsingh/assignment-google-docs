// src/services/documents.service.ts
import { supabase } from "../config/supabase";
import { Document } from "../types/express";

/** Create a new document owned by `ownerId`. */
export async function createDocument(ownerId: string, title?: string) {
  const { data, error } = await supabase
    .from("documents")
    .insert({ owner_id: ownerId, title })
    .select()
    .single();
  if (error) throw error;
  return data as Document;
}

/** Retrieve a document by its id. */
export async function getDocumentById(id: string) {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();
  if (error && error.code !== "PGRST116") {
    // No rows found → return null; otherwise throw
    throw error;
  }
  return data as Document | null;
}

/** List owned and shared documents for a user. */
export async function listDocumentsForUser(userId: string) {
  // Owned docs
  const { data: owned, error: ownedErr } = await supabase
    .from("documents")
    .select("*")
    .eq("owner_id", userId);
  if (ownedErr) throw ownedErr;

  // Shared docs – first get document ids from shares
  const { data: shareRows, error: shareErr } = await supabase
    .from("document_shares")
    .select("document_id")
    .eq("shared_with_user_id", userId);
  if (shareErr) throw shareErr;

  const sharedIds = shareRows?.map((row: any) => row.document_id) ?? [];
  let shared: Document[] = [];
  if (sharedIds.length > 0) {
    const { data: sharedData, error: sharedErr } = await supabase
      .from("documents")
      .select("*")
      .in("id", sharedIds);
    if (sharedErr) throw sharedErr;
    shared = sharedData as Document[];
  }

  return { owned: owned as Document[], shared };
}

/** Update a document's title and/or content, bumping updated_at. */
export async function updateDocument(id: string, updates: { title?: string; content?: any }) {
  const payload: any = { ...updates, updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from("documents")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Document;
}

/** Delete a document by id. */
export async function deleteDocument(id: string) {
  const { data, error } = await supabase.from("documents").delete().eq("id", id).single();
  if (error) throw error;
  return data as Document;
}
