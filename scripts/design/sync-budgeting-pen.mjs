/**
 * Align docs/designs/budgeting/main.pen with @sindustries/design-tokens:
 * - sets imports → packages/design-tokens/tokens.pen
 * - removes duplicate root `variables` if present
 * - removes legacy on-canvas specimen frame (id q4Jkj) if still present
 *
 * Run when that file needs normalization (e.g. after merges).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  applyDesignTokensImport,
  repoRootFromThisScript,
  serializePenDocument
} from './pen-token-kit.mjs';

const repoRoot = repoRootFromThisScript(import.meta.url);
const mainPenPath = resolve(repoRoot, 'docs/designs/budgeting/main.pen');

const doc = JSON.parse(await readFile(mainPenPath, 'utf8'));
const canvas = doc.children?.[0];
if (canvas?.id === 'dbYmA' && Array.isArray(canvas.children)) {
  canvas.children = canvas.children.filter((n) => n.id !== 'q4Jkj');
}
applyDesignTokensImport(doc, mainPenPath, repoRoot, { alias: 'si', stripRootVariables: true });
await writeFile(mainPenPath, serializePenDocument(doc));
