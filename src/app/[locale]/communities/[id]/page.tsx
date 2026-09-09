'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { ChevronLeft, Users, ShieldCheck, MessageCircle, Heart } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { ReportButton } from '@/components/ui/report-modal';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  likeCount: number;
  likeUserIds: string[];
  commentCount: number;
  comments: { id: string; authorName: string; content: string; createdAt: string }[];
}

export default function CommunityDetailPage({ params }: { params: { id: string } }) {
  const t = useTranslations('communities');
  const common = useTranslations('common');
  const { user } = useAuth();
  const [community, setCommunity] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  function loadCommunity() {
    api
      .get<{ community: any }>(`/communities/${params.id}`)
      .then((r) => setCommunity(r.community))
      .catch(() => setNotFound(true));
  }
  function loadPosts() {
    api.get<{ posts: Post[] }>(`/communities/${params.id}/posts`).then((r) => setPosts(r.posts));
  }

  useEffect(() => {
    loadCommunity();
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-ink-500">
        Community not found. <Link href="/communities" className="font-semibold text-majorelle-700">Back</Link>
      </div>
    );
  }
  if (!community) return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-ink-500">{common('loading')}</div>;

  const joined = !!user && community.memberIds.includes(user.id);

  async function toggleJoin() {
    if (!user) return (window.location.href = '/login');
    const res = await api.post<{ joined: boolean; memberCount: number }>(`/communities/${params.id}/join`);
    setCommunity((c: any) => ({
      ...c,
      memberCount: res.memberCount,
      memberIds: res.joined ? [...c.memberIds, user.id] : c.memberIds.filter((m: string) => m !== user.id),
    }));
  }

  async function submitPost() {
    if (!newPost.trim()) return;
    await api.post(`/communities/${params.id}/posts`, { content: newPost });
    setNewPost('');
    loadPosts();
  }

  async function toggleLike(postId: string) {
    if (!user) return (window.location.href = '/login');
    const res = await api.post<{ liked: boolean; likeCount: number }>(`/communities/${params.id}/posts/${postId}/like`);
    setPosts((ps) =>
      ps.map((p) =>
        p.id === postId
          ? { ...p, likeCount: res.likeCount, likeUserIds: res.liked ? [...p.likeUserIds, user.id] : p.likeUserIds.filter((id) => id !== user.id) }
          : p
      )
    );
  }

  async function submitComment(postId: string) {
    const content = commentDrafts[postId];
    if (!content?.trim()) return;
    await api.post(`/communities/${params.id}/posts/${postId}/comments`, { content });
    setCommentDrafts((d) => ({ ...d, [postId]: '' }));
    loadPosts();
  }

  return (
    <div>
      <div className="relative h-48 w-full overflow-hidden md:h-64">
        <Image src={community.cover} alt="" fill className="object-cover" sizes="100vw" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-ink-900/10 to-transparent" />
        <Link href="/communities" className="absolute start-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-ink-700 hover:bg-white">
          <ChevronLeft size={14} className="flip-rtl" />
          {t('backToCommunities')}
        </Link>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-zellige-600">
              {community.category} · {community.city}
            </span>
            <h1 className="mt-1 font-display text-3xl font-semibold text-ink-900">{community.name}</h1>
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-ink-500">
              <Users size={14} />
              {community.memberCount.toLocaleString()} {t('membersLabel')}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleJoin}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
              joined ? 'bg-sand-100 text-ink-700 hover:bg-sand-200' : 'bg-majorelle-600 text-white hover:bg-majorelle-700'
            }`}
          >
            {joined ? t('leaveGroup') : t('joinGroup')}
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-8 md:col-span-2">
            <section>
              <h2 className="mb-2 font-display text-lg font-semibold text-ink-900">{t('about')}</h2>
              <p className="text-sm leading-relaxed text-ink-700">{community.description}</p>
            </section>

            <section>
              <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">{t('posts')}</h2>

              {joined && (
                <div className="mb-4 rounded-2xl bg-white p-4 shadow-card">
                  <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    rows={2}
                    placeholder="Share something with the group…"
                    className="w-full resize-none border-0 text-sm focus:outline-none"
                  />
                  <div className="mt-2 flex justify-end">
                    <button onClick={submitPost} disabled={!newPost.trim()} className="rounded-full bg-majorelle-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-majorelle-700 disabled:opacity-50">
                      Post
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {posts.map((post) => {
                  const liked = !!user && post.likeUserIds.includes(user.id);
                  return (
                    <article key={post.id} className="rounded-2xl bg-white p-4 shadow-card">
                      <div className="flex items-center gap-2">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-majorelle-600/10 font-display text-sm font-semibold text-majorelle-700">
                          {post.authorName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-ink-900">{post.authorName}</p>
                          <p className="text-xs text-ink-500">{new Date(post.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-ink-700">{post.content}</p>
                      <div className="mt-3 flex items-center gap-4 text-xs font-medium text-ink-500">
                        <button onClick={() => toggleLike(post.id)} className={`inline-flex items-center gap-1.5 ${liked ? 'text-clay-500' : ''}`}>
                          <Heart size={13} className={liked ? 'fill-clay-500' : ''} /> {post.likeCount} · {t('like')}
                        </button>
                        <button onClick={() => setOpenComments((o) => ({ ...o, [post.id]: !o[post.id] }))} className="inline-flex items-center gap-1.5">
                          <MessageCircle size={13} /> {post.commentCount} · {t('comment')}
                        </button>
                      </div>
                      {openComments[post.id] && (
                        <div className="mt-3 space-y-2 border-t border-ink-900/5 pt-3">
                          {post.comments.map((c) => (
                            <div key={c.id} className="text-xs text-ink-700">
                              <span className="font-semibold text-ink-900">{c.authorName}:</span> {c.content}
                            </div>
                          ))}
                          {joined && (
                            <div className="flex gap-2 pt-1">
                              <input
                                value={commentDrafts[post.id] || ''}
                                onChange={(e) => setCommentDrafts((d) => ({ ...d, [post.id]: e.target.value }))}
                                placeholder="Write a comment…"
                                className="flex-1 rounded-full border border-ink-900/10 px-3 py-1.5 text-xs focus:border-majorelle-500 focus:outline-none"
                              />
                              <button onClick={() => submitComment(post.id)} className="rounded-full bg-sand-100 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-sand-200">
                                {common('send')}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl bg-white p-4 shadow-card">
              <h3 className="mb-3 flex items-center gap-1.5 font-display text-sm font-semibold text-ink-900">
                <ShieldCheck size={15} className="text-zellige-600" />
                {t('groupRules')}
              </h3>
              <ul className="space-y-2 text-xs leading-relaxed text-ink-500">
                {community.rules.map((rule: string, i: number) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-ink-300">{i + 1}.</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-card">
              <h3 className="mb-3 font-display text-sm font-semibold text-ink-900">{t('admins')}</h3>
              <ul className="space-y-2">
                {community.adminNames.map((admin: string) => (
                  <li key={admin} className="flex items-center gap-2 text-sm text-ink-700">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sand-100 text-xs font-semibold text-ink-700">
                      {admin.charAt(0)}
                    </div>
                    {admin}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-full border border-ink-900/10 bg-white px-4 py-2.5 text-center">
              <ReportButton targetType="community" targetId={community.id} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
