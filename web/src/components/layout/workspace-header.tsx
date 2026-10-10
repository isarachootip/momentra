'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Landmark, Building2, ChevronDown } from 'lucide-react';
import { getCurrentUser, subscribeToUser, logoutUser, type CurrentUser } from '@/lib/user-store';
import { UserDropdownMenu } from './user-dropdown-menu';
import { ChangePasswordModal } from './change-password-modal';

interface WorkspaceHeaderProps {
  currentWorkspace?: string;
}

export function WorkspaceHeader({
  currentWorkspace = 'หอจดหมายเหตุประวัติศาสตร์และวัฒนธรรมไทย',
}: WorkspaceHeaderProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser>(getCurrentUser());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    const unsubscribe = subscribeToUser((updated) => {
      setCurrentUser(updated);
    });
    return unsubscribe;
  }, []);

  const handleLogout = () => {
    logoutUser();
    router.push('/login');
  };

  const initial = currentUser.fullName ? currentUser.fullName.charAt(0) : 'ส';

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-900 text-white shadow-xs">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-slate-900">Momentra</span>
                <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-800">
                  HDAM
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Historical Digital Asset Management</p>
            </div>
          </div>

          {/* Workspace Switcher & User Profile */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
              <Building2 className="h-4 w-4 text-rose-800" />
              <span className="font-semibold max-w-[220px] truncate">{currentWorkspace}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </div>

            {/* User Profile with Dropdown Trigger */}
            <div className="relative pl-2 border-l border-slate-200">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-slate-50 transition-colors text-left focus:outline-hidden"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-900 font-bold text-xs border border-rose-200 shrink-0">
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.fullName}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    initial
                  )}
                </div>
                <div className="hidden md:block text-left text-xs">
                  <div className="font-semibold text-slate-800 leading-tight">{currentUser.fullName}</div>
                  <div className="text-[11px] text-slate-500 leading-tight">{currentUser.email}</div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
              </button>

              <UserDropdownMenu
                user={currentUser}
                isOpen={isDropdownOpen}
                onClose={() => setIsDropdownOpen(false)}
                onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </div>
      </header>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </>
  );
}
