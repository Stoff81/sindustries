/**
 * Add document themes + semantic variables to design-systems.pen so the kit has
 * a readable Light default (and Dark) and the Variables table is populated locally.
 * Replaces $si-* references on nodes with $--ds-* keys defined in this file.
 *
 * Run: node scripts/design/apply-design-systems-ds-themes.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { serializePenDocument } from './pen-token-kit.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const penPath = resolve(repoRoot, 'packages/design-tokens/design-systems.pen');

const THEMES = { Mode: ['Light', 'Dark'] };

function themedColor(lightHex, darkHex) {
  return {
    type: 'color',
    value: [
      { value: lightHex, theme: { Mode: 'Light' } },
      { value: darkHex, theme: { Mode: 'Dark' } }
    ]
  };
}

function solidColor(hex) {
  return { type: 'color', value: hex };
}

/** Page / large canvas areas */
const PAGE_FILL_IDS = new Set(['vtHps', 'rYhmQ', 'OVVG0', 'uL1xr', 'V6Pot']);

const variables = {
  '--ds-page': themedColor('#F4F1EA', '#111213'),
  '--ds-field': themedColor('#FFFFFF', '#111213'),
  '--ds-pagination-active': themedColor('#E4E0D8', '#111213'),
  '--ds-image-placeholder': themedColor('#EDEAE4', '#111213'),
  '--ds-ink': solidColor('#111213'),
  '--ds-canvas-alt': themedColor('#E8E4DC', '#161A1E'),
  '--ds-surface': themedColor('#FFFFFF', '#2B2F34'),
  '--ds-text': themedColor('#111213', '#F3F1EC'),
  '--ds-text-secondary': themedColor('#3D444D', '#D5D3CD'),
  '--ds-text-muted': themedColor('#5C6670', '#8F969E'),
  '--ds-border': themedColor('#D8D4CC', '#8F969E2E'),
  '--ds-border-strong': themedColor('#9CA3AF', '#8F969E'),
  '--ds-brand': solidColor('#FFC935'),
  '--ds-info': solidColor('#00D4FF'),
  '--ds-success': solidColor('#31C76A'),
  '--ds-danger': solidColor('#FF5252'),
  '--ds-warn': solidColor('#F59E0B'),
  '--ds-cream': themedColor('#EDEBE6', '#F3F1EC'),
  '--ds-on-danger-fg': themedColor('#FFFFFF', '#F3F1EC'),
  '--ds-font-ui': { type: 'string', value: 'Inter' },
  '--ds-font-body': { type: 'string', value: 'Work Sans' },
  '--ds-radius-md': { type: 'number', value: 18 },
  '--ds-radius-lg': { type: 'number', value: 22 },
  '--ds-radius-pill': { type: 'number', value: 999 }
};

/** Order matters: longest $si-* first */
const SI_TO_DS = [
  ['$si-color-bg-canvas-alt', '$--ds-canvas-alt'],
  ['$si-color-bg-canvas', '$--ds-REPLACE-BG-CANVAS'],
  ['$si-color-bg-surface', '$--ds-surface'],
  ['$si-color-border-strong', '$--ds-border-strong'],
  ['$si-color-border-subtle', '$--ds-border'],
  ['$si-color-brand-500', '$--ds-brand'],
  ['$si-color-chart-transport', '$--ds-warn'],
  ['$si-color-cream-100', '$--ds-cream'],
  ['$si-color-danger-500', '$--ds-danger'],
  ['$si-color-info-500', '$--ds-info'],
  ['$si-color-ink-950', '$--ds-ink'],
  ['$si-color-success-500', '$--ds-success'],
  ['$si-color-text-muted', '$--ds-text-muted'],
  ['$si-color-text-secondary', '$--ds-text-secondary'],
  ['$si-color-text-primary', '$--ds-text'],
  ['$si-font-body', '$--ds-font-body'],
  ['$si-font-ui', '$--ds-font-ui'],
  ['$si-radius-pill', '$--ds-radius-pill'],
  ['$si-radius-md', '$--ds-radius-md'],
  ['$si-radius-lg', '$--ds-radius-lg']
];

function replaceSiStrings(value) {
  if (typeof value !== 'string') return value;
  let s = value;
  for (const [from, to] of SI_TO_DS) {
    if (s.includes(from)) s = s.split(from).join(to);
  }
  return s;
}

function resolveBgCanvasPlaceholder(node) {
  if (node?.fill !== '$--ds-REPLACE-BG-CANVAS') return;
  const id = node.id;
  if (id && PAGE_FILL_IDS.has(id)) {
    node.fill = '$--ds-page';
    return;
  }
  if (id === 'dtInputField1') {
    node.fill = '$--ds-field';
    return;
  }
  if (id === 'sVFkJ') {
    node.fill = '$--ds-pagination-active';
    return;
  }
  if (id === 'vr9W9') {
    node.fill = '$--ds-image-placeholder';
    return;
  }
  if (
    !id &&
    node.stroke &&
    typeof node.stroke === 'object' &&
    node.stroke.fill === '$--ds-border-strong'
  ) {
    node.fill = '$--ds-field';
    return;
  }
  node.fill = '$--ds-ink';
}

function walkReplaceStrings(node) {
  if (node === null || node === undefined) return;
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      const el = node[i];
      if (typeof el === 'string') node[i] = replaceSiStrings(el);
      else walkReplaceStrings(el);
    }
    return;
  }
  if (typeof node !== 'object') return;
  for (const k of Object.keys(node)) {
    if (k === 'theme') continue;
    const v = node[k];
    if (typeof v === 'string') node[k] = replaceSiStrings(v);
    else walkReplaceStrings(v);
  }
}

function walkResolveBgCanvas(node) {
  if (node === null || node === undefined) return;
  if (Array.isArray(node)) {
    for (const x of node) walkResolveBgCanvas(x);
    return;
  }
  if (typeof node !== 'object') return;
  resolveBgCanvasPlaceholder(node);
  for (const k of Object.keys(node)) {
    if (k === 'theme') continue;
    const v = node[k];
    if (v && typeof v === 'object') walkResolveBgCanvas(v);
  }
}

const DESTRUCTIVE_REF_NAMES = new Set([
  'Alert/Error',
  'Button/Large/Destructive',
  'Button/Destructive'
]);

/** Cream token is wrong on red destructive fills; use high-contrast foreground. */
function walkFixDestructiveCream(node) {
  if (node === null || node === undefined) return;
  if (Array.isArray(node)) {
    for (const x of node) walkFixDestructiveCream(x);
    return;
  }
  if (typeof node !== 'object') return;
  if (
    node.type === 'ref' &&
    typeof node.name === 'string' &&
    DESTRUCTIVE_REF_NAMES.has(node.name) &&
    node.descendants &&
    typeof node.descendants === 'object'
  ) {
    for (const patch of Object.values(node.descendants)) {
      if (patch && typeof patch === 'object' && patch.fill === '$--ds-cream') {
        patch.fill = '$--ds-on-danger-fg';
      }
    }
  }
  for (const k of Object.keys(node)) {
    if (k === 'theme') continue;
    const v = node[k];
    if (v && typeof v === 'object') walkFixDestructiveCream(v);
  }
}

const raw = await readFile(penPath, 'utf8');
const doc = JSON.parse(raw);

doc.themes = THEMES;
doc.variables = variables;

walkReplaceStrings(doc);
walkResolveBgCanvas(doc);
walkFixDestructiveCream(doc);

function setRootLightMode(children) {
  if (!Array.isArray(children)) return;
  for (const c of children) {
    if (c?.id === 'vtHps' && c.type === 'frame') {
      c.theme = { Mode: 'Light' };
      return;
    }
  }
}

setRootLightMode(doc.children);

if (!doc.imports?.si) {
  doc.imports = { ...(doc.imports ?? {}), si: './tokens.pen' };
}

await writeFile(penPath, serializePenDocument(doc));
