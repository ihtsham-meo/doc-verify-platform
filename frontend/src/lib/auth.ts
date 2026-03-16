import { jwtDecode } from 'jwt-decode';

export interface AuthUser {
  userId: string;
  email:  string;
  role:   'user' | 'admin';
  exp:    number;
}

const TOKEN_KEY = 'token';
const USER_KEY  = 'user';

// ── Cookie helpers ────────────────────────────────────────────
const setCookie = (name: string, value: string, days = 7) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

// ── Session management ────────────────────────────────────────
export const saveSession = (token: string, user: Omit<AuthUser, 'exp'>) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY,  JSON.stringify(user));
  setCookie(TOKEN_KEY, token); // middleware reads this
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  deleteCookie(TOKEN_KEY);
};

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const getUser = (): Omit<AuthUser, 'exp'> | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try   { return JSON.parse(raw); }
  catch { return null; }
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const { exp } = jwtDecode<AuthUser>(token);
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
};

export const isAuthenticated = (): boolean => {
  const token = getToken();
  if (!token) return false;
  return !isTokenExpired(token);
};