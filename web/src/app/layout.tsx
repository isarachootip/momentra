import type { Metadata } from 'next';
import './globals.css';
import { WorkspaceHeader } from '@/components/layout/workspace-header';
import { NavigationBar } from '@/components/layout/navigation-bar';

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
        <WorkspaceHeader />
        <NavigationBar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
