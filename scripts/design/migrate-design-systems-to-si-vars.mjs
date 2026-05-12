/**
 * One-time / repeatable migration: design-systems.pen uses only $si-* (via imports.si → tokens.pen).
 * - Removes root `variables` and `themes`
 * - Drops frame `theme` keys (Light/Dark axes referred to removed variables)
 * - Replaces every `$--…` string with mapped $si-* or numeric corner radii
 *
 * Run: node scripts/design/migrate-design-systems-to-si-vars.mjs
 *
 * After migrating, re-run `npm run apply:design-systems-ds-themes` if you use the local
 * `$--ds-*` + Mode Light/Dark layer (this script removes document variables and themes).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const penPath = resolve(repoRoot, 'packages/design-tokens/design-systems.pen');

/** Longest keys first so --sidebar-primary-foreground replaces before --sidebar */
const STRING_REPLACEMENTS = [
  ['$--sidebar-primary-foreground', '$si-color-text-primary'],
  ['$--sidebar-accent-foreground', '$si-color-text-primary'],
  ['$--sidebar-foreground', '$si-color-text-secondary'],
  ['$--sidebar-accent', '$si-color-bg-canvas-alt'],
  ['$--sidebar-border', '$si-color-border-subtle'],
  ['$--sidebar', '$si-color-bg-surface'],
  ['$--destructive-foreground', '$si-color-cream-100'],
  ['$--destructive', '$si-color-danger-500'],
  ['$--primary-foreground', '$si-color-bg-canvas'],
  ['$--secondary-foreground', '$si-color-text-primary'],
  ['$--accent-foreground', '$si-color-text-primary'],
  ['$--popover-foreground', '$si-color-text-primary'],
  ['$--card-foreground', '$si-color-text-primary'],
  ['$--muted-foreground', '$si-color-text-muted'],
  ['$--color-error-foreground', '$si-color-cream-100'],
  ['$--color-warning-foreground', '$si-color-bg-canvas'],
  ['$--color-success-foreground', '$si-color-bg-canvas'],
  ['$--color-info-foreground', '$si-color-ink-950'],
  ['$--color-error', '$si-color-danger-500'],
  ['$--color-warning', '$si-color-chart-transport'],
  ['$--color-success', '$si-color-success-500'],
  ['$--color-info', '$si-color-info-500'],
  ['$--popover', '$si-color-bg-surface'],
  ['$--secondary', '$si-color-bg-surface'],
  ['$--accent', '$si-color-bg-canvas-alt'],
  ['$--card', '$si-color-bg-surface'],
  ['$--input', '$si-color-border-strong'],
  ['$--border', '$si-color-border-subtle'],
  ['$--primary', '$si-color-brand-500'],
  ['$--foreground', '$si-color-text-primary'],
  ['$--background', '$si-color-bg-canvas'],
  ['$--tile', '$si-color-bg-canvas-alt'],
  ['$--white', '$si-color-cream-100'],
  ['$--font-primary', '$si-font-ui'],
  ['$--font-secondary', '$si-font-body'],
  ['$--radius-pill', '$si-radius-pill'],
  ['$--radius-m', '$si-radius-md'],
  ['$--radius-l', '$si-radius-lg']
];

function replaceDashesInString(s) {
  if (typeof s !== 'string' || !s.startsWith('$--')) return s;
  if (s === '$--radius-none') return 0;
  if (s === '$--radius-xs') return 8;
  let out = s;
  for (const [from, to] of STRING_REPLACEMENTS) {
    if (out === from) return to;
  }
  return out;
}

function walk(node) {
  if (Array.isArray(node)) return node.map(walk);
  if (node !== null && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (k === 'theme') continue;
      out[k] = walk(v);
    }
    return out;
  }
  return replaceDashesInString(node);
}

const raw = await readFile(penPath, 'utf8');
const doc = JSON.parse(raw);

delete doc.variables;
delete doc.themes;

const migrated = walk(doc);

if (!migrated.imports?.si) {
  migrated.imports = { ...(migrated.imports ?? {}), si: './tokens.pen' };
}

const ordered = {
  version: migrated.version,
  imports: migrated.imports,
  children: migrated.children
};

await writeFile(penPath, `${JSON.stringify(ordered, null, 2)}\n`);
