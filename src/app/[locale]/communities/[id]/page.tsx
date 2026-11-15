import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, Users, ShieldCheck, MessageCircle, Heart } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { readDb } from '@/lib/db';
import { MembershipActions } from '@/components/ui/membership-actions';
import { ReportButton } from '@/components/ui/report-modal';

export const dynamic = 'force-dynamic';

export default async function CommunityDetailPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  setRequestLocale(params.locale);
  const db = await readDb();
  const record = db.communities.find(c => c.id === params.id);
  if (!record) notFound();
  const name = (id: string) => { const u = db.users.find(u => u.id === id); return u ? u.firstName + ' ' + u.lastName : ''; };
  const community = { ...record, members: record.memberIds.length,
    admins: record.adminIds.map(name), posts: db.communityPosts.filter(p => p.communityId === record.id).map(p => ({
      ...p, author: name(p.authorId), date: p.createdAt, likes: p.likeUserIds.length, comments: p.comments.length,
    })) };

  const t = await getTranslations('communities');

  return (
    <div>
      <div className="relative h-48 w-full overflow-hidden md:h-64">
        <Image
          src={community.cover}
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-ink-900/10 to-transparent" />
        <Link
          href="/communities"
          className="absolute start-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-ink-700 hover:bg-white"
        >
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
              {community.members.toLocaleString()} {t('membersLabel')}
            </p>
          </div>
<MembershipActions kind="communities" id={community.id} memberIds={community.memberIds} />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-8 md:col-span-2">
            <section>
              <h2 className="mb-2 font-display text-lg font-semibold text-ink-900">{t('about')}</h2>
              <p className="text-sm leading-relaxed text-ink-700">{community.description}</p>
            </section>

            <section>
              <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">{t('posts')}</h2>
              <div className="space-y-3">
                {community.posts.map((post) => (
                  <article key={post.id} className="rounded-2xl bg-white p-4 shadow-card">
                    <div className="flex items-center gap-2">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-majorelle-600/10 font-display text-sm font-semibold text-majorelle-700">
                        {post.author.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink-900">{post.author}</p>
                        <p className="text-xs text-ink-500">{post.date}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-ink-700">{post.content}</p>
                    <div className="mt-3 flex items-center gap-4 text-xs font-medium text-ink-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Heart size={13} /> {post.likes} · {t('like')}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MessageCircle size={13} /> {post.comments} · {t('comment')}
                      </span>
                    </div>
                  </article>
                ))}
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
                {community.rules.map((rule, i) => (
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
                {community.admins.map((admin) => (
                  <li key={admin} className="flex items-center gap-2 text-sm text-ink-700">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sand-100 text-xs font-semibold text-ink-700">
                      {admin.charAt(0)}
                    </div>
                    {admin}
                  </li>
                ))}
              </ul>
            </div>

<ReportButton targetType="community" targetId={community.id} />
          </aside>
        </div>
      </div>
    </div>
  );
}
