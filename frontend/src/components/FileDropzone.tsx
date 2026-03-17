'use client';

import { useRef, useState, DragEvent, ChangeEvent } from 'react';

interface Props {
  onFileSelect: (file: File) => void;
  accept?:      string;
  maxSizeMB?:   number;
  disabled?:    boolean;
  label?:       string;
}

const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];
const ALLOWED_EXTS  = ['.pdf', '.png', '.jpg', '.jpeg'];

export default function FileDropzone({
  onFileSelect, accept = '.pdf,.png,.jpg,.jpeg',
  maxSizeMB = 5, disabled = false, label = 'Drop your file here',
}: Props) {
  const inputRef             = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState('');

  const validate = (file: File): string => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_TYPES.includes(file.type) || !ALLOWED_EXTS.includes(ext))
      return 'Invalid file type. Only PDF, PNG, and JPG are allowed.';
    if (file.size > maxSizeMB * 1024 * 1024)
      return `File too large. Maximum size is ${maxSizeMB}MB.`;
    return '';
  };

  const handleFile = (file: File) => {
    const err = validate(file);
    if (err) { setFileError(err); return; }
    setFileError('');
    onFileSelect(file);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          border:        `2px dashed ${dragging ? 'var(--accent)' : 'var(--border-strong)'}`,
          borderRadius:  12,
          padding:       '40px 24px',
          textAlign:     'center',
          cursor:        disabled ? 'not-allowed' : 'pointer',
          background:    dragging ? 'var(--accent-light)' : 'var(--bg-input)',
          opacity:       disabled ? 0.5 : 1,
          transition:    'border-color 0.15s, background 0.15s',
          userSelect:    'none',
        }}
      >
        <input ref={inputRef} type="file" accept={accept} onChange={onChange} disabled={disabled} style={{ display: 'none' }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 48, height: 48, borderRadius: '50%', marginBottom: 12,
          background: dragging ? 'var(--accent)' : 'var(--border)',
          transition: 'background 0.15s',
        }}>
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24"
            stroke={dragging ? '#fff' : 'var(--text-muted)'} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
          </svg>
        </div>

        <p style={{ fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 4px', fontSize: 15 }}>{label}</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 8px' }}>
          or <span style={{ color: 'var(--accent)', fontWeight: 500 }}>browse files</span>
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
          PDF, PNG, JPG · Max {maxSizeMB}MB
        </p>
      </div>

      {fileError && (
        <p style={{ fontSize: 13, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
          <span>✕</span> {fileError}
        </p>
      )}
    </div>
  );
}