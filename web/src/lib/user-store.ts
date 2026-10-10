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

export function getCurrentUser(): CurrentUser {
  if (typeof window === 'undefined') {
    return DEFAULT_OWNER_USER;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_OWNER_USER));
      return DEFAULT_OWNER_USER;
    }
    return JSON.parse(raw) as CurrentUser;
  } catch {
    return DEFAULT_OWNER_USER;
  }
}

export function saveCurrentUser(updates: Partial<CurrentUser>): CurrentUser {
  const current = getCurrentUser();
  const merged: CurrentUser = {
    ...current,
    ...updates,
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
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

export function subscribeToUser(callback: (user: CurrentUser) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<CurrentUser>;
    callback(customEvent.detail || getCurrentUser());
  };
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      callback(getCurrentUser());
    }
  });
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
  };
}
