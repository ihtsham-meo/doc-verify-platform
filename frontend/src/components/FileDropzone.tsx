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
  onFileSelect,
  accept      = '.pdf,.png,.jpg,.jpeg',
  maxSizeMB   = 5,
  disabled    = false,
  label       = 'Drop your file here',
}: Props) {
  const inputRef          = useRef<HTMLInputElement>(null);
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
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-10 text-center
          transition-all cursor-pointer select-none
          ${disabled
            ? 'border-gray-700 bg-gray-800/30 cursor-not-allowed opacity-50'
            : dragging
              ? 'border-blue-400 bg-blue-900/20 scale-[1.01]'
              : 'border-gray-600 bg-gray-800/30 hover:border-blue-500 hover:bg-blue-900/10'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={onChange}
          disabled={disabled}
          className="hidden"
        />

        {/* Upload icon */}
        <div className={`
          inline-flex items-center justify-center w-12 h-12 rounded-full mb-3
          ${dragging ? 'bg-blue-600' : 'bg-gray-700'}
          transition-colors
        `}>
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        <p className="text-white font-medium">{label}</p>
        <p className="text-gray-400 text-sm mt-1">
          or <span className="text-blue-400">browse files</span>
        </p>
        <p className="text-gray-500 text-xs mt-2">
          PDF, PNG, JPG · Max {maxSizeMB}MB
        </p>
      </div>

      {fileError && (
        <p className="text-red-400 text-sm flex items-center gap-1">
          <span>✕</span> {fileError}
        </p>
      )}
    </div>
  );
}