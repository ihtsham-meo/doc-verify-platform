'use client';

import { forwardRef, InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label:  string;
  error?: string;
  hint?:  string;
}

const FormInput = forwardRef<HTMLInputElement, Props>(
  ({ label, error, hint, ...props }, ref) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
        {label}
      </label>
      <input
        ref={ref}
        {...props}
        className="input-base"
        style={{
          borderColor: error ? 'var(--red)' : undefined,
          ...props.style,
        }}
      />
      {error && (
        <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>{error}</p>
      )}
      {hint && !error && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{hint}</p>
      )}
    </div>
  )
);

FormInput.displayName = 'FormInput';
export default FormInput;