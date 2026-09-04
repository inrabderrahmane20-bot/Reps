import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, Users, ShieldCheck, MessageCircle, Heart, Flag } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { communities } from '@/data/mock';

export function generateStaticParams() {
  return communities.map((c) => ({ id: c.id }));
}

export default async function CommunityDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const community = communities.find((c) => c.id === params.id);
  if (!community) notFound();

  const t = await getTranslations('communities');
  const common = await getTranslations('common');
  const home = await getTranslations('home');

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
          <button
            type="button"
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
              community.joined
                ? 'bg-sand-100 text-ink-700 hover:bg-sand-200'
                : 'bg-majorelle-600 text-white hover:bg-majorelle-700'
            }`}
          >
            {community.joined ? t('leaveGroup') : t('joinGroup')}
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

            <button
              type="button"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-ink-900/10 bg-white px-4 py-2.5 text-xs font-semibold text-ink-500 hover:bg-sand-100"
            >
              <Flag size={13} /> {common('report')}
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}
