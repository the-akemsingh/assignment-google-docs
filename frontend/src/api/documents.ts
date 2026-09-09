import { apiFetch } from './client';
import type { Document } from '../types';

export const listDocuments = async (): Promise<{ owned: Document[]; shared: Document[] }> => {
  return apiFetch<{ owned: Document[]; shared: Document[] }>('/documents');
};

export const createDocument = async (title?: string): Promise<Document> => {
  return apiFetch<Document>('/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
};

export const getDocument = async (id: string): Promise<Document> => {
  return apiFetch<Document>(`/documents/${id}`);
};

export const updateDocument = async (id: string, updates: { title?: string; content?: any }): Promise<Document> => {
  return apiFetch<Document>(`/documents/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
};

export const shareDocument = async (id: string, email: string): Promise<{ id: string; email: string; name: string }> => {
  return apiFetch<{ id: string; email: string; name: string }>(`/documents/${id}/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
};

export const listShares = async (id: string): Promise<Array<{ id: string; email: string; name: string }>> => {
  return apiFetch<Array<{ id: string; email: string; name: string }>>(`/documents/${id}/shares`);
};

export const revokeShare = async (id: string, userId: string): Promise<{ userId: string }> => {
  return apiFetch<{ userId: string }>(`/documents/${id}/share/${userId}`, {
    method: 'DELETE',
  });
};

export const importDocument = async (file: File): Promise<Document> => {
  const formData = new FormData();
  formData.append('file', file);

  return apiFetch<Document>('/documents/import', {
    method: 'POST',
    body: formData,
  });
};

export const deleteDocument = async (id: string): Promise<{ id: string }> => {
  return apiFetch<{ id: string }>(`/documents/${id}`, {
    method: 'DELETE',
  });
};