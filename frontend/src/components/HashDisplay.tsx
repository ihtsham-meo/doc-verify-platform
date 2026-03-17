'use client';

import { useState } from 'react';

interface Props { hash: string; label?: string; loading?: boolean; }

export default function HashDisplay({ hash, label = 'SHA256 Hash', loading = false }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      background: 'var(--bg-input)', border: '1px solid var(--border)',
      borderRadius: 10, padding: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
        {!loading && hash && (
          <button onClick={copy} style={{
            fontSize: 12, color: copied ? 'var(--accent)' : 'var(--text-muted)',
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500,
          }}>
            {copied ? '✓ Copied!' : '⎘ Copy'}
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 14, height: 14, border: '2px solid var(--border)', borderTopColor: 'var(--accent)',
            borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Computing hash…</span>
        </div>
      ) : hash ? (
        <code style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.6 }}>
          {hash}
        </code>
      ) : (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>No file selected</p>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}