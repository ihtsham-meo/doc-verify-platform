'use client';

type Variant = 'error' | 'success' | 'warning' | 'info';

interface Props {
  variant:  Variant;
  message:  string;
  onClose?: () => void;
}

const variantStyles: Record<Variant, { bg: string; border: string; color: string; icon: string }> = {
  error:   { bg: 'var(--red-bg)',        border: 'var(--red)',        color: 'var(--red)',    icon: '✕' },
  success: { bg: 'var(--accent-light)',  border: 'var(--accent)',     color: 'var(--accent)', icon: '✓' },
  warning: { bg: 'var(--amber-bg)',      border: 'var(--amber)',      color: 'var(--amber)',  icon: '⚠' },
  info:    { bg: 'var(--blue-bg)',       border: 'var(--blue)',       color: 'var(--blue)',   icon: 'ℹ' },
};

export default function Alert({ variant, message, onClose }: Props) {
  const s = variantStyles[variant];
  return (
    <div style={{
      display:      'flex',
      alignItems:   'flex-start',
      gap:          10,
      padding:      '12px 16px',
      borderRadius: 10,
      border:       `1px solid ${s.border}`,
      background:   s.bg,
      fontSize:     14,
    }}>
      <span style={{ color: s.color, fontWeight: 700, marginTop: 1, flexShrink: 0 }}>{s.icon}</span>
      <p style={{ flex: 1, margin: 0, color: 'var(--text-primary)' }}>{message}</p>
      {onClose && (
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', fontSize: 14, flexShrink: 0,
        }}>✕</button>
      )}
    </div>
  );
}