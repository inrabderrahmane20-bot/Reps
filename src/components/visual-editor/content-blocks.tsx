'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { ComponentConfig, Field } from '@measured/puck';
import { ArrowRight, Bell, Check, Globe, Heart, Home, MapPin, Menu, Search, Star, User, Wrench, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { blockStyle, styleFields } from './style-fields';
import { safeCssValue, safeUrl, sanitizeRichText } from '@/lib/visual-editor/sanitize';

export function ImageUpload({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function upload(file: File) {
    setBusy(true); setError('');
    try {
      const body = new FormData(); body.append('file', file);
      const response = await fetch('/api/admin/visual-editor/upload/', { method: 'POST', credentials: 'same-origin', body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Upload failed.');
      onChange(result.url);
    } catch (error) { setError(error instanceof Error ? error.message : 'Upload failed.'); }
    finally { setBusy(false); }
  }
  return <div className="ve-image-field">
    <input aria-label="Image URL" value={value ?? ''} onChange={event => onChange(event.target.value)} placeholder="Image URL" />
    <label>Upload / replace image (4 MB maximum)<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={busy} onChange={event => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ''; }} /></label>
    {busy && <p role="status">Uploading…</p>}{error && <p role="alert">{error}</p>}
  </div>;
}
export const imageField: Field = { type: 'custom', label: 'Image', render: ({ value, onChange }) => <ImageUpload value={value ?? ''} onChange={onChange} /> };
const icons = { ArrowRight, Bell, Check, Globe, Heart, Home, MapPin, Menu, Search, Star, User, Wrench, X };
export const contentBlocks: Record<string, ComponentConfig<any>> = {
  Text: { label: 'Text / heading', fields: { styleFields, text: { type: 'textarea' }, as: { type: 'select', options: ['p','h1','h2','h3'].map(value => ({ label: value, value })) } }, defaultProps: { text: 'Text', as: 'p', styleFields: {} }, render: ({ text, as, styleFields }) => {
    const Tag = (['p','h1','h2','h3'].includes(as) ? as : 'p') as 'p'; return <Tag style={blockStyle(styleFields)}>{text}</Tag>;
  } },
  RichText: { label: 'Rich text', fields: { styleFields, html: { type: 'textarea', label: 'Rich text HTML' } }, defaultProps: { html: '<p>Text</p>', styleFields: {} }, render: ({ html, styleFields }) => <div style={blockStyle(styleFields)} dangerouslySetInnerHTML={{ __html: sanitizeRichText(String(html ?? '')) }} /> },
  Image: { label: 'Image', fields: { styleFields, src: imageField, alt: { type: 'text' }, objectFit: { type: 'select', label: 'Object fit', options: ['contain','cover','fill','none','scale-down'].map(value => ({ label: value, value })) } }, defaultProps: { src: '', alt: '', objectFit: 'contain', styleFields: {} }, render: ({ src, alt, objectFit, styleFields }) => safeUrl(src, true) ? <Image src={safeUrl(src, true)} alt={alt ?? ''} width={800} height={450} style={{ width: '100%', height: 'auto', ...blockStyle(styleFields), objectFit: ['contain','cover','fill','none','scale-down'].includes(objectFit) ? objectFit : 'contain' }} /> : <div style={{ padding: 24, border: '1px dashed #bbb', ...blockStyle(styleFields) }}>Choose an image</div> },
  Icon: { label: 'Icon', fields: { styleFields, name: { type: 'select', options: Object.keys(icons).map(value => ({ label: value, value })) }, size: { type: 'number', min: 8, max: 200 }, color: { type: 'text' } }, defaultProps: { name: 'Star', size: 24, color: '#064e43', styleFields: {} }, render: ({ name, size, color, styleFields }) => { const Icon = icons[name as keyof typeof icons] ?? Star; return <Icon aria-hidden="true" size={Math.min(200, Math.max(8, Number(size) || 24))} style={{ ...blockStyle(styleFields), color: safeCssValue(color) }} />; } },
  Button: { label: 'Button / link', fields: { styleFields, label: { type: 'text' }, href: { type: 'text', label: 'Link' }, textColor: { type: 'text' }, backgroundColor: { type: 'text' }, hoverColor: { type: 'text' }, hoverBackground: { type: 'text' } }, defaultProps: { label: 'Button', href: '/', textColor: '#ffffff', backgroundColor: '#064e43', hoverColor: '#ffffff', hoverBackground: '#093d35', styleFields: {} }, render: ({ id, label, href, textColor, backgroundColor, hoverColor, hoverBackground, styleFields }) => <>
    {/^[\w-]+$/.test(id) && <style>{`[data-visual-button="${id}"]:hover{color:${safeCssValue(hoverColor) || 'inherit'}!important;background-color:${safeCssValue(hoverBackground) || 'transparent'}!important}`}</style>}
    <Link data-visual-button={id} href={safeUrl(href) || '/'} style={{ display: 'inline-flex', padding: '12px 20px', borderRadius: 24, color: safeCssValue(textColor), backgroundColor: safeCssValue(backgroundColor), ...blockStyle(styleFields) }}>{label}</Link>
  </> },
};
