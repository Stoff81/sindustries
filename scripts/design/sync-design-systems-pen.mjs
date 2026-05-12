/**
 * Ensure packages/design-tokens/design-systems.pen imports tokens.pen (same folder).
 * Does not remove the kit's own `variables` / `themes` (e.g. $-- tokens); only merges `imports.si`.
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
const penPath = resolve(repoRoot, 'packages/design-tokens/design-systems.pen');

const doc = JSON.parse(await readFile(penPath, 'utf8'));
applyDesignTokensImport(doc, penPath, repoRoot, { alias: 'si', stripRootVariables: false });
await writeFile(penPath, serializePenDocument(doc));
