'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const pathname = usePathname();

  const linkClass = (href: string) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      pathname === href
        ? 'bg-blue-700 text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`;

  if (!user) return null;

  return (
    <nav className="bg-gray-900 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <span className="text-white font-semibold text-lg">DocVerify</span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            <Link href="/dashboard" className={linkClass('/dashboard')}>
              Dashboard
            </Link>
            <Link href="/upload" className={linkClass('/upload')}>
              Upload
            </Link>
            <Link href="/verify" className={linkClass('/verify')}>
              Verify
            </Link>
            {isAdmin && (
              <Link href="/admin" className={linkClass('/admin')}>
                Admin
              </Link>
            )}
          </div>

          {/* User info + logout */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-white text-sm font-medium">{user.email}</p>
              <p className="text-gray-400 text-xs capitalize">{user.role}</p>
            </div>
            <button
              onClick={logout}
              className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-2 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}