'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Plus, ExternalLink, Edit, Trash2, Eye, Flame, Heart, Star, Copy } from 'lucide-react';
import Link from 'next/link';

interface ContentPage {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: string;
  views: number;
  fireCount: number;
  heartCount: number;
  starCount: number;
  updatedAt: string;
  _count?: { comments: number };
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function suggestedCopySlug(slug: string) {
  return slug.replace(/-copy(-\d+)?$/, '') + '-copy';
}

export default function ContentPagesPage() {
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/content-pages');
      if (res.ok) setPages(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPages(); }, []);

  const handleDuplicate = async (id: string, title: string, currentSlug: string) => {
    if (!confirm(`Duplicate "${title}"? A draft copy will be created.`)) return;

    const suggested = suggestedCopySlug(currentSlug);
    const entered = prompt('Optional: enter slug for the duplicate page (leave blank for auto)', suggested);
    if (entered === null) return;

    const cleanedSlug = slugify(entered);
    if (entered.trim() && !cleanedSlug) {
      alert('Invalid slug. Use letters, numbers, spaces, or hyphens.');
      return;
    }

    setDuplicating(id);
    try {
      const res = await fetch(`/api/content-pages/${id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: cleanedSlug || undefined }),
      });
      if (res.ok) {
        const newPage = await res.json();
        setPages(p => [newPage, ...p]);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Could not duplicate page');
      }
    } finally {
      setDuplicating(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/content-pages/${id}`, { method: 'DELETE' });
      if (res.ok) setPages(p => p.filter(x => x.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Content Pages</h1>
            <p className="text-slate-400 text-sm mt-1">
              Build embeddable pages with custom HTML, reactions, and comments.
            </p>
          </div>
          <Link href="/dashboard/content-pages/new">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Plus className="h-4 w-4" /> New Page
            </Button>
          </Link>
        </div>

        {/* Table */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">Loading…</div>
          ) : pages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <p>No content pages yet.</p>
              <Link href="/dashboard/content-pages/new">
                <Button variant="outline" size="sm" className="gap-2 border-slate-600 text-slate-300 hover:text-white">
                  <Plus className="h-4 w-4" /> Create your first page
                </Button>
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm text-slate-200">
              <thead>
                <tr className="bg-slate-700/50 text-slate-400 text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-3">Title</th>
                  <th className="text-left px-4 py-3">Slug</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-center px-4 py-3"><Eye className="h-3.5 w-3.5 inline" /></th>
                  <th className="text-center px-4 py-3"><Flame className="h-3.5 w-3.5 inline text-orange-400" /></th>
                  <th className="text-center px-4 py-3"><Heart className="h-3.5 w-3.5 inline text-pink-400" /></th>
                  <th className="text-center px-4 py-3"><Star className="h-3.5 w-3.5 inline text-yellow-400" /></th>
                  <th className="text-center px-4 py-3">Comments</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {pages.map(page => (
                  <tr key={page.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{page.title}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{page.slug}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        page.status === 'published'
                          ? 'bg-green-900/50 text-green-300 border border-green-700/50'
                          : 'bg-slate-700 text-slate-400 border border-slate-600'
                      }`}>
                        {page.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-400">{page.views}</td>
                    <td className="px-4 py-3 text-center text-orange-300">{page.fireCount}</td>
                    <td className="px-4 py-3 text-center text-pink-300">{page.heartCount}</td>
                    <td className="px-4 py-3 text-center text-yellow-300">{page.starCount}</td>
                    <td className="px-4 py-3 text-center text-slate-400">{page._count?.comments ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/c/${page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
                          title="View public page"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <Link
                          href={`/dashboard/content-pages/${page.id}`}
                          className="p-1.5 rounded hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDuplicate(page.id, page.title, page.slug)}
                          disabled={duplicating === page.id}
                          className="p-1.5 rounded hover:bg-slate-600 text-slate-400 hover:text-indigo-400 transition-colors disabled:opacity-40"
                          title="Duplicate"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(page.id, page.title)}
                          disabled={deleting === page.id}
                          className="p-1.5 rounded hover:bg-red-900/40 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-40"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
