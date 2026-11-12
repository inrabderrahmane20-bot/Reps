'use client';
import { useLocale } from 'next-intl';
import { SlidersHorizontal } from 'lucide-react';
import { ZONES } from '@/lib/zones';
import { servicesCopy } from '@/lib/services-copy';
import { DEFAULT_FILTERS,type FiltersState } from './filters-panel';
export function ServicesFilters({value,onChange,onReset,groupBy,onGroupBy}:{value:FiltersState;onChange:(value:FiltersState)=>void;onReset:()=>void;groupBy:string;onGroupBy:(value:string)=>void}) {
  const copy=servicesCopy(useLocale());
  return <section className="svc-provider-filters" aria-label={copy.reset}><div className="svc-filter-title"><SlidersHorizontal size={18} aria-hidden/><h2>{copy.professionals}</h2></div><div className="svc-filter-fields">
    <label>{copy.availability}<select aria-label={copy.availability} value={value.availability[0]??''} onChange={event=>onChange({...value,availability:event.target.value?[event.target.value as 'available'|'later']:[]})}><option value="">{copy.anyAvailability}</option><option value="available">{copy.available}</option><option value="later">{copy.later}</option></select></label>
    <label>{copy.rating}<select aria-label={copy.rating} value={value.minRating??''} onChange={event=>onChange({...value,minRating:event.target.value?Number(event.target.value):null})}><option value="">{copy.anyRating}</option>{[4.5,4,3].map(rating=><option key={rating} value={rating}>{rating} ★ {copy.ratingAndUp}</option>)}</select></label>
    <label>{copy.zone}<select aria-label={copy.zone} value={value.zone} onChange={event=>onChange({...value,zone:event.target.value})}><option value="all">{copy.allZones}</option>{ZONES.map(zone=><option key={zone.id} value={zone.id}>{zone.name}</option>)}</select></label>
    <label>{copy.resultsGroup}<select aria-label={copy.resultsGroup} value={groupBy} onChange={event=>onGroupBy(event.target.value)}><option value="none">{copy.ungrouped}</option><option value="category">{copy.category}</option><option value="availability">{copy.availability}</option></select></label>
    <button type="button" onClick={onReset} disabled={JSON.stringify(value)===JSON.stringify(DEFAULT_FILTERS) && groupBy==='none'}>{copy.reset}</button>
  </div></section>;
}
