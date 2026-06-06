import { isTheme, Theme } from '../enums/theme';

const KEY = {
  Theme: 'memoflip.theme',
  GoogleClientId: 'memoflip.google.clientId',
  GoogleFolderId: 'memoflip.google.folderId',
  GoogleUserId: 'memoflip.google.userId',
  GoogleToken: 'memoflip.google.token',
  AutoSync: 'memoflip.autoSync',
  LastDeckId: 'memoflip.lastDeckId',
} as const;

// --- テーマ ---
export function getTheme(): Theme {
  const value = localStorage.getItem(KEY.Theme);
  if (isTheme(value)) return value;
  const prefersDark =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? Theme.Dark : Theme.Light;
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(KEY.Theme, theme);
}

// --- Google 設定 ---
export function getGoogleClientId(): string | null {
  return localStorage.getItem(KEY.GoogleClientId);
}

export function setGoogleClientId(value: string): void {
  localStorage.setItem(KEY.GoogleClientId, value);
}

export function getGoogleFolderId(): string | null {
  return localStorage.getItem(KEY.GoogleFolderId);
}

export function setGoogleFolderId(value: string): void {
  localStorage.setItem(KEY.GoogleFolderId, value);
}

export function getGoogleUserId(): string {
  return localStorage.getItem(KEY.GoogleUserId) ?? '';
}

export function setGoogleUserId(value: string): void {
  localStorage.setItem(KEY.GoogleUserId, value);
}

export function getAutoSync(): boolean {
  return localStorage.getItem(KEY.AutoSync) === 'true';
}

export function setAutoSync(value: boolean): void {
  localStorage.setItem(KEY.AutoSync, value ? 'true' : 'false');
}

export function getLastDeckId(): string | null {
  return localStorage.getItem(KEY.LastDeckId);
}

export function setLastDeckId(value: string): void {
  localStorage.setItem(KEY.LastDeckId, value);
}

// --- Google アクセストークンのキャッシュ ---
export interface GoogleAccessTokenRecord {
  token: string;
  expiresAt: number; // epoch ms
}

const TOKEN_EXPIRY_SAFETY_MARGIN_MS = 60_000;

export function getGoogleAccessTokenRecord(): GoogleAccessTokenRecord | null {
  const raw = localStorage.getItem(KEY.GoogleToken);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as GoogleAccessTokenRecord;
    if (typeof parsed.token === 'string' && typeof parsed.expiresAt === 'number') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function isGoogleAccessTokenValid(
  record: GoogleAccessTokenRecord | null,
): record is GoogleAccessTokenRecord {
  return !!record && record.expiresAt - TOKEN_EXPIRY_SAFETY_MARGIN_MS > Date.now();
}

export function setGoogleAccessToken(token: string, expiresInSec: number): void {
  const record: GoogleAccessTokenRecord = {
    token,
    expiresAt: Date.now() + expiresInSec * 1000,
  };
  localStorage.setItem(KEY.GoogleToken, JSON.stringify(record));
}

export function clearGoogleAccessToken(): void {
  localStorage.removeItem(KEY.GoogleToken);
}
