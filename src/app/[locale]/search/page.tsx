import { Suspense } from 'react';
import { SearchResults } from '@/components/search/search-results';

function SearchFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div className="h-9 w-48 animate-pulse rounded-lg bg-sand-200" />
      <div className="mt-6 h-12 max-w-2xl animate-pulse rounded-full bg-sand-200" />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-sand-200" />
        ))}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchResults />
    </Suspense>
  );
}
