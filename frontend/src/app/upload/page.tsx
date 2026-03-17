'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { hashFile, formatDate } from '@/lib/hashFile';
import FileDropzone from '@/components/FileDropzone';
import FilePreview from '@/components/FilePreview';
import HashDisplay from '@/components/HashDisplay';
import Alert from '@/components/Alert';
import axios from 'axios';

type UploadState = 'idle' | 'hashing' | 'ready' | 'uploading' | 'success' | 'error';

interface UploadResult {
    id: string; fileName: string; fileHash: string; fileSize: number; uploadedAt: string;
}

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [hash, setHash] = useState('');
    const [state, setState] = useState<UploadState>('idle');
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<UploadResult | null>(null);
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

    const handleClear = () => {
        setFile(null); setHash(''); setState('idle');
        setResult(null); setErrorMsg(''); setProgress(0);
    };

    const handleUpload = async () => {
        if (!file || !hash) return;
        setState('uploading'); setProgress(0); setErrorMsg('');
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('clientHash', hash);
            const { data } = await api.post('/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (e) => { if (e.total) setProgress(Math.round((e.loaded * 100) / e.total)); },
            });
            setResult(data.document); setState('success');
        } catch (err) {
            if (axios.isAxiosError(err)) setErrorMsg(err.response?.data?.error || 'Upload failed.');
            else setErrorMsg('Something went wrong.');
            setState('error');
        }
    };

    // ── Success ────────────────────────────────────────────────
    if (state === 'success' && result) return (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 64, height: 64, background: 'var(--accent-light)', borderRadius: '50%', marginBottom: 16,
                }}>
                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                    Upload successful
                </h2>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 24px' }}>
                    Your document has been securely stored.
                </p>

                <div style={{ textAlign: 'left', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                        { label: 'File name', value: result.fileName },
                        { label: 'Uploaded at', value: formatDate(result.uploadedAt) },
                    ].map((r) => (
                        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                            <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r.value}</span>
                        </div>
                    ))}
                    <HashDisplay hash={result.fileHash} label="Stored SHA256 hash" />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={handleClear} className="btn-secondary" style={{ flex: 1, padding: 12 }}>
                        Upload another
                    </button>
                    <Link href="/verify" className="btn-primary" style={{
                        flex: 1, padding: 12, textDecoration: 'none', textAlign: 'center',
                    }}>
                        Verify a document →
                    </Link>
                </div>
            </div>
        </div>
    );

    // ── Main form ──────────────────────────────────────────────
    return (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                    Upload Document
                </h1>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
                    A SHA256 hash is computed locally and verified server-side on upload.
                </p>
            </div>

            <div className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 28 }}>

                {state === 'error' && errorMsg && (
                    <Alert variant="error" message={errorMsg} onClose={handleClear} />
                )}

                {/* Step 1 */}
                <div>
                    <StepLabel n={1} text="Select a file" />
                    {!file
                        ? <FileDropzone onFileSelect={setFile} disabled={state === 'uploading'} />
                        : <FilePreview file={file} onClear={handleClear} disabled={state === 'uploading'} />
                    }
                </div>

                {/* Step 2 */}
                <div>
                    <StepLabel n={2} text="Client-side SHA256 hash" />
                    <HashDisplay hash={hash} loading={state === 'hashing'} label="Computed locally before upload" />
                    {hash && (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                            Sent with the file. Server recalculates and compares to detect transit tampering.
                        </p>
                    )}
                </div>

                {/* Step 3 */}
                <div>
                    <StepLabel n={3} text="Upload securely" />

                    {state === 'uploading' && (
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                                <span>Uploading…</span><span>{progress}%</span>
                            </div>
                            <div style={{ background: 'var(--border)', borderRadius: 9999, height: 6 }}>
                                <div style={{ background: 'var(--accent)', height: 6, borderRadius: 9999, width: `${progress}%`, transition: 'width 0.2s' }} />
                            </div>
                        </div>
                    )}

                    <button onClick={handleUpload} disabled={state !== 'ready'} className="btn-primary"
                        style={{ width: '100%', padding: 14, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        {state === 'uploading' ? <><Spinner /> Uploading…</>
                            : state === 'hashing' ? <><Spinner /> Computing hash…</>
                                : state === 'ready' ? 'Upload document'
                                    : 'Select a file to continue'}
                    </button>
                </div>

                {/* Footer info */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, textAlign: 'center' }}>
                    {[
                        { icon: '🔒', label: 'End-to-end hashed' },
                        { icon: '📁', label: 'PDF, PNG, JPG only' },
                        { icon: '⚖️', label: 'Max 5MB per file' },
                    ].map((i) => (
                        <div key={i.label}>
                            <p style={{ fontSize: 20, margin: '0 0 4px' }}>{i.icon}</p>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{i.label}</p>
                        </div>
                    ))}
                </div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

const StepLabel = ({ n, text }: { n: number; text: string }) => (
    <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 12 }}>
        <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 22, height: 22, background: 'var(--accent)', borderRadius: '50%', fontSize: 11, color: '#fff', fontWeight: 700, flexShrink: 0
        }}>
            {n}
        </span>
        {text}
    </p>
);

const Spinner = () => (
    <div style={{
        width: 16, height: 16, border: '2px solid rgba(255,255,255,0.35)',
        borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0
    }} />
);