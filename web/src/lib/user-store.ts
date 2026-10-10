'use client';

import type { WorkspaceRole } from '@/types';

export interface CurrentUser {
  id: string;
  fullName: string;
  email: string;
  username: string;
  role: WorkspaceRole;
  avatarUrl: string | null;
  hasPassword: boolean;
  lastPasswordChangedAt?: string;
}

const STORAGE_KEY = 'momentra_current_user';
const AUTH_TOKEN_KEY = 'momentra_auth_session';
const EVENT_NAME = 'momentra-user-updated';

export const DEFAULT_OWNER_USER: CurrentUser = {
  id: 'a1111111-1111-1111-1111-111111111111',
  fullName: 'สำราญ ศักดี',
  email: 'samran@momentra.app',
  username: 'samran',
  role: 'owner',
  avatarUrl: null,
  hasPassword: true,
  lastPasswordChangedAt: '2026-01-15T08:00:00Z',
};

function autoMigrateLegacyCache(): void {
  if (typeof window === 'undefined') return;
  try {
    const rawUser = localStorage.getItem(STORAGE_KEY) || '';
    const rawName = localStorage.getItem('momentra_hub_fullname') || '';
    const rawUsername = localStorage.getItem('momentra_hub_username') || '';

    const isLegacy =
      rawUser.includes('อนุชา') ||
      rawUser.includes('มานพ') ||
      rawUser.includes('สมชาย') ||
      rawName.includes('อนุชา') ||
      rawName.includes('มานพ') ||
      rawName.includes('สมชาย') ||
      rawUsername === 'drmum';

    if (isLegacy || !rawUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_OWNER_USER));
      localStorage.setItem('momentra_hub_fullname', DEFAULT_OWNER_USER.fullName);
      localStorage.setItem('momentra_hub_username', DEFAULT_OWNER_USER.username);
      localStorage.setItem(AUTH_TOKEN_KEY, 'active_owner_session');
    }
  } catch {
    // Ignore storage parse issues
  }
}

export function getCurrentUser(): CurrentUser {
  if (typeof window === 'undefined') return DEFAULT_OWNER_USER;
  autoMigrateLegacyCache();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CurrentUser) : DEFAULT_OWNER_USER;
  } catch {
    return DEFAULT_OWNER_USER;
  }
}

export function saveCurrentUser(updates: Partial<CurrentUser>): CurrentUser {
  const current = getCurrentUser();
  const merged: CurrentUser = { ...current, ...updates };
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    if (updates.fullName) localStorage.setItem('momentra_hub_fullname', updates.fullName);
    if (updates.username) localStorage.setItem('momentra_hub_username', updates.username);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: merged }));
  }
  return merged;
}

export function updateCurrentUserPassword(_newPassword: string): void {
  saveCurrentUser({
    hasPassword: true,
    lastPasswordChangedAt: new Date().toISOString(),
  });
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return true;
  return Boolean(localStorage.getItem(AUTH_TOKEN_KEY));
}

export function loginUser(identifier: string, _password: string): { success: boolean } {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_TOKEN_KEY, 'active_owner_session');
    if (identifier.includes('@')) {
      saveCurrentUser({ email: identifier });
    } else {
      saveCurrentUser({ username: identifier });
    }
  }
  return { success: true };
}

export function logoutUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: null }));
  }
}

export function subscribeToUser(callback: (user: CurrentUser) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<CurrentUser | null>;
    callback(customEvent.detail || getCurrentUser());
  };
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === AUTH_TOKEN_KEY) {
      callback(getCurrentUser());
    }
  });
  return () => window.removeEventListener(EVENT_NAME, handler);
}
