'use client';

import { useMemo, useState } from 'react';
import {
  ChevronRight,
  Search,
  RotateCcw,
  Hammer,
  Sparkles,
  Trees,
  Car,
  Laptop,
  HomeIcon,
  Scissors,
  Shirt,
  PartyPopper,
  UtensilsCrossed,
  Truck,
  ShieldCheck,
  GraduationCap,
  PawPrint,
  Boxes,
  Siren,
  KeyRound,
  Refrigerator,
  Sofa,
  Building2,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import taxonomyData from '@/data/service-taxonomy.json';

interface TaxNode {
  name: string;
  children?: TaxNode[];
}

const taxonomy = taxonomyData as TaxNode[];

// The source taxonomy naturally has 2-3 levels (Category → Subcategory → Service).
// We still label steps using the requested progression — deeper labels simply
// don't appear until/unless the data goes that deep for a given branch.
const LEVEL_LABELS = ['Category', 'Subcategory', 'Profession', 'Service', 'Specialty'];

// Top-level categories get a matching icon so the first grid reads at a glance
// instead of as a wall of text. Matched by keyword since the source data is French.
const CATEGORY_ICONS: [string, LucideIcon][] = [
  ['MAISON', Hammer],
  ['NETTOYAGE', Sparkles],
  ['JARDIN', Trees],
  ['AUTOMOBILE', Car],
  ['INFORMATIQUE', Laptop],
  ['DOMICILE', HomeIcon],
  ['BEAUT', Scissors],
  ['MODE', Shirt],
  ['MARIAGE', PartyPopper],
  ['CUISINE', UtensilsCrossed],
  ['TRANSPORT', Truck],
  ['SÉCURIT', ShieldCheck],
  ['SECURIT', ShieldCheck],
  ['ÉDUCATION', GraduationCap],
  ['EDUCATION', GraduationCap],
  ['ANIMAUX', PawPrint],
  ['LOCATION', Boxes],
  ['DÉPANNAGE', Siren],
  ['DEPANNAGE', Siren],
  ['SERRURERIE', KeyRound],
  ['ÉLECTROMÉNA', Refrigerator],
  ['ELECTROMENA', Refrigerator],
  ['MEUBLES', Sofa],
  ['ENTREPRISES', Building2],
];

function iconFor(name: string): LucideIcon {
  const match = CATEGORY_ICONS.find(([key]) => name.toUpperCase().includes(key));
  return match ? match[1] : MoreHorizontal;
}

export function ServiceCategoryDrilldown() {
  const router = useRouter();
  const [path, setPath] = useState<TaxNode[]>([]);

  const currentChildren: TaxNode[] = path.length === 0 ? taxonomy : path[path.length - 1].children ?? [];
  const isLeaf = path.length > 0 && !path[path.length - 1].children;
  const depth = path.length;
  const levelLabel = LEVEL_LABELS[Math.min(depth, LEVEL_LABELS.length - 1)];

  function selectNode(node: TaxNode) {
    setPath((p) => [...p, node]);
  }
  function goToDepth(newDepth: number) {
    setPath((p) => p.slice(0, newDepth));
  }
  function browseProviders(query: string) {
    router.push(`/services?q=${encodeURIComponent(query)}`);
  }

  return (
    <div className="border-t border-ink-900/[0.06] pt-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex flex-wrap items-center gap-1 text-xs font-medium text-ink-500">
          <button
            type="button"
            onClick={() => goToDepth(0)}
            className={`rounded-full px-2.5 py-1 transition-colors ${depth === 0 ? 'bg-majorelle-600 text-white' : 'hover:bg-sand-100'}`}
          >
            All services
          </button>
          {path.map((node, i) => (
            <span key={`${node.name}-${i}`} className="flex items-center gap-1">
              <ChevronRight size={12} className="shrink-0 text-ink-300 flip-rtl" />
              <button
                type="button"
                onClick={() => goToDepth(i + 1)}
                className={`rounded-full px-2.5 py-1 transition-colors ${i === path.length - 1 ? 'bg-majorelle-600 text-white' : 'hover:bg-sand-100'}`}
              >
                {node.name}
              </button>
            </span>
          ))}
        </div>
        {depth > 0 && (
          <button
            type="button"
            onClick={() => goToDepth(0)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-ink-500 hover:text-clay-500"
          >
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </div>

      <p className="mb-2.5 mt-4 px-1 text-[11px] font-semibold uppercase tracking-wide text-ink-300">
        {levelLabel}
      </p>

      {!isLeaf ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {currentChildren.map((node) => {
            const Icon = depth === 0 ? iconFor(node.name) : null;
            return (
              <button
                key={node.name}
                type="button"
                onClick={() => selectNode(node)}
                className="card-hover group flex items-center gap-2.5 rounded-xl border border-ink-900/[0.06] bg-sand-50 px-3.5 py-3 text-start text-sm font-medium text-ink-700 hover:border-majorelle-200 hover:bg-white"
              >
                {Icon && (
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-majorelle-600/10 text-majorelle-700 group-hover:bg-majorelle-600 group-hover:text-white transition-colors">
                    <Icon size={16} />
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate">{node.name}</span>
                {node.children && (
                  <ChevronRight size={14} className="shrink-0 text-ink-300 flip-rtl" />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-xl bg-sand-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-base font-semibold text-ink-900">{path[path.length - 1].name}</p>
            <p className="mt-0.5 text-xs text-ink-500">
              Options — browse verified providers for this service.
            </p>
          </div>
          <button
            type="button"
            onClick={() => browseProviders(path[path.length - 1].name)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-majorelle-600 px-4 py-2 text-xs font-semibold text-white hover:bg-majorelle-700"
          >
            <Search size={13} /> Browse providers
          </button>
        </div>
      )}
    </div>
  );
}
