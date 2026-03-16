'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { hashFile, formatDate } from '@/lib/hashFile';
import FileDropzone from '@/components/FileDropzone';
import FilePreview  from '@/components/FilePreview';
import HashDisplay  from '@/components/HashDisplay';
import Alert        from '@/components/Alert';
import axios        from 'axios';

type VerifyState = 'idle' | 'hashing' | 'ready' | 'verifying' | 'verified' | 'modified' | 'error';

interface VerifyResult {
  status:       'VERIFIED' | 'NOT_FOUND';
  verified:     boolean;
  hash:         string;
  message:      string;
  originalName?: string;
  uploadedAt?:  string;
  uploadedBy?:  string;
}

export default function VerifyPage() {
  const [file,     setFile]     = useState<File | null>(null);
  const [hash,     setHash]     = useState('');
  const [state,    setState]    = useState<VerifyState>('idle');
  const [result,   setResult]   = useState<VerifyResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-hash on file select
  useEffect(() => {
    if (!file) { setHash(''); setState('idle'); return; }
    const compute = async () => {
      setState('hashing');
      try {
        const h = await hashFile(file);
        setHash(h);
        setState('ready');
      } catch {
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
  };

  const handleVerify = async () => {
    if (!file) return;
    setState('verifying');
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await api.post<VerifyResult>('/documents/verify', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        validateStatus: (s) => s < 500, // handle 404 as data, not error
      });

      setResult(data);
      setState(data.verified ? 'verified' : 'modified');

    } catch (err) {
      if (axios.isAxiosError(err)) {
        setErrorMsg(err.response?.data?.error || 'Verification failed.');
      } else {
        setErrorMsg('Something went wrong. Please try again.');
      }
      setState('error');
    }
  };

  // ── Result screen ───────────────────────────────────────────
  if (state === 'verified' || state === 'modified') {
    const isVerified = state === 'verified';

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8">

          {/* Status banner */}
          <div className={`
            flex items-center gap-4 p-4 rounded-xl mb-6
            ${isVerified
              ? 'bg-green-900/30 border border-green-500/40'
              : 'bg-red-900/30 border border-red-500/40'
            }
          `}>
            <div className={`
              shrink-0 w-12 h-12 rounded-full flex items-center justify-center
              ${isVerified ? 'bg-green-800/60' : 'bg-red-800/60'}
            `}>
              {isVerified ? (
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div>
              <p className={`font-bold text-lg ${isVerified ? 'text-green-300' : 'text-red-300'}`}>
                {isVerified ? 'Document Verified' : 'Document Not Verified'}
              </p>
              <p className={`text-sm mt-0.5 ${isVerified ? 'text-green-400/80' : 'text-red-400/80'}`}>
                {result?.message}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            {isVerified && result && (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-medium text-gray-300">Original upload details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {result.originalName && (
                    <>
                      <span className="text-gray-400">File name</span>
                      <span className="text-white font-medium truncate">{result.originalName}</span>
                    </>
                  )}
                  {result.uploadedAt && (
                    <>
                      <span className="text-gray-400">Upload date</span>
                      <span className="text-white">{formatDate(result.uploadedAt)}</span>
                    </>
                  )}
                  {result.uploadedBy && (
                    <>
                      <span className="text-gray-400">Uploader ID</span>
                      <span className="text-white font-mono text-xs truncate">{result.uploadedBy}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Hash display */}
            <HashDisplay
              hash={hash}
              label={isVerified ? 'Matched hash (SHA256)' : 'Computed hash (SHA256) — no match found'}
            />

            {!isVerified && (
              <Alert
                variant="warning"
                message="This file has no matching record. It may have been modified or was never uploaded to this system."
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleClear}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              Verify another
            </button>
            {!isVerified && (
              <Link
                href="/upload"
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors text-center"
              >
                Upload this document →
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Main verify form ────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto">

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Verify Document</h1>
        <p className="text-gray-400 text-sm mt-1">
          Upload a file to check if it matches an original record in the system.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 flex flex-col gap-6">

        {state === 'error' && errorMsg && (
          <Alert variant="error" message={errorMsg} onClose={handleClear} />
        )}

        {/* File selection */}
        <div>
          <p className="text-sm font-medium text-gray-300 mb-3">
            <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 rounded-full text-xs mr-2">1</span>
            Select the file to verify
          </p>
          {!file ? (
            <FileDropzone
              onFileSelect={setFile}
              disabled={state === 'verifying'}
              label="Drop the file you want to verify"
            />
          ) : (
            <FilePreview file={file} onClear={handleClear} disabled={state === 'verifying'} />
          )}
        </div>

        {/* Hash preview */}
        <div>
          <p className="text-sm font-medium text-gray-300 mb-3">
            <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 rounded-full text-xs mr-2">2</span>
            Computed hash
          </p>
          <HashDisplay hash={hash} loading={state === 'hashing'} label="SHA256 — computed locally" />
        </div>

        {/* Verify button */}
        <div>
          <p className="text-sm font-medium text-gray-300 mb-3">
            <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 rounded-full text-xs mr-2">3</span>
            Check against records
          </p>

          <button
            onClick={handleVerify}
            disabled={state !== 'ready'}
            className="
              w-full bg-blue-600 hover:bg-blue-500
              disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed
              text-white font-medium py-3 rounded-xl transition-colors
              flex items-center justify-center gap-2
            "
          >
            {state === 'verifying' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                {state === 'ready' ? 'Verify document' : 'Select a file to continue'}
              </>
            )}
          </button>
        </div>

        {/* How it works */}
        <div className="border-t border-gray-800 pt-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">How verification works</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { step: '1', text: 'SHA256 hash computed locally' },
              { step: '2', text: 'Hash sent to server' },
              { step: '3', text: 'Compared against stored records' },
            ].map((s) => (
              <div key={s.step} className="bg-gray-800 rounded-lg p-3">
                <div className="w-6 h-6 bg-blue-900/60 rounded-full flex items-center justify-center text-blue-400 text-xs font-bold mx-auto mb-1.5">
                  {s.step}
                </div>
                <p className="text-gray-400 text-xs">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}