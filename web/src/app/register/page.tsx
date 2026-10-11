'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Landmark, Mail, Lock, User, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import { createPlatformUser, loginUser } from '@/lib/user-store';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.toLowerCase().trim();
    if (!/^[a-z0-9_-]{3,30}$/.test(cleanUsername)) {
      setError('Username ต้องเป็นตัวพิมพ์เล็ก a-z, 0-9, _ หรือ - ความยาว 3-30 ตัวอักษร');
      return;
    }
    if (password.length < 8) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
      return;
    }
    if (password !== confirmPassword) {
      setError('รหัสผ่านยืนยันไม่ตรงกัน');
      return;
    }

    setIsLoading(true);
    try {
      createPlatformUser({
        fullName: fullName.trim(),
        email: email.trim(),
        username: cleanUsername,
        pageSlug: cleanUsername,
        pageName: `คลังประวัติศาสตร์ ${fullName.trim()}`,
        role: 'owner',
        status: 'active',
      });
      loginUser(email.trim(), password);
      router.push('/hub');
    } catch {
      setError('เกิดข้อผิดพลาดในการสมัครสมาชิก');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-slate-200">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-900 text-white shadow-md mb-3">
            <Landmark className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-black text-slate-900">สมัครสมาชิก Momentra</h1>
          <p className="text-xs text-slate-500 mt-1">
            สร้างบัญชีและเปิดหน้า Profile และคลังประวัติศาสตร์ของคุณ
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700">ชื่อ-นามสกุล</label>
            <div className="relative mt-1">
              <User className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="เช่น นพ. วัฒนา มั่นคง"
                className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-3 text-xs focus:border-rose-800 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">อีเมล (Email)</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="watthana@example.com"
                className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-3 text-xs focus:border-rose-800 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">เลือกลิงก์เพจของคุณ (Username)</label>
            <div className="mt-1 flex items-center rounded-xl border border-slate-200 overflow-hidden">
              <span className="bg-slate-50 px-3 text-xs text-slate-500 font-mono select-none">momentra.online/</span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                placeholder="watthana"
                className="w-full px-2 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showPassword ? 'ซ่อน' : 'แสดง'}
              </button>
            </div>
            <div className="relative mt-1">
              <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-3 text-xs focus:border-rose-800 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">ยืนยันรหัสผ่านอีกครั้ง</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-3 text-xs focus:border-rose-800 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-rose-900 py-2.5 text-xs font-bold text-white shadow-md hover:bg-rose-800 transition-colors"
            >
              <span>{isLoading ? 'กำลังเปิดบัญชี...' : 'สมัครสมาชิก & เปิดเพจทันที'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          มีบัญชีอยู่แล้ว?{' '}
          <Link href="/login" className="font-bold text-rose-900 hover:underline">
            เข้าสู่ระบบที่นี่
          </Link>
        </div>
      </div>
    </div>
  );
}
