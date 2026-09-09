'use client';

import { useTranslations } from 'next-intl';

export function MeetingProfileCard({
  name,
  age,
  city,
  compatibility,
  sharedInterests,
  lookingFor,
  requestSent,
  onSendRequest,
}: {
  name: string;
  age: number;
  city: string;
  compatibility: number;
  sharedInterests: string[];
  lookingFor: string;
  requestSent?: boolean;
  onSendRequest?: () => void;
}) {
  const t = useTranslations('meetings');

  return (
    <article className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-semibold text-ink-900">
            {name}, {age}
          </h3>
          <p className="text-xs text-ink-500">{city}</p>
        </div>
        <span className="rounded-full bg-clay-400/10 px-2.5 py-1 text-xs font-semibold text-clay-500">
          {compatibility}% {t('compatible')}
        </span>
      </div>

      {sharedInterests.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-300">
            {t('youBothLike')}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {sharedInterests.map((interest) => (
              <span
                key={interest}
                className="rounded-full bg-sand-100 px-2.5 py-1 text-xs font-medium text-ink-700"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-ink-500">
        {t('bothLookingFor')}: <span className="font-medium text-ink-700">{lookingFor}</span>
      </p>

      <button
        type="button"
        disabled={requestSent}
        onClick={onSendRequest}
        className={`mt-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
          requestSent ? 'cursor-not-allowed bg-sand-100 text-ink-500' : 'bg-majorelle-600 text-white hover:bg-majorelle-700'
        }`}
      >
        {requestSent ? t('requestSent') : t('sendRequest')}
      </button>
    </article>
  );
}
