'use client';

import { useEffect, useState } from 'react';
import { HomeForeman } from '@/components/home/HomeForeman';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // デモ用に施工管理者ダッシュボードを表示
  return <HomeForeman planLevel="LITE" />;
}