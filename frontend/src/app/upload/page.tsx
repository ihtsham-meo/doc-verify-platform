'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { hashFile, formatDate } from '@/lib/hashFile';
import FileDropzone  from '@/components/FileDropzone';
import FilePreview   from '@/components/FilePreview';
import HashDisplay   from '@/components/HashDisplay';
import Alert         from '@/components/Alert';
import axios         from 'axios';

type UploadState = 'idle' | 'hashing' | 'ready' | 'uploading' | 'success' | 'error';

interface UploadResult {
  id:         string;
  fileName:   string;
  fileHash:   string;
  fileSize:   number;
  uploadedAt: string;
}

export default function UploadPage() {
  const [file,        setFile]        = useState<File | null>(null);
  const [hash,        setHash]        = useState('');
  const [state,       setState]       = useState<UploadState>('idle');
  const [progress,    setProgress]    = useState(0);
  const [result,      setResult]      = useState<UploadResult | null>(null);
  const [errorMsg,    setErrorMsg]    = useState('');

  // Auto-hash whenever a file is selected
  useEffect(() => {
    if (!file) { setHash(''); setState('idle'); setErrorMsg(''); return; }
    const compute = async () => {
      setState('hashing');
      try {
        const h = await hashFile(file);
        setHash(h);
        setState('ready');
      } catch (err){
        console.error("Hashing error: ", err);
        setErrorMsg('Failed to compute file hash.');
        setState('error');
      }
    };
    compute();
  }, [file]);

  const handleClear = () => {
    setFile(null);
    setHash('');
    setState('idle');
    setResult(null);
    setErrorMsg('');
    setProgress(0);
  };

  const handleUpload = async () => {
    if (!file || !hash) return;
    setState('uploading');
    setProgress(0);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('file',       file);
      formData.append('clientHash', hash);

      const { data } = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded * 100) / e.total));
        },
      });

      setResult(data.document);
      setState('success');

    } catch (err) {
      if (axios.isAxiosError(err)) {
        setErrorMsg(err.response?.data?.error || 'Upload failed. Please try again.');
      } else {
        setErrorMsg('Something went wrong. Please try again.');
      }
      setState('error');
    }
  };

  // ── Success screen ──────────────────────────────────────────
  if (state === 'success' && result) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-900/40 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Upload successful</h2>
          <p className="text-gray-400 text-sm mb-6">Your document has been securely stored.</p>

          <div className="text-left space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">File name</span>
              <span className="text-white font-medium">{result.fileName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Uploaded at</span>
              <span className="text-white">{formatDate(result.uploadedAt)}</span>
            </div>
            <div className="border-t border-gray-700 pt-3">
              <HashDisplay hash={result.fileHash} label="Stored SHA256 hash" />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClear}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              Upload another
            </button>
            <Link
              href="/verify"
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors text-center"
            >
              Verify a document →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main upload form ────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Upload Document</h1>
        <p className="text-gray-400 text-sm mt-1">
          A SHA256 hash is computed locally and verified server-side on upload.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 flex flex-col gap-6">

        {/* Error alert */}
        {state === 'error' && errorMsg && (
          <Alert variant="error" message={errorMsg} onClose={handleClear} />
        )}

        {/* Step 1 — File selection */}
        <div>
          <p className="text-sm font-medium text-gray-300 mb-3">
            <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 rounded-full text-xs mr-2">1</span>
            Select a file
          </p>

          {!file ? (
            <FileDropzone
              onFileSelect={setFile}
              disabled={state === 'uploading'}
            />
          ) : (
            <FilePreview
              file={file}
              onClear={handleClear}
              disabled={state === 'uploading'}
            />
          )}
        </div>

        {/* Step 2 — Hash preview */}
        <div>
          <p className="text-sm font-medium text-gray-300 mb-3">
            <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 rounded-full text-xs mr-2">2</span>
            Client-side SHA256 hash
          </p>
          <HashDisplay
            hash={hash}
            loading={state === 'hashing'}
            label="Computed locally before upload"
          />
          {hash && (
            <p className="text-xs text-gray-500 mt-2">
              This hash is sent with the file. The server recalculates and compares it to detect any tampering in transit.
            </p>
          )}
        </div>

        {/* Step 3 — Upload button + progress */}
        <div>
          <p className="text-sm font-medium text-gray-300 mb-3">
            <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 rounded-full text-xs mr-2">3</span>
            Upload securely
          </p>

          {state === 'uploading' && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>Uploading…</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={state !== 'ready'}
            className="
              w-full bg-blue-600 hover:bg-blue-500
              disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed
              text-white font-medium py-3 rounded-xl transition-colors
              flex items-center justify-center gap-2
            "
          >
            {state === 'uploading' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading…
              </>
            ) : state === 'hashing' ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Computing hash…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                {state === 'ready' ? 'Upload document' : 'Select a file to continue'}
              </>
            )}
          </button>
        </div>

        {/* Info footer */}
        <div className="border-t border-gray-800 pt-4 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: '🔒', label: 'End-to-end hashed' },
            { icon: '📁', label: 'PDF, PNG, JPG only' },
            { icon: '⚖️', label: 'Max 5MB per file' },
          ].map((i) => (
            <div key={i.label}>
              <p className="text-lg">{i.icon}</p>
              <p className="text-gray-500 text-xs mt-1">{i.label}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}