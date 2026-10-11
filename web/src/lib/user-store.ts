'use client';

import type { WorkspaceRole } from '@/types';
import { INITIAL_PLATFORM_USERS, type PlatformUser } from './platform-mock-data';

export type UserPlatformRole = 'sysadmin' | WorkspaceRole;
export type { PlatformUser };

export interface CurrentUser {
  id: string;
  fullName: string;
  email: string;
  username: string;
  role: UserPlatformRole;
  avatarUrl: string | null;
  hasPassword: boolean;
  lastPasswordChangedAt?: string;
}

const STORAGE_KEY = 'momentra_current_user';
const PLATFORM_USERS_KEY = 'momentra_platform_users';
const AUTH_TOKEN_KEY = 'momentra_auth_session';
const EVENT_NAME = 'momentra-user-updated';

export const DEFAULT_SYSADMIN: CurrentUser = {
  id: 'sysadmin-1',
  fullName: 'สำราญ ศักดี',
  email: 'samran@momentra.app',
  username: 'samran',
  role: 'sysadmin',
  avatarUrl: null,
  hasPassword: true,
  lastPasswordChangedAt: '2026-01-15T08:00:00Z',
};

export function getCurrentUser(): CurrentUser {
  if (typeof window === 'undefined') return DEFAULT_SYSADMIN;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CurrentUser) : DEFAULT_SYSADMIN;
  } catch {
    return DEFAULT_SYSADMIN;
  }
}

export function saveCurrentUser(updates: Partial<CurrentUser>): CurrentUser {
  const current = getCurrentUser();
  const merged: CurrentUser = { ...current, ...updates };
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: merged }));
  }
  return merged;
}

export function isSysAdmin(): boolean {
  return getCurrentUser().role === 'sysadmin';
}

export function getPlatformUsers(): PlatformUser[] {
  if (typeof window === 'undefined') return INITIAL_PLATFORM_USERS;
  try {
    const raw = localStorage.getItem(PLATFORM_USERS_KEY);
    if (!raw) {
      localStorage.setItem(PLATFORM_USERS_KEY, JSON.stringify(INITIAL_PLATFORM_USERS));
      return INITIAL_PLATFORM_USERS;
    }
    return JSON.parse(raw) as PlatformUser[];
  } catch {
    return INITIAL_PLATFORM_USERS;
  }
}

export function savePlatformUsers(users: PlatformUser[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PLATFORM_USERS_KEY, JSON.stringify(users));
  }
}

export function createPlatformUser(user: Omit<PlatformUser, 'id' | 'joinedAt'>): PlatformUser {
  const list = getPlatformUsers();
  const newUser: PlatformUser = {
    ...user,
    id: `user-${Date.now()}`,
    joinedAt: new Date().toISOString(),
  };
  const updated = [newUser, ...list];
  savePlatformUsers(updated);
  return newUser;
}

export function togglePlatformUserStatus(userId: string): void {
  const list = getPlatformUsers();
  const updated = list.map((u) =>
    u.id === userId ? { ...u, status: (u.status === 'active' ? 'suspended' : 'active') as 'active' | 'suspended' } : u
  );
  savePlatformUsers(updated);
}

export function adminResetUserPassword(_userId: string, _newPass: string): void {
  // Record admin password reset
}

export function updateCurrentUserPassword(_newPass: string): void {
  saveCurrentUser({
    hasPassword: true,
    lastPasswordChangedAt: new Date().toISOString(),
  });
}

export function loginUser(identifier: string, _password: string): { success: boolean } {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_TOKEN_KEY, 'active_sysadmin_session');
    if (identifier.includes('samran')) {
      saveCurrentUser(DEFAULT_SYSADMIN);
    } else {
      saveCurrentUser({
        username: identifier.split('@')[0],
        email: identifier.includes('@') ? identifier : `${identifier}@momentra.app`,
        role: 'owner',
      });
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
  return () => window.removeEventListener(EVENT_NAME, handler);
}
