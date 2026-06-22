import { auth } from './firebase-client';

export async function apiFetch(url, options = {}) {
  const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
}
