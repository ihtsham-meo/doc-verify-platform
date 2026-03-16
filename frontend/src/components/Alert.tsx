'use client';

type Variant = 'error' | 'success' | 'warning' | 'info';

interface Props {
  variant:  Variant;
  message:  string;
  onClose?: () => void;
}

const styles: Record<Variant, string> = {
  error:   'bg-red-900/40 border-red-500/50 text-red-300',
  success: 'bg-green-900/40 border-green-500/50 text-green-300',
  warning: 'bg-yellow-900/40 border-yellow-500/50 text-yellow-300',
  info:    'bg-blue-900/40 border-blue-500/50 text-blue-300',
};

const icons: Record<Variant, string> = {
  error:   '✕',
  success: '✓',
  warning: '⚠',
  info:    'ℹ',
};

export default function Alert({ variant, message, onClose }: Props) {
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm ${styles[variant]}`}>
      <span className="font-bold mt-0.5 shrink-0">{icons[variant]}</span>
      <p className="flex-1">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      )}
    </div>
  );
}