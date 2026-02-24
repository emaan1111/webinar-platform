'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save, ExternalLink, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

function slugify(str: string) {
  return str.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
}

export default function ContentPageEditorPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [status, setStatus] = useState('draft');
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      const res = await fetch(`/api/content-pages/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTitle(data.title);
        setSlug(data.slug);
        setDescription(data.description ?? '');
        setHtmlContent(data.htmlContent);
        setStatus(data.status);
        setSlugEdited(true);
      }
      setLoading(false);
    })();
  }, [id, isNew]);

  const handleTitleChange = (v: string) => {
    setTitle(v);
    if (!slugEdited) setSlug(slugify(v));
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim() || !htmlContent.trim()) {
      alert('Title, slug, and HTML content are required.');
      return;
    }
    setSaving(true);
    try {
      const body = { title, slug, description, htmlContent, status };
      const res = await fetch(isNew ? '/api/content-pages' : `/api/content-pages/${id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const saved = await res.json();
        if (isNew) router.push(`/dashboard/content-pages/${saved.id}`);
      } else {
        const err = await res.json();
        alert(err.error || 'Save failed');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px] text-slate-400">Loading…</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full gap-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/content-pages" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold text-white">{isNew ? 'New Content Page' : 'Edit Content Page'}</h1>
          </div>
          <div className="flex items-center gap-2">
            {!isNew && (
              <a
                href={`/c/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" /> View Live
              </a>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(p => !p)}
              className="border-slate-600 text-slate-300 hover:text-white gap-1.5"
            >
              {previewMode ? <><EyeOff className="h-3.5 w-3.5" /> Edit</> : <><Eye className="h-3.5 w-3.5" /> Preview</>}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Left column: metadata */}
          <div className="xl:col-span-1 space-y-4">
            {/* Metadata card */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="My Awesome Page"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Slug *</label>
                <div className="flex rounded-lg overflow-hidden border border-slate-600 focus-within:ring-1 focus-within:ring-indigo-500">
                  <span className="px-3 py-2 bg-slate-700 text-slate-500 text-xs border-r border-slate-600 select-none whitespace-nowrap">/c/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={e => { setSlugEdited(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')); }}
                    placeholder="my-awesome-page"
                    className="flex-1 bg-slate-700 px-3 py-2 text-white text-sm font-mono placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Optional short description…"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            {/* Hints */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-2 text-xs text-slate-500">
              <p className="font-medium text-slate-400">HTML Tips</p>
              <p>• Use any HTML/CSS including embedded video iframes</p>
              <p>• Tailwind classes work inside the rendered content</p>
              <p>• Visitors can react 🔥❤️⭐ and leave comments</p>
              <p>• Views are tracked automatically on page load</p>
            </div>
          </div>

          {/* Right column: HTML editor / preview */}
          <div className="xl:col-span-2">
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden" style={{ minHeight: '520px' }}>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 border-b border-slate-700">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  {previewMode ? 'HTML Preview' : 'HTML Content'}
                </span>
                {!previewMode && (
                  <span className="ml-auto text-xs text-slate-500">{htmlContent.length} chars</span>
                )}
              </div>
              {previewMode ? (
                <div
                  className="p-4 prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              ) : (
                <textarea
                  value={htmlContent}
                  onChange={e => setHtmlContent(e.target.value)}
                  placeholder={'<h2>Welcome!</h2>\n<p>Your content here…</p>\n<iframe src="..." allow="autoplay" frameborder="0"></iframe>'}
                  className="w-full h-full bg-transparent px-4 py-3 text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none resize-none"
                  style={{ minHeight: '480px' }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
