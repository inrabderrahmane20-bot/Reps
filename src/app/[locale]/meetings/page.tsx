'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { Link, useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api-client';
import { MeetingProfileCard } from '@/components/cards/meeting-profile-card';
import { RoomCard } from '@/components/meetings/room-card';
import { GroupChatPanel } from '@/components/chat/group-chat-panel';

type Profile = { userId: string; name: string; age: number; city: string; compatibility: number; sharedInterests: string[]; lookingFor: string };
type Room = { id: string; name: string; topic: string; online: number };
export default function MeetingsPage() {
  const t = useTranslations('meetings');
  const common = useTranslations('common');
  const empty = useTranslations('favorites');
  const { user } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [room, setRoom] = useState<string | null>(null);
  const [sent, setSent] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setError(false); setProfiles([]); setRoom(null); setSent([]);
    api.get<{ rooms: Room[] }>('/rooms').then(data => { if (active) setRooms(data.rooms); }).catch(() => { if (active) setError(true); });
    if (user) api.get<{ profiles: Profile[] }>('/meetings/discover').then(data => { if (active) setProfiles(data.profiles); }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [user, revision]);
  async function request(receiverId: string) {
    try { await api.post('/meetings/requests', { receiverId }); setSent(ids => [...ids, receiverId]); }
    catch { setError(true); }
  }
  return <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
    <h1 className="font-display text-3xl font-semibold">{t('title')}</h1>
    <p className="mt-2">{t('subtitle')}</p>
    <p className="mt-4 rounded-xl bg-sand-100 p-4">{t('notDating')}</p>
    {!user && <Link href="/login" className="mt-5 inline-block underline">{common('login')}</Link>}
    {error && <p role="alert" className="mt-5">{common('somethingWentWrong')} <button className="underline" onClick={() => setRevision(n => n + 1)}>{common('tryAgain')}</button></p>}
    <h2 className="mt-8 text-xl font-semibold">{t('suggestedMatches')}</h2>
    {!profiles.length && <p className="mt-3">{empty('emptySection')}</p>}
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{profiles.map(profile => <MeetingProfileCard key={profile.userId} {...profile} requestSent={sent.includes(profile.userId)} onSendRequest={() => void request(profile.userId)} />)}</div>
    <h2 className="mt-8 text-xl font-semibold">{t('rooms')}</h2>
    {!rooms.length && <p className="mt-3">{empty('emptySection')}</p>}
    <div className="mt-4 grid gap-4 sm:grid-cols-2">{rooms.map(item => <RoomCard key={item.id} {...item} active={room === item.id} onOpen={() => user ? setRoom(item.id) : router.push('/login')} />)}</div>
    {room && user && <div className="mt-8"><GroupChatPanel key={room} fetchUrl={'/rooms/' + room + '/messages'} meId={user.id} /></div>}
  </div>;
}
