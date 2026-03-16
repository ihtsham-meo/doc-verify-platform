'use client';

import { useState } from 'react';

interface Props {
  hash:     string;
  label?:   string;
  loading?: boolean;
}

export default function HashDisplay({ hash, label = 'SHA256 Hash', loading = false }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {label}
        </span>
        {!loading && hash && (
          <button
            onClick={copy}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
          >
            {copied ? (
              <><span className="text-green-400">✓</span> Copied!</>
            ) : (
              <><span>⎘</span> Copy</>
            )}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-1">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400 text-sm">Computing hash…</span>
        </div>
      ) : hash ? (
        <code className="text-green-400 font-mono text-xs break-all leading-relaxed">
          {hash}
        </code>
      ) : (
        <p className="text-gray-600 text-sm italic">No file selected</p>
      )}
    </div>
  );
}