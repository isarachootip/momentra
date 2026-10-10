'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Landmark, Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import { loginUser } from '@/lib/user-store';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('samran@momentra.app');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim()) {
      setError('กรุณากรอก Username หรือ Email');
      return;
    }
    if (!password) {
      setError('กรุณากรอกรหัสผ่าน');
      return;
    }

    setIsLoading(true);
    try {
      loginUser(identifier.trim(), password);
      router.push('/hub');
    } catch {
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-slate-200">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-900 text-white shadow-md mb-4">
            <Landmark className="h-7 w-7" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900">Momentra</span>
            <span className="rounded-md bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800">HDAM</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Historical Digital Asset Management</p>
          <h1 className="mt-4 text-base font-bold text-slate-800">เข้าสู่ระบบจัดการจดหมายเหตุ & Hub</h1>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Username หรือ อีเมล (Email)
            </label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="samran@momentra.app"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 focus:border-rose-800 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                รหัสผ่าน (Password)
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showPassword ? 'ซ่อน' : 'แสดง'}
              </button>
            </div>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 focus:border-rose-800 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-rose-900 py-3 text-sm font-bold text-white shadow-md hover:bg-rose-800 transition-colors disabled:opacity-50"
            >
              <span>{isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ (Sign In)'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4 border border-slate-200 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800 mb-1">
            <ShieldCheck className="h-4 w-4 text-rose-800" />
            <span>บัญชีสำหรับเจ้าของระบบ (Owner Access)</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">
            เข้าใช้งานในฐานะ <strong>คุณสำราญ ศักดี</strong> (Owner) เพื่อจัดการจดหมายเหตุ สมาชิกทีม และหน้าสาธารณะ
          </p>
        </div>
      </div>
    </div>
  );
}
