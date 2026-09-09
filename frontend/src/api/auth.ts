import { apiFetch } from './client';
import type { User } from '../types';

export const login = async (email: string): Promise<{ token: string; user: User }> => {
  return apiFetch<{ token: string; user: User }>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
};