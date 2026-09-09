export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const apiFetch = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
	const token = localStorage.getItem('auth_token');
	const headers = new Headers(options.headers);

	if (token) {
		headers.set('Authorization', `Bearer ${token}`);
	}

	const response = await fetch(`${API_URL}${path}`, {
		...options,
		headers,
	});
	const body = await response.json();

	if (!response.ok) {
		const message = body?.error?.message;
		throw new Error(typeof message === 'string' ? message : 'Request failed');
	}

	return body.data as T;
};