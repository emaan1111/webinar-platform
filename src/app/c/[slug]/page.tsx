'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Flame, Heart, Star, Share2, MessageCircle, Send, Sparkles } from 'lucide-react';

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

const AVATARS = ['🎮','✨','🛹','🌙','🦋','🎯','🌟','🎵','🦁','🌊'];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function getAvatar(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATARS[Math.abs(hash) % AVATARS.length];
}

export default function ContentPublicPage() {
  const { slug } = useParams() as { slug: string };

  const [page, setPage] = useState<ContentPage | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [reactions, setReactions] = useState({ fireCount: 0, heartCount: 0, starCount: 0 });
  const [userReaction, setUserReaction] = useState<'fire' | 'heart' | 'star' | null>(null);
  const [reactingTo, setReactingTo] = useState<string | null>(null);

  const [cmtText, setCmtText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const res = await fetch(`/api/content-pages/by-slug/${slug}`);
        if (res.status === 404) { setNotFound(true); setLoading(false); return; }
        if (!res.ok) { setLoading(false); return; }
        const data: ContentPage = await res.json();
        setPage(data);
        setReactions({ fireCount: data.fireCount, heartCount: data.heartCount, starCount: data.starCount });
        const cr = await fetch(`/api/content-pages/${data.id}/comments`);
        if (cr.ok) setComments(await cr.json());
        fetch(`/api/content-pages/${data.id}/view`, { method: 'POST' }).catch(() => {});
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const handleReact = async (type: 'fire' | 'heart' | 'star') => {
    if (!page || reactingTo) return;
    setReactingTo(type);
    const key = `${type}Count` as keyof typeof reactions;
    const wasActive = userReaction === type;
    setReactions(r => ({
      ...r,
      [key]: wasActive ? r[key] - 1 : r[key] + 1,
      ...(userReaction && !wasActive ? { [`${userReaction}Count`]: r[`${userReaction}Count` as keyof typeof r] - 1 } : {}),
    }));
    setUserReaction(wasActive ? null : type);
    try {
      if (!wasActive) {
        const res = await fetch(`/api/content-pages/${page.id}/react`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type }),
        });
        if (res.ok) {
          const updated = await res.json();
          setReactions(updated);
        }
      }
    } finally {
      setReactingTo(null);
    }
  };

  const handleShare = async (source: 'top' | 'hadith' | 'bottom') => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch { /* ignore */ }
    if (source === 'top') showToast('🔗 Link copied! Send it to the group chat!');
    else if (source === 'hadith') showToast('🌟 Reward multiplier unlocked! Link copied.');
    else showToast('✨ Video link copied! Who are you sending it to?');
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!page || !cmtText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/content-pages/${page.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '@You', text: cmtText.trim() }),
      });
      if (res.ok) {
        const newComment: Comment = await res.json();
        setComments(c => [newComment, ...c]);
        setCmtText('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">404</h1>
          <p>This page doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  const reactionConfig = [
    { type: 'fire' as const,  icon: Flame,  count: reactions.fireCount,  active: 'bg-orange-100 text-orange-600', fill: 'fill-orange-500', label: 'Fire' },
    { type: 'heart' as const, icon: Heart,  count: reactions.heartCount, active: 'bg-pink-100 text-pink-600',   fill: 'fill-pink-500',   label: 'Love' },
    { type: 'star' as const,  icon: Star,   count: reactions.starCount,  active: 'bg-amber-100 text-amber-600', fill: 'fill-amber-500',  label: 'Star' },
  ];

  return (
    <div className="bg-slate-50 text-slate-800 font-sans pb-20 lg:pb-8 lg:px-4 flex flex-col min-h-screen selection:bg-purple-500 selection:text-white">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce pointer-events-none">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-full shadow-lg shadow-purple-500/30 font-bold text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {toast}
          </div>
        </div>
      )}

      {/* Main container */}
      <div className="max-w-md lg:max-w-5xl w-full mx-auto bg-white min-h-screen lg:min-h-[calc(100vh-4rem)] lg:my-8 lg:rounded-3xl shadow-xl overflow-hidden relative border-x lg:border border-slate-200 flex flex-col">

        {/* Responsive grid */}
        <div className="flex-1 flex flex-col lg:flex-row">

          {/* Left column */}
          <div className="w-full lg:w-7/12 lg:border-r border-slate-100 flex flex-col pb-6 lg:pb-10 bg-white">

            {/* Custom HTML content */}
            <div className="px-4 lg:px-8 py-5 lg:py-8">
              <div
                className="w-full"
                dangerouslySetInnerHTML={{ __html: page.htmlContent }}
              />
            </div>

            {/* Reaction + Share bar */}
            <div className="px-5 lg:px-8 flex items-center justify-between">
              <div className="flex bg-slate-100 rounded-full p-1 border border-slate-200">
                {reactionConfig.map(({ type, icon: Icon, count, active, fill }) => (
                  <button
                    key={type}
                    onClick={() => handleReact(type)}
                    disabled={!!reactingTo}
                    className={`flex items-center gap-1.5 px-3 lg:px-4 py-1.5 lg:py-2 rounded-full transition-all ${
                      userReaction === type ? active : 'hover:bg-slate-200 text-slate-500'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${userReaction === type ? fill : ''}`} />
                    <span className="text-sm font-bold">{count}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => handleShare('top')}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 lg:px-6 py-2 lg:py-2.5 rounded-full font-bold text-sm transition-colors shadow-md shadow-indigo-500/20"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>

            {/* Hadith / share reminder */}
            <div className="px-5 lg:px-8 mt-6">
              <div className="bg-indigo-50/80 border border-indigo-100 rounded-2xl p-4 lg:p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-200/30 rounded-full blur-2xl group-hover:bg-indigo-200/50 transition-colors" />
                <div className="flex gap-3 relative z-10">
                  <div className="text-indigo-500 mt-1 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm lg:text-base text-slate-700 italic font-semibold leading-relaxed mb-1 lg:mb-2">
                      &ldquo;Whoever guides someone to goodness will have a reward like one who did it.&rdquo;
                    </p>
                    <p className="text-[10px] lg:text-xs text-indigo-600 font-bold uppercase tracking-wider mb-3">
                      — Prophet Muhammad ﷺ (Muslim)
                    </p>
                    <button
                      onClick={() => handleShare('hadith')}
                      className="text-xs lg:text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-700 py-1.5 lg:py-2 px-3 lg:px-4 rounded-lg font-bold transition-colors flex items-center gap-1.5 w-fit"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Multiply your reward, share this!
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile divider */}
          <hr className="border-slate-100 my-8 mx-5 lg:hidden" />

          {/* Right column */}
          <div className="w-full lg:w-5/12 bg-slate-50/50 flex flex-col">

            {/* Comments */}
            <div className="px-5 lg:px-8 pt-0 lg:pt-8 pb-8 flex-1">
              <div className="flex items-center justify-between mb-4 lg:mb-6">
                <h3 className="font-bold text-lg lg:text-xl text-slate-900 flex items-center gap-2">
                  <MessageCircle className="text-purple-600 w-5 h-5 lg:w-6 lg:h-6" />
                  Squad Chat
                  <span className="text-xs lg:text-sm bg-white border border-slate-200 px-2 py-0.5 rounded-full text-slate-600 ml-2 font-bold shadow-sm">
                    {comments.length}
                  </span>
                </h3>
              </div>

              {/* Comment input */}
              <form onSubmit={handleComment} className="flex gap-3 mb-6 lg:mb-8">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-tr from-purple-100 to-amber-100 flex items-center justify-center text-xl shadow-sm shrink-0 border border-purple-200">
                  👤
                </div>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={cmtText}
                    onChange={e => setCmtText(e.target.value)}
                    placeholder="Drop a comment..."
                    maxLength={2000}
                    className="w-full bg-white border border-slate-200 rounded-full py-2.5 lg:py-3 pl-4 lg:pl-5 pr-12 text-sm lg:text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all shadow-sm"
                  />
                  <button
                    type="submit"
                    disabled={submitting || !cmtText.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 lg:p-2 text-purple-600 hover:text-purple-700 disabled:opacity-30 transition-colors"
                  >
                    <Send className="w-4 h-4 lg:w-5 lg:h-5" />
                  </button>
                </div>
              </form>

              {/* Comment list */}
              <div className="space-y-4 lg:space-y-5">
                {comments.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No comments yet. Be the first!</p>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="flex gap-3 lg:gap-4 group">
                      <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-white flex items-center justify-center text-lg shrink-0 border border-slate-200 group-hover:border-purple-300 shadow-sm transition-colors">
                        {getAvatar(c.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5 lg:mb-1">
                          <span className="font-bold text-sm lg:text-base text-slate-900">{c.name}</span>
                          <span className="text-xs text-slate-500 font-medium">{timeAgo(c.createdAt)}</span>
                        </div>
                        <p className="text-sm lg:text-base text-slate-600 leading-snug">{c.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Share CTA */}
            <div className="px-5 lg:px-8 pb-10 lg:pb-8">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-1 shadow-lg shadow-indigo-500/20">
                <div className="bg-white/20 backdrop-blur-md rounded-xl p-5 lg:p-6 text-center">
                  <h4 className="text-white font-extrabold text-lg lg:text-xl mb-1 drop-shadow-sm">Don&apos;t watch alone!</h4>
                  <p className="text-indigo-50 text-sm lg:text-base mb-4 lg:mb-5 font-medium drop-shadow-sm">
                    Send today&apos;s episode to a friend so they don&apos;t miss out!
                  </p>
                  <button
                    onClick={() => handleShare('bottom')}
                    className="w-full bg-white text-indigo-700 font-black py-3 lg:py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-transform active:scale-95 shadow-md lg:text-lg"
                  >
                    <Share2 className="w-5 h-5 lg:w-6 lg:h-6" />
                    Share Episode!
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
