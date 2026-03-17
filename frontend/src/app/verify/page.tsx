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
  status: 'VERIFIED' | 'NOT_FOUND'; verified: boolean; hash: string; message: string;
  originalName?: string; uploadedAt?: string; uploadedBy?: string;
}

export default function VerifyPage() {
  const [file,     setFile]     = useState<File | null>(null);
  const [hash,     setHash]     = useState('');
  const [state,    setState]    = useState<VerifyState>('idle');
  const [result,   setResult]   = useState<VerifyResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!file) { setHash(''); setState('idle'); return; }
    const compute = async () => {
      setState('hashing');
      try { const h = await hashFile(file); setHash(h); setState('ready'); }
      catch { setErrorMsg('Failed to compute file hash.'); setState('error'); }
    };
    compute();
  }, [file]);

  const handleClear = () => { setFile(null); setHash(''); setState('idle'); setResult(null); setErrorMsg(''); };

  const handleVerify = async () => {
    if (!file) return;
    setState('verifying'); setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post<VerifyResult>('/documents/verify', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        validateStatus: (s) => s < 500,
      });
      setResult(data);
      setState(data.verified ? 'verified' : 'modified');
    } catch (err) {
      if (axios.isAxiosError(err)) setErrorMsg(err.response?.data?.error || 'Verification failed.');
      else setErrorMsg('Something went wrong.');
      setState('error');
    }
  };

  // ── Result ─────────────────────────────────────────────────
  if (state === 'verified' || state === 'modified') {
    const ok = state === 'verified';
    return (
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="card" style={{ padding: 32 }}>

          {/* Banner */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, padding: 16,
            borderRadius: 12, marginBottom: 24,
            background: ok ? 'var(--accent-light)' : 'var(--red-bg)',
            border: `1px solid ${ok ? 'var(--accent)' : 'var(--red)'}`,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: ok ? 'var(--accent)' : 'var(--red)',
            }}>
              {ok
                ? <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                : <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              }
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 18, color: ok ? 'var(--accent-text)' : 'var(--red)', margin: '0 0 2px' }}>
                {ok ? 'Document Verified' : 'Document Not Verified'}
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>{result?.message}</p>
            </div>
          </div>

          {/* Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {ok && result && (
              <div style={{ background: 'var(--bg-input)', borderRadius: 10, padding: 16, border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 12px' }}>
                  Original upload details
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 14 }}>
                  {result.originalName && <><span style={{ color: 'var(--text-muted)' }}>File name</span><span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{result.originalName}</span></>}
                  {result.uploadedAt   && <><span style={{ color: 'var(--text-muted)' }}>Upload date</span><span style={{ color: 'var(--text-primary)' }}>{formatDate(result.uploadedAt)}</span></>}
                  {result.uploadedBy   && <><span style={{ color: 'var(--text-muted)' }}>Uploader ID</span><span style={{ color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: 12 }}>{result.uploadedBy.slice(0,8)}…</span></>}
                </div>
              </div>
            )}
            <HashDisplay hash={hash} label={ok ? 'Matched hash (SHA256)' : 'Computed hash — no match found'} />
            {!ok && <Alert variant="warning" message="This file has no matching record. It may have been modified or was never uploaded to this system." />}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button onClick={handleClear} className="btn-secondary" style={{ flex: 1, padding: 12 }}>
              Verify another
            </button>
            {!ok && (
              <Link href="/upload" className="btn-primary" style={{ flex: 1, padding: 12, textDecoration: 'none', textAlign: 'center' }}>
                Upload this document →
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ──────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>Verify Document</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
          Upload a file to check if it matches an original record in the system.
        </p>
      </div>

      <div className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 28 }}>
        {state === 'error' && errorMsg && <Alert variant="error" message={errorMsg} onClose={handleClear} />}

        <div>
          <StepLabel n={1} text="Select the file to verify" />
          {!file
            ? <FileDropzone onFileSelect={setFile} disabled={state === 'verifying'} label="Drop the file you want to verify" />
            : <FilePreview file={file} onClear={handleClear} disabled={state === 'verifying'} />
          }
        </div>

        <div>
          <StepLabel n={2} text="Computed hash" />
          <HashDisplay hash={hash} loading={state === 'hashing'} label="SHA256 — computed locally" />
        </div>

        <div>
          <StepLabel n={3} text="Check against records" />
          <button onClick={handleVerify} disabled={state !== 'ready'} className="btn-primary"
            style={{ width: '100%', padding: 14, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {state === 'verifying' ? <><Spinner /> Verifying…</> : state === 'ready' ? 'Verify document' : 'Select a file to continue'}
          </button>
        </div>

        {/* How it works */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            How verification works
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {[
              'SHA256 computed locally',
              'Hash sent to server',
              'Compared against stored records',
            ].map((text, i) => (
              <div key={i} style={{ background: 'var(--accent-light)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <div style={{ width: 24, height: 24, background: 'var(--accent)', borderRadius: '50%', color: '#fff',
                  fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                  {i + 1}
                </div>
                <p style={{ fontSize: 12, color: 'var(--accent-text)', margin: 0 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const StepLabel = ({ n, text }: { n: number; text: string }) => (
  <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 12 }}>
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 22, height: 22, background: 'var(--accent)', borderRadius: '50%', fontSize: 11, color: '#fff', fontWeight: 700, flexShrink: 0 }}>
      {n}
    </span>
    {text}
  </p>
);

const Spinner = () => (
  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.35)',
    borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
);