'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Alert from '@/components/Alert';
import api from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/hashFile';
import axios from 'axios';

interface Doc {
  id: string; fileName: string; fileHash: string;
  fileSize: number; mimeType: string; uploadedAt: string;
}

const mimeLabel: Record<string, string> = {
  'application/pdf': 'PDF', 'image/png': 'PNG', 'image/jpeg': 'JPG',
};
const mimeColor: Record<string, string> = {
  'application/pdf': '#ef4444', 'image/png': '#3b82f6', 'image/jpeg': '#f59e0b',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [docs,     setDocs]     = useState<Doc[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchDocs = useCallback(async () => {
    try {
      const { data } = await api.get('/documents');
      setDocs(data.documents);
    } catch (err) {
      if (axios.isAxiosError(err)) setError(err.response?.data?.error || 'Could not load documents.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await api.delete(`/documents/${id}`);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      if (axios.isAxiosError(err)) setError(err.response?.data?.error || 'Delete failed.');
    } finally { setDeleting(null); }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
            My Documents
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
            Welcome back, <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{user?.email}</span>
          </p>
        </div>
        <Link href="/upload" className="btn-primary" style={{
          textDecoration: 'none', fontSize: 14, padding: '10px 20px',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Upload document
        </Link>
      </div>

      {error && <div style={{ marginBottom: 24 }}><Alert variant="error" message={error} onClose={() => setError('')} /></div>}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total documents', value: docs.length },
          { label: 'Total size',      value: formatFileSize(docs.reduce((s, d) => s + d.fileSize, 0)) },
          { label: 'Last upload',     value: docs[0] ? formatDate(docs[0].uploadedAt) : '—' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 4px' }}>{s.label}</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)', margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
            <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : docs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px' }}>
            <p style={{ fontSize: 40, margin: '0 0 12px' }}>📂</p>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>No documents yet</p>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 16px' }}>Upload your first document to get started.</p>
            <Link href="/upload" style={{ color: 'var(--accent)', fontSize: 14, textDecoration: 'underline' }}>
              Upload now →
            </Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr className="table-header">
                {['Document', 'Hash (SHA256)', 'Size', 'Uploaded', 'Actions'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 20px', fontWeight: 600,
                    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em',
                    color: 'var(--text-muted)', background: 'var(--bg-input)',
                    borderBottom: '1px solid var(--border)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <tr key={doc.id} className="table-row">
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                        background: mimeColor[doc.mimeType] + '20',
                        color: mimeColor[doc.mimeType] ?? 'var(--text-muted)',
                      }}>
                        {mimeLabel[doc.mimeType] ?? 'FILE'}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)',
                        maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.fileName}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span className="hash-badge">{doc.fileHash.slice(0, 16)}…</span>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 14, color: 'var(--text-secondary)' }}>
                    {formatFileSize(doc.fileSize)}
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {formatDate(doc.uploadedAt)}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <button onClick={() => handleDelete(doc.id)} disabled={deleting === doc.id}
                      style={{ fontSize: 13, fontWeight: 500, color: 'var(--red)',
                        background: 'none', border: 'none', cursor: 'pointer', opacity: deleting === doc.id ? 0.5 : 1 }}>
                      {deleting === doc.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}