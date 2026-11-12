'use client';

import type { ComponentConfig } from '@measured/puck';
import { blockStyle, styleFields } from './style-fields';

export const layoutBlocks: Record<string, ComponentConfig<any>> = {
  Section: {
    label: 'Section', fields: { styleFields, children: { type: 'slot' } }, defaultProps: { styleFields: { padding: '24px' }, children: [] },
    render: ({ styleFields, children: Children }) => <section style={blockStyle(styleFields)}><Children /></section>,
  },
  Column: {
    label: 'Column', fields: { styleFields, children: { type: 'slot' } }, defaultProps: { styleFields: {}, children: [] },
    render: ({ styleFields, children: Children }) => <div style={{ minWidth: 0, ...blockStyle(styleFields) }}><Children /></div>,
  },
  Grid: {
    label: 'Grid / columns', fields: { styleFields, columns: { type: 'number', min: 1, max: 6 }, gap: { type: 'number', min: 0, max: 100 }, children: { type: 'slot' } },
    defaultProps: { styleFields: {}, columns: 2, gap: 20, children: [] },
    render: ({ styleFields, columns, gap, children: Children }) => <Children style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(6, Math.max(1, Number(columns) || 1))}, minmax(0,1fr))`, gap: Math.min(100, Math.max(0, Number(gap) || 0)), ...blockStyle(styleFields) }} />,
  },
};
