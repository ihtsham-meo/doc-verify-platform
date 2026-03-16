'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import Alert from '@/components/Alert';
import { formatFileSize, formatDate } from '@/lib/hashFile';
import axios from 'axios';

interface Doc {
  id:            string;
  fileName:      string;
  fileHash:      string;
  fileSize:      number;
  mimeType:      string;
  uploadedAt:    string;
  uploaderEmail: string;
}

interface Stats {
  totalDocuments: number;
  totalUsers:     number;
  totalSize:      number;
  recentUploads:  number;
  byMimeType:     Record<string, number>;
}

type Tab = 'documents' | 'users';

interface User {
  id:        string;
  email:     string;
  role:      string;
  createdAt: string;
}

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
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Failed to load admin data.');
      }
    } finally {
      setLoading(false);
    }
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
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Search failed.');
      }
    } finally {
      setSearching(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this document? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/documents/${id}`);
      setDocs((prev) => prev.filter((d) => d.id !== id));
      if (stats) setStats({ ...stats, totalDocuments: stats.totalDocuments - 1 });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Delete failed.');
      }
    } finally {
      setDeleting(null);
    }
  };

  const clearSearch = () => { setSearch(''); fetchAll(); };

  // ── Stats cards ─────────────────────────────────────────────
  const statCards = stats ? [
    { label: 'Total documents', value: stats.totalDocuments, color: 'text-blue-400'  },
    { label: 'Total users',     value: stats.totalUsers,     color: 'text-purple-400' },
    { label: 'Storage used',    value: formatFileSize(stats.totalSize), color: 'text-green-400' },
    { label: 'Uploads (7d)',    value: stats.recentUploads,  color: 'text-amber-400'  },
  ] : [];

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Manage all documents and users</p>
        </div>
        <button
          onClick={fetchAll}
          className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6">
          <Alert variant="error" message={error} onClose={() => setError('')} />
        </div>
      )}

      {/* Stats row */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {statCards.map((s) => (
              <div key={s.label} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                <p className="text-gray-400 text-xs">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-800 p-1 rounded-xl w-fit mb-6">
            {(['documents', 'users'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                  tab === t
                    ? 'bg-gray-900 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {t} {t === 'documents' ? `(${docs.length})` : `(${users.length})`}
              </button>
            ))}
          </div>

          {/* Documents tab */}
          {tab === 'documents' && (
            <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">

              {/* Search bar */}
              <div className="p-4 border-b border-gray-700">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by hash, email, or filename…"
                    className="flex-1 bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
                  />
                  <button
                    type="submit"
                    disabled={searching}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm px-4 py-2.5 rounded-lg transition-colors"
                  >
                    {searching ? 'Searching…' : 'Search'}
                  </button>
                  {search && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2.5 rounded-lg transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </form>
              </div>

              {/* Documents table */}
              {docs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No documents found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-800/50 border-b border-gray-700">
                        {['Document', 'Uploader', 'Hash', 'Size', 'Date', 'Action'].map((h) => (
                          <th key={h} className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {docs.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-800/40 transition-colors">
                          <td className="px-5 py-4">
                            <p className="text-white text-sm font-medium truncate max-w-[160px]">{doc.fileName}</p>
                            <p className="text-gray-500 text-xs mt-0.5">{doc.mimeType}</p>
                          </td>
                          <td className="px-5 py-4 text-gray-300 text-sm">{doc.uploaderEmail}</td>
                          <td className="px-5 py-4">
                            <code className="text-xs text-green-400 font-mono bg-green-900/20 px-2 py-1 rounded">
                              {doc.fileHash.slice(0, 12)}…
                            </code>
                          </td>
                          <td className="px-5 py-4 text-gray-300 text-sm whitespace-nowrap">
                            {formatFileSize(doc.fileSize)}
                          </td>
                          <td className="px-5 py-4 text-gray-300 text-sm whitespace-nowrap">
                            {formatDate(doc.uploadedAt)}
                          </td>
                          <td className="px-5 py-4">
                            <button
                              onClick={() => handleDelete(doc.id)}
                              disabled={deleting === doc.id}
                              className="text-red-400 hover:text-red-300 disabled:opacity-50 text-xs font-medium transition-colors bg-red-900/20 hover:bg-red-900/40 px-3 py-1.5 rounded-lg"
                            >
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
            <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800/50 border-b border-gray-700">
                    {['Email', 'Role', 'Joined', 'ID'].map((h) => (
                      <th key={h} className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-4 text-white text-sm">{u.email}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          u.role === 'admin'
                            ? 'bg-purple-900/40 text-purple-300 border border-purple-500/30'
                            : 'bg-gray-800 text-gray-300 border border-gray-600'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-300 text-sm whitespace-nowrap">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <code className="text-xs text-gray-500 font-mono">{u.id.slice(0, 8)}…</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}