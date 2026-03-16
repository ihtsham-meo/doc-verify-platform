'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Alert from '@/components/Alert';
import api from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/hashFile';
import axios from 'axios';

interface Doc {
  id:         string;
  fileName:   string;
  fileHash:   string;
  fileSize:   number;
  mimeType:   string;
  uploadedAt: string;
}

const mimeIcon: Record<string, string> = {
  'application/pdf': '📄',
  'image/png':       '🖼',
  'image/jpeg':      '🖼',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [docs,    setDocs]    = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchDocs = useCallback(async () => {
    try {
      const { data } = await api.get('/documents');
      setDocs(data.documents);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Could not load documents.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await api.delete(`/documents/${id}`);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Delete failed.');
      }
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">

      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">My Documents</h1>
          <p className="text-gray-400 text-sm mt-1">
            Welcome back, <span className="text-white">{user?.email}</span>
          </p>
        </div>
        <Link
          href="/upload"
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span> Upload document
        </Link>
      </div>

      {error && (
        <div className="mb-6">
          <Alert variant="error" message={error} onClose={() => setError('')} />
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total documents', value: docs.length },
          { label: 'Total size',      value: formatFileSize(docs.reduce((s, d) => s + d.fileSize, 0)) },
          { label: 'Last upload',     value: docs[0] ? formatDate(docs[0].uploadedAt) : '—' },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-xs">{s.label}</p>
            <p className="text-white font-semibold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Documents table */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📂</p>
            <p className="text-gray-300 font-medium">No documents yet</p>
            <p className="text-gray-500 text-sm mt-1">Upload your first document to get started.</p>
            <Link href="/upload"
              className="inline-block mt-4 text-blue-400 hover:text-blue-300 text-sm underline">
              Upload now →
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-800/50">
                {['Document', 'Hash (SHA256)', 'Size', 'Uploaded', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {docs.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{mimeIcon[doc.mimeType] ?? '📄'}</span>
                      <span className="text-white text-sm font-medium truncate max-w-[160px]">
                        {doc.fileName}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <code className="text-xs text-green-400 font-mono bg-green-900/20 px-2 py-1 rounded">
                      {doc.fileHash.slice(0, 16)}…
                    </code>
                  </td>
                  <td className="px-5 py-4 text-gray-300 text-sm">
                    {formatFileSize(doc.fileSize)}
                  </td>
                  <td className="px-5 py-4 text-gray-300 text-sm whitespace-nowrap">
                    {formatDate(doc.uploadedAt)}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deleting === doc.id}
                      className="text-red-400 hover:text-red-300 disabled:opacity-50 text-xs font-medium transition-colors"
                    >
                      {deleting === doc.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}