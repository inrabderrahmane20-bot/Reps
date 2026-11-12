'use client';
import { createContext, useContext, type ReactNode } from 'react';
export type PageSections = Record<string, (content: Record<string, string>, editing: boolean) => ReactNode>;
export const PageSectionsContext = createContext<PageSections>({});
export function LivePageSection({ name, content, editing }: { name: string; content: Record<string, string>; editing: boolean }) {
  const sections = useContext(PageSectionsContext);
  return <>{sections[name]?.(content, editing)}</>;
}
