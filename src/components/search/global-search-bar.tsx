'use client';

import { useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';

export function GlobalSearchBar({
  placeholder,
  submitLabel,
  wrapperClassName = 'flex flex-1 flex-col gap-2 sm:flex-row',
  className = 'flex flex-1 items-center gap-2 rounded-full bg-white px-4 py-3 shadow-card',
  inputClassName = 'w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-300',
  iconClassName = 'shrink-0 text-ink-500',
  buttonClassName = 'rounded-full bg-clay-400 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-clay-500',
}: {
  placeholder: string;
  submitLabel?: string;
  wrapperClassName?: string;
  className?: string;
  inputClassName?: string;
  iconClassName?: string;
  buttonClassName?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    router.push(`/search${value.trim() ? `?q=${encodeURIComponent(value.trim())}` : ''}`);
  }

  return (
    <form onSubmit={handleSubmit} className={wrapperClassName} role="search">
      <div className={className}>
        <Search size={18} className={iconClassName} />
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className={inputClassName}
        />
      </div>
      {submitLabel && (
        <button type="submit" className={buttonClassName}>
          {submitLabel}
        </button>
      )}
    </form>
  );
}
