'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HubIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/hub/profile');
  }, [router]);

  return null;
}
