'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const role = user.role;
        if (role === 'super_admin' || role === 'management') {
          router.push('/dashboard/management');
        } else if (role === 'operations') {
          router.push('/dashboard/ops');
        } else if (role === 'accounting') {
          router.push('/dashboard/accounting');
        } else if (role === 'instructor') {
          router.push('/dashboard/instructor');
        }
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">MV-OS</h1>
        <p className="text-xl mb-4">MindValley Operating System</p>
        <p className="text-gray-600">Education & Operations Management System</p>
        <div className="mt-8">
          <p className="text-sm text-gray-500">Redirecting...</p>
        </div>
      </div>
    </main>
  );
}

