'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth }  from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { isDark, toggleTheme }   = useTheme();
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  return (
    <nav style={{
      background:   'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      boxShadow:    'var(--shadow)',
      position:     'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{
        maxWidth: 1200,
        margin:   '0 auto',
        padding:  '0 1.5rem',
        height:   64,
        display:  'flex',
        alignItems:      'center',
        justifyContent:  'space-between',
      }}>

        {/* Logo */}
        <Link href={user ? '/dashboard' : '/login'} style={{
          display:    'flex',
          alignItems: 'center',
          gap:        8,
          textDecoration: 'none',
        }}>
          <div style={{
            width: 34, height: 34,
            background:   'var(--accent)',
            borderRadius: 10,
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'center',
          }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>
            DocVerify
          </span>
        </Link>

        {/* Nav links — only when logged in */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {[
              { href: '/dashboard', label: 'Dashboard' },
              { href: '/upload',    label: 'Upload'    },
              { href: '/verify',    label: 'Verify'    },
              ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
            ].map(({ href, label }) => (
              <Link key={href} href={href} style={{
                padding:       '6px 14px',
                borderRadius:  8,
                fontSize:      14,
                fontWeight:    500,
                textDecoration:'none',
                color:         isActive(href) ? 'var(--accent)'       : 'var(--text-secondary)',
                background:    isActive(href) ? 'var(--accent-light)'  : 'transparent',
                transition:    'background 0.15s, color 0.15s',
              }}>
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Right side: theme toggle + user */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

          {/* Dark/light toggle — matches the moon icon in the image */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              width:        38,
              height:       38,
              borderRadius: 10,
              border:       '1px solid var(--border)',
              background:   'var(--bg-input)',
              cursor:       'pointer',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              color:        'var(--text-secondary)',
              fontSize:     17,
              transition:   'background 0.15s, border-color 0.15s',
            }}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {user.email}
                </p>
                <p style={{ fontSize: 11, color: 'var(--accent)', margin: 0, textTransform: 'capitalize' }}>
                  {user.role}
                </p>
              </div>
              <button onClick={logout} className="btn-secondary" style={{ fontSize: 13, padding: '6px 14px' }}>
                Logout
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-primary" style={{
              fontSize: 14, padding: '8px 20px', textDecoration: 'none',
            }}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}