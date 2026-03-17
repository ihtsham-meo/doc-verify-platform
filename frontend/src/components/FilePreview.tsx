'use client';

import { formatFileSize } from '@/lib/hashFile';

interface Props { file: File; onClear: () => void; disabled?: boolean; }

const mimeLabel: Record<string, string> = {
  'application/pdf': 'PDF', 'image/png': 'PNG', 'image/jpeg': 'JPG',
};
const mimeColor: Record<string, { bg: string; color: string }> = {
  'application/pdf': { bg: '#fee2e2', color: '#dc2626' },
  'image/png':       { bg: '#dbeafe', color: '#2563eb' },
  'image/jpeg':      { bg: '#fef3c7', color: '#d97706' },
};

export default function FilePreview({ file, onClear, disabled }: Props) {
  const colors = mimeColor[file.type] ?? { bg: 'var(--border)', color: 'var(--text-muted)' };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      background: 'var(--bg-input)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '12px 16px',
    }}>
      <div style={{
        flexShrink: 0, width: 40, height: 40, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, background: colors.bg, color: colors.color,
      }}>
        {mimeLabel[file.type] ?? 'FILE'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 2px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {file.name}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
          {formatFileSize(file.size)} · {file.type}
        </p>
      </div>
      {!disabled && (
        <button onClick={onClear} style={{
          flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 18, color: 'var(--text-muted)', lineHeight: 1,
          transition: 'color 0.15s',
        }} title="Remove file">✕</button>
      )}
    </div>
  );
}