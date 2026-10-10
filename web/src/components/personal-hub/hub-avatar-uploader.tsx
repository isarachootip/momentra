'use client';

import React, { useState, useRef } from 'react';
import { Camera, Upload, Link2, Trash2, AlertCircle, Image as ImageIcon } from 'lucide-react';

interface HubAvatarUploaderProps {
  avatarUrl: string;
  onChange: (url: string) => void;
}

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function HubAvatarUploader({ avatarUrl, onChange }: HubAvatarUploaderProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setErrorMessage(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMessage('รองรับเฉพาะไฟล์รูปภาพ JPG, PNG, WebP หรือ GIF เท่านั้น');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(
        `ขนาดไฟล์ต้องไม่เกิน ${MAX_FILE_SIZE_MB}MB (ไฟล์ปัจจุบัน: ${(file.size / (1024 * 1024)).toFixed(1)}MB)`
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        onChange(result);
      }
    };
    reader.onerror = () => {
      setErrorMessage('ไม่สามารถอ่านไฟล์ภาพได้ กรุณาลองใหม่อีกครั้ง');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    onChange('');
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
        รูปโปรไฟล์ (Avatar Profile Picture)
      </label>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-800 border border-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Avatar Preview */}
          <div className="relative group shrink-0">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full ring-4 ring-white shadow-md overflow-hidden bg-slate-200 flex items-center justify-center">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar Preview"
                  className="h-full w-full object-cover"
                  onError={() => setErrorMessage('ไม่สามารถโหลดภาพจาก URL ได้')}
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-slate-400" />
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveTab('upload');
                fileInputRef.current?.click();
              }}
              className="absolute bottom-0 right-0 p-1.5 rounded-full bg-rose-900 text-white shadow-md hover:bg-rose-800 transition-colors"
              title="เปลี่ยนรูปภาพ"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Controls & Methods */}
          <div className="flex-1 w-full space-y-3">
            {/* Tabs: Upload File vs Image URL */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-200/70 p-1 w-fit">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  activeTab === 'upload'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                อัปโหลดไฟล์จากเครื่อง
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('url')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  activeTab === 'url'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Link2 className="h-3.5 w-3.5" />
                ระบุ URL รูปภาพ
              </button>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept={ALLOWED_TYPES.join(',')}
              className="hidden"
            />

            {activeTab === 'upload' ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                  isDragOver
                    ? 'border-rose-800 bg-rose-50/50'
                    : 'border-slate-300 hover:border-slate-400 bg-white'
                }`}
              >
                <Upload className="h-5 w-5 text-slate-400 mb-1" />
                <p className="text-xs font-semibold text-slate-700">
                  คลิกเพื่อเลือกไฟล์ หรือลากไฟล์ภาพมาวางที่นี่
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  รองรับ JPG, PNG, WebP ขนาดไม่เกิน {MAX_FILE_SIZE_MB}MB
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => {
                    setErrorMessage(null);
                    onChange(e.target.value);
                  }}
                  placeholder="https://example.com/my-photo.jpg"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-rose-800 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400">
                  วางลิงก์รูปภาพสาธารณะ เช่น จาก Unsplash หรือ Cloud Storage
                </p>
              </div>
            )}

            {avatarUrl && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleRemove}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  นำรูปภาพออก
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
