import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/app-shell';

export const metadata: Metadata = {
  title: 'Momentra — Historical Digital Asset Management (HDAM)',
  description: 'ระบบบริหารจัดการสินทรัพย์ดิจิทัลและจดหมายเหตุประวัติศาสตร์ตามวันเวลาจริง',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-slate-50 antialiased text-slate-900">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
