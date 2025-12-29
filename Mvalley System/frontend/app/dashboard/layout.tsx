'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userStr));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  const navigation = [
    { name: 'Dashboard', href: `/dashboard/${getDashboardPath(user.role)}` },
  ];

  // Add navigation based on role
  if (['super_admin', 'operations', 'management'].includes(user.role)) {
    navigation.push(
      { name: 'Students', href: '/dashboard/students' },
      { name: 'Classes', href: '/dashboard/classes' },
      { name: 'Sessions', href: '/dashboard/sessions' },
      { name: 'Instructors', href: '/dashboard/instructors' }
    );
  }

  if (user.role === 'sales' || user.role === 'super_admin') {
    navigation.push({ name: 'Leads', href: '/dashboard/leads' });
  }

  if (user.role === 'instructor') {
    navigation.push(
      { name: 'My Classes', href: '/dashboard/classes' },
      { name: 'Sessions', href: '/dashboard/sessions' }
    );
  }

  if (['accounting', 'management', 'super_admin'].includes(user.role)) {
    navigation.push({ name: 'Finance', href: '/dashboard/finance' });
  }

  if (user.role === 'super_admin') {
    navigation.push({ name: 'Settings', href: '/dashboard/settings' });
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href={`/dashboard/${getDashboardPath(user.role)}`} className="flex items-center">
                  {!logoError ? (
                    <Image
                      src="/mindvalley-logo.png"
                      alt="MindValley"
                      width={120}
                      height={40}
                      className="object-contain"
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <h1 className="text-xl font-bold">MV-OS</h1>
                  )}
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      pathname === item.href
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700 mr-4">
                {user.firstName} {user.lastName} ({user.role})
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

function getDashboardPath(role: string): string {
  switch (role) {
    case 'super_admin':
    case 'management':
      return 'management';
    case 'operations':
      return 'ops';
    case 'accounting':
      return 'accounting';
    case 'instructor':
      return 'instructor';
    default:
      return 'management';
  }
}

