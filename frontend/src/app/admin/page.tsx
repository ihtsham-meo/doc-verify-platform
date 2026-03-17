'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import Alert from '@/components/Alert';
import { formatFileSize, formatDate } from '@/lib/hashFile';
import axios from 'axios';

interface Doc {
  id: string; fileName: string; fileHash: string; fileSize: number;
  mimeType: string; uploadedAt: string; uploaderEmail: string;
}
interface Stats {
  totalDocuments: number; totalUsers: number; totalSize: number;
  recentUploads: number; byMimeType: Record<string, number>;
}
interface User { id: string; email: string; role: string; createdAt: string; }
type Tab = 'documents' | 'users';

export default function AdminPage() {
  const [docs,      setDocs]      = useState<Doc[]>([]);
  const [users,     setUsers]     = useState<User[]>([]);
  const [stats,     setStats]     = useState<Stats | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [search,    setSearch]    = useState('');
  const [searching, setSearching] = useState(false);
  const [deleting,  setDeleting]  = useState<string | null>(null);
  const [tab,       setTab]       = useState<Tab>('documents');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [docsRes, statsRes, usersRes] = await Promise.all([
        api.get('/admin/documents'),
        api.get('/admin/stats'),
        api.get('/admin/users'),
      ]);
      setDocs(docsRes.data.documents);
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users);
    } catch (err) {
      if (axios.isAxiosError(err)) setError(err.response?.data?.error || 'Failed to load admin data.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) { fetchAll(); return; }
    setSearching(true);
    try {
      const { data } = await api.get(`/admin/documents/search?q=${encodeURIComponent(search)}`);
      setDocs(data.documents);
    } catch (err) {
      if (axios.isAxiosError(err)) setError(err.response?.data?.error || 'Search failed.');
    } finally { setSearching(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this document?')) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/documents/${id}`);
      setDocs((prev) => prev.filter((d) => d.id !== id));
      if (stats) setStats({ ...stats, totalDocuments: stats.totalDocuments - 1 });
    } catch (err) {
      if (axios.isAxiosError(err)) setError(err.response?.data?.error || 'Delete failed.');
    } finally { setDeleting(null); }
  };

  const statCards = stats ? [
    { label: 'Total documents', value: stats.totalDocuments, color: 'var(--accent)'  },
    { label: 'Total users',     value: stats.totalUsers,     color: '#8b5cf6'        },
    { label: 'Storage used',    value: formatFileSize(stats.totalSize), color: 'var(--blue)' },
    { label: 'Uploads (7d)',    value: stats.recentUploads,  color: 'var(--amber)'   },
  ] : [];

  const thStyle: React.CSSProperties = {
    textAlign: 'left', padding: '12px 20px', fontSize: 11, fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.05em',
    color: 'var(--text-muted)', background: 'var(--bg-input)',
    borderBottom: '1px solid var(--border)',
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>Admin Dashboard</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Manage all documents and users</p>
        </div>
        <button onClick={fetchAll} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Refresh
        </button>
      </div>

      {error && <div style={{ marginBottom: 24 }}><Alert variant="error" message={error} onClose={() => setError('')} /></div>}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
            {statCards.map((s) => (
              <div key={s.label} className="stat-card">
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 4px' }}>{s.label}</p>
                <p style={{ fontSize: 26, fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-input)', padding: 4, borderRadius: 12, width: 'fit-content', marginBottom: 24 }}>
            {(['documents', 'users'] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500,
                border: 'none', cursor: 'pointer', textTransform: 'capitalize',
                background: tab === t ? 'var(--bg-card)' : 'transparent',
                color:      tab === t ? 'var(--accent)'  : 'var(--text-muted)',
                boxShadow:  tab === t ? 'var(--shadow)'  : 'none',
                transition: 'all 0.15s',
              }}>
                {t} ({t === 'documents' ? docs.length : users.length})
              </button>
            ))}
          </div>

          {/* Documents tab */}
          {tab === 'documents' && (
            <div className="card" style={{ overflow: 'hidden' }}>
              {/* Search */}
              <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text" value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by hash, email, or filename…"
                    className="input-base" style={{ flex: 1 }}
                  />
                  <button type="submit" disabled={searching} className="btn-primary" style={{ padding: '8px 16px', fontSize: 14 }}>
                    {searching ? 'Searching…' : 'Search'}
                  </button>
                  {search && (
                    <button type="button" onClick={() => { setSearch(''); fetchAll(); }} className="btn-secondary" style={{ padding: '8px 16px', fontSize: 14 }}>
                      Clear
                    </button>
                  )}
                </form>
              </div>

              {docs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48 }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No documents found.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>{['Document', 'Uploader', 'Hash', 'Size', 'Date', 'Action'].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {docs.map((doc) => (
                        <tr key={doc.id} className="table-row">
                          <td style={{ padding: '14px 20px' }}>
                            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 2px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.fileName}</p>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{doc.mimeType}</p>
                          </td>
                          <td style={{ padding: '14px 20px', fontSize: 14, color: 'var(--text-secondary)' }}>{doc.uploaderEmail}</td>
                          <td style={{ padding: '14px 20px' }}><span className="hash-badge">{doc.fileHash.slice(0, 12)}…</span></td>
                          <td style={{ padding: '14px 20px', fontSize: 14, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatFileSize(doc.fileSize)}</td>
                          <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(doc.uploadedAt)}</td>
                          <td style={{ padding: '14px 20px' }}>
                            <button onClick={() => handleDelete(doc.id)} disabled={deleting === doc.id}
                              style={{ fontSize: 13, fontWeight: 500, color: 'var(--red)', background: 'var(--red-bg)',
                                border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: 6, opacity: deleting === doc.id ? 0.5 : 1 }}>
                              {deleting === doc.id ? 'Deleting…' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Users tab */}
          {tab === 'users' && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['Email', 'Role', 'Joined', 'ID'].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="table-row">
                      <td style={{ padding: '14px 20px', fontSize: 14, color: 'var(--text-primary)' }}>{u.email}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 9999,
                          background: u.role === 'admin' ? '#ede9fe' : 'var(--accent-light)',
                          color:      u.role === 'admin' ? '#7c3aed'  : 'var(--accent-text)',
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(u.createdAt)}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <code style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{u.id.slice(0, 8)}…</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}