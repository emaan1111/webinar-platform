'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Flame, Heart, Star, Share2, Copy, MessageCircle, Send, Check } from 'lucide-react';

interface ContentPage {
  id: string;
  title: string;
  description: string | null;
  htmlContent: string;
  fireCount: number;
  heartCount: number;
  starCount: number;
}

interface Comment {
  id: string;
  name: string;
  text: string;
  createdAt: string;
}

type Toast = { id: number; msg: string };

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ContentPublicPage() {
  const { slug } = useParams() as { slug: string };

  const [page, setPage] = useState<ContentPage | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Reactions
  const [reactions, setReactions] = useState({ fireCount: 0, heartCount: 0, starCount: 0 });
  const [reactingTo, setReactingTo] = useState<string | null>(null);

  // Comment form
  const [cmtName, setCmtName] = useState('');
  const [cmtText, setCmtText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Toast
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((msg: string) => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);

  // Load page by slug
  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        // We need to look up by slug — create a dedicated endpoint or query via a search param
        const res = await fetch(`/api/content-pages/by-slug/${slug}`);
        if (res.status === 404) { setNotFound(true); setLoading(false); return; }
        if (!res.ok) { setLoading(false); return; }
        const data: ContentPage = await res.json();
        setPage(data);
        setReactions({ fireCount: data.fireCount, heartCount: data.heartCount, starCount: data.starCount });

        // Load comments
        const cr = await fetch(`/api/content-pages/${data.id}/comments`);
        if (cr.ok) setComments(await cr.json());

        // Track view (fire & forget)
        fetch(`/api/content-pages/${data.id}/view`, { method: 'POST' }).catch(() => {});
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const handleReact = async (type: 'fire' | 'heart' | 'star') => {
    if (!page || reactingTo) return;
    setReactingTo(type);
    // Optimistic update
    const key = `${type}Count` as keyof typeof reactions;
    setReactions(r => ({ ...r, [key]: r[key] + 1 }));
    try {
      const res = await fetch(`/api/content-pages/${page.id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (res.ok) {
        const updated = await res.json();
        setReactions(updated);
      }
    } catch {
      // Revert on failure
      setReactions(r => ({ ...r, [key]: r[key] - 1 }));
    } finally {
      setReactingTo(null);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: page?.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        showToast('Link copied to clipboard!');
      }
    } catch {
      // user cancelled share or clipboard failed
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    showToast('Link copied!');
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!page || !cmtName.trim() || !cmtText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/content-pages/${page.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cmtName.trim(), text: cmtText.trim() }),
      });
      if (res.ok) {
        const newComment: Comment = await res.json();
        setComments(c => [newComment, ...c]);
        setCmtName('');
        setCmtText('');
        showToast('Comment posted!');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">404</h1>
          <p>This page doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="flex items-center gap-2 bg-slate-700 border border-slate-600 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl animate-fade-in">
            <Check className="h-4 w-4 text-green-400 shrink-0" />
            {t.msg}
          </div>
        ))}
      </div>

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-white leading-tight">{page.title}</h1>
          {page.description && (
            <p className="mt-2 text-slate-400 text-base">{page.description}</p>
          )}
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left: content */}
          <div className="flex-1 min-w-0">
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
              <div
                className="p-6 prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: page.htmlContent }}
              />
            </div>

            {/* Reaction + Share bar */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {/* Reactions */}
              {(
                [
                  { type: 'fire' as const, icon: <Flame className="h-5 w-5" />, count: reactions.fireCount, label: 'Fire', color: 'hover:bg-orange-500/20 hover:border-orange-500/50 hover:text-orange-300 active:scale-90' },
                  { type: 'heart' as const, icon: <Heart className="h-5 w-5" />, count: reactions.heartCount, label: 'Love', color: 'hover:bg-pink-500/20 hover:border-pink-500/50 hover:text-pink-300 active:scale-90' },
                  { type: 'star' as const, icon: <Star className="h-5 w-5" />, count: reactions.starCount, label: 'Star', color: 'hover:bg-yellow-500/20 hover:border-yellow-500/50 hover:text-yellow-300 active:scale-90' },
                ] as const
              ).map(({ type, icon, count, label, color }) => (
                <button
                  key={type}
                  onClick={() => handleReact(type)}
                  disabled={!!reactingTo}
                  title={label}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium transition-all duration-200 disabled:opacity-60 ${color}`}
                >
                  {icon}
                  <span>{count}</span>
                </button>
              ))}

              <div className="flex-1" />

              {/* Share buttons */}
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm hover:bg-slate-700 hover:text-white transition-all"
              >
                <Copy className="h-4 w-4" /> Copy Link
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 border border-indigo-500 text-white text-sm font-medium hover:bg-indigo-700 transition-all"
              >
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>
          </div>

          {/* Right: comments */}
          <div className="w-full lg:w-80 xl:w-96 shrink-0">
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden sticky top-6">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50">
                <MessageCircle className="h-4 w-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-white">Comments</h2>
                <span className="ml-auto text-xs text-slate-500">{comments.length}</span>
              </div>

              {/* Comment form */}
              <form onSubmit={handleComment} className="p-4 border-b border-slate-700/50 space-y-3">
                <input
                  type="text"
                  value={cmtName}
                  onChange={e => setCmtName(e.target.value)}
                  placeholder="Your name"
                  maxLength={100}
                  className="w-full bg-slate-700/70 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <textarea
                  value={cmtText}
                  onChange={e => setCmtText(e.target.value)}
                  placeholder="Share your thoughts…"
                  maxLength={2000}
                  rows={3}
                  className="w-full bg-slate-700/70 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
                <button
                  type="submit"
                  disabled={submitting || !cmtName.trim() || !cmtText.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  {submitting ? 'Posting…' : 'Post Comment'}
                </button>
              </form>

              {/* Comment list */}
              <div className="divide-y divide-slate-700/30 max-h-[480px] overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-center py-8 text-slate-500 text-sm">No comments yet. Be the first!</p>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="px-4 py-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{c.name}</span>
                        <span className="text-xs text-slate-500">{timeAgo(c.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">{c.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
