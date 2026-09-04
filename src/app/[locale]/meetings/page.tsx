import { useTranslations } from 'next-intl';
import { SectionHeader } from '@/components/ui/section-header';
import { MeetingProfileCard } from '@/components/cards/meeting-profile-card';
import { MsnChatRoom } from '@/components/meetings/msn-chat-room';
import { RoomCard } from '@/components/meetings/room-card';
import { meetingProfiles, meetingRooms } from '@/data/mock';

export default function MeetingsPage() {
  const t = useTranslations('meetings');

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold text-ink-900">{t('title')}</h1>
        <p className="mt-1.5 text-sm text-ink-500">{t('subtitle')}</p>
        <p className="mt-3 rounded-xl bg-clay-400/10 px-4 py-3 text-sm text-clay-500">
          {t('notDating')}
        </p>
      </div>

      <section className="mt-10">
        <SectionHeader title={t('suggestedMatches')} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {meetingProfiles.map((p) => (
            <MeetingProfileCard key={p.id} {...p} />
          ))}
        </div>
      </section>

      <section className="mt-14">
        <SectionHeader title={t('rooms')} subtitle={t('roomsSubtitle')} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {meetingRooms.map((r) => (
            <RoomCard key={r.id} {...r} />
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="mb-1 font-display text-2xl font-semibold text-ink-900">
          {meetingRooms[0].name}
        </h2>
        <p className="mb-5 text-sm text-ink-500">{meetingRooms[0].topic}</p>
        <MsnChatRoom />
      </section>
    </div>
  );
}
