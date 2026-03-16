'use client';

import { formatFileSize } from '@/lib/hashFile';

interface Props {
  file:     File;
  onClear:  () => void;
  disabled?: boolean;
}

const mimeLabel: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/png':       'PNG',
  'image/jpeg':      'JPEG',
};

const mimeColor: Record<string, string> = {
  'application/pdf': 'text-red-400 bg-red-900/30',
  'image/png':       'text-blue-400 bg-blue-900/30',
  'image/jpeg':      'text-yellow-400 bg-yellow-900/30',
};

export default function FilePreview({ file, onClear, disabled }: Props) {
  return (
    <div className="flex items-center gap-4 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">

      {/* File type badge */}
      <div className={`
        shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
        text-xs font-bold ${mimeColor[file.type] ?? 'text-gray-400 bg-gray-700'}
      `}>
        {mimeLabel[file.type] ?? 'FILE'}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{file.name}</p>
        <p className="text-gray-400 text-xs mt-0.5">
          {formatFileSize(file.size)} · {file.type}
        </p>
      </div>

      {/* Clear button */}
      {!disabled && (
        <button
          onClick={onClear}
          className="shrink-0 text-gray-500 hover:text-red-400 transition-colors text-lg leading-none"
          title="Remove file"
        >
          ✕
        </button>
      )}
    </div>
  );
}