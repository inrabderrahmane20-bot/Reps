'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { SearchCategoryNode } from '@/lib/category-tree';
import { categoryImage } from '@/lib/category-images';

/** Admin image first; a broken upload never leaves a category without a photograph. */
export function CategoryPhoto({ node, fallbackKey, alt, sizes = '(min-width: 1024px) 25vw, 50vw', priority = false }: {node: SearchCategoryNode; fallbackKey?: string; alt: string; sizes?: string; priority?: boolean}) {
  const preferred = categoryImage(node, fallbackKey);
  const [src,setSrc] = useState(preferred);
  useEffect(() => setSrc(preferred), [preferred]);
  const fallback = categoryImage({...node,image:undefined},fallbackKey);
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} onError={() => setSrc(current => current === fallback ? '/images/categories/default.jpg' : fallback)} />;
}
