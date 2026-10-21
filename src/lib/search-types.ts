// Shared shapes for the global search payload (API route → client).
// Kept in `lib` so the client bundle never imports the route module.

export type SearchKind = 'service' | 'promotion' | 'category' | 'news' | 'community' | 'activity';

export interface SearchItem {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle?: string;
  href: string;
  image?: string;
  badge?: string;
  meta?: string;
}

export interface SearchGroup {
  key: SearchKind;
  items: SearchItem[];
}

export interface SearchResponse {
  query: string;
  groups: SearchGroup[];
  total: number;
}
