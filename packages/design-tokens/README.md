# `@sindustries/design-tokens`

Single source of truth for design tokens used across **web**, **React Native**, and **Pencil** (design files).

## How it fits together

```text
tokens.json          ← edit here (source)
    │
    ▼ npm run build
    ├── styles.css              ← CSS custom properties for web
    ├── src/tokens.ts           ← TypeScript object for React Native / Node
    ├── pen-tokens.json         ← Pencil variable payload (JSON, tooling / MCP)
    └── tokens.pen  ← Variables + generated Pencil specimen (open this file in Pencil)
```

- **Web** imports `@sindustries/design-tokens/styles.css` and uses `var(--si-…)` in CSS.
- **Mobile** imports `@sindustries/design-tokens/tokens` and uses the exported `colors`, `space`, `radius`, etc.
- **Pencil** imports `tokens.pen` from product `.pen` files so variables stay package-local (see [Pencil](#pencil) below).

## Quick start

From the repo root:

```sh
npm run build --workspace @sindustries/design-tokens
```

Or from this package:

```sh
npm run build
```

That reads `tokens.json` and overwrites `styles.css`, `src/tokens.ts`, `pen-tokens.json`, and `tokens.pen`. Commit generated files when token values change.

To re-apply the budgeting Pencil import layout (see [Budgeting `main.pen`](#budgeting-mainpen) below), run from the repo root: `npm run sync:budgeting-pen`.

## Editing the flow

### 1. Change `tokens.json`

Structure today:

- **`core`** — primitive values: `color`, `font`, `space`, `radius`.
- **`semantic`** — aliases built from core (and each other) using **reference strings**.
- **`platform`** — optional per-target knobs (e.g. mobile tab bar height) that are not emitted to CSS unless you extend the build script.

**References** use curly paths into the JSON tree:

```json
"canvas": "{core.color.ink.950}"
```

The build script resolves these recursively so semantic and derived values stay consistent.

### 2. Regenerate outputs

```sh
npm run build --workspace @sindustries/design-tokens
```

### 3. Extend the build script when needed

`scripts/build-tokens.mjs` maps the resolved tree into:

- `--si-color-*`, `--si-font-*`, `--si-space-*`, `--si-radius-*`, `--si-shadow-*`, etc. in `styles.css`
- The `tokens` object plus convenience exports (`colors`, `fonts`, `space`, `radius`, `platform`) in `src/tokens.ts`
- Pencil-oriented outputs: `pen-tokens.json` and `tokens.pen` (extend `buildPencilVariables()` / `buildPencilSpecimenDocumentChildren()` when adding tokens that should show in Pencil)

If you add a new **semantic** color or other field that should appear on web:

1. Add it under `tokens.json` (with references where possible).
2. Update `build-tokens.mjs` to emit the corresponding CSS variable and/or TS export.
3. Run `npm run build` again.

If you only need the value inside the existing `tokens` export for app code, adding it to `tokens.json` and extending the TS template at the bottom of the build script may be enough without new CSS vars.

## Where consumers live

| Consumer | Import | Usage |
|----------|--------|--------|
| Website (`apps/website`) | `@sindustries/design-tokens/styles.css` in `main.jsx` | `var(--si-color-bg-canvas)` etc. in CSS |
| Budget mobile (`apps/budget-mobile`) | `@sindustries/design-tokens/tokens` | `import { colors, space, radius } from '…'` in TS/TSX |
| Budgeting Pencil (`docs/designs/budgeting/main.pen`) | `imports` → `tokens.pen` | Merged **variables** only (`$si-…`). Open `tokens.pen` for the full specimen UI. |
| Design systems kit (`packages/design-tokens/design-systems.pen`) | `imports` → `./tokens.pen` | **Only `$si-…`** on art (no local `variables` / `themes`). Reusable Halo components live here. |
| Other packages | Same as above | Prefer semantic `colors.*` when available |

## Pencil

Pencil (`.pen` files) uses **document variables** and node properties like `fill: "$si-color-bg-canvas"`.

**Imports** merge **variables** from the linked file into the document you are editing. They do **not** copy the other file’s frames onto your canvas, so product files stay focused on product UI while still using the same `$si-…` names.

### Variables: sync vs build

There is **no** separate “variable sync” script in this repo that pushes `pen-tokens.json` into arbitrary `.pen` files.

**Intended flow for tokens**

1. Edit `tokens.json`, run `npm run build --workspace @sindustries/design-tokens`, commit `tokens.pen` (and `pen-tokens.json`, etc.). The kit file on disk already contains the full `variables` map.
2. Product `.pen` files list **`imports`** pointing at that kit (see budgeting below). Pencil merges those variables when you open the product file—no extra sync step, as long as the kit path is correct and the built kit is committed.

**`pen-tokens.json`** is a JSON mirror for **tooling** (e.g. Pencil MCP `set_variables`, CI checks, or a small script you add later). It is not required for day-to-day work if everything goes through `imports` + rebuilt `tokens.pen`.

**`npm run sync:budgeting-pen`** (repo root) is **not** variable sync: it only normalizes `docs/designs/budgeting/main.pen` (import path, strip duplicate root `variables`, remove legacy frame `q4Jkj` if present).

**Design systems (`design-systems.pen`)**

`design-systems.pen` imports **`tokens.pen`** and uses **`$si-…`** only (no second variable table). If an old branch reintroduces root **`variables`**, **`themes`**, or **`$--…`** strings, run **`npm run migrate:design-systems-pen`** from the repo root to normalize again (see `scripts/design/migrate-design-systems-to-si-vars.mjs`).

**`npm run sync:design-systems-pen`** sets `imports.si` → `./tokens.pen` and strips any duplicate root **`variables`** / **`themes`**.

### Design kits in Pencil

In the `.pen` schema, a **design kit** is just another **`.pen` document** referenced from `Document.imports`: each entry is a short alias and a **relative path** to that file. The kit document can define **`variables`** and **`reusable: true` components**; importing files get merged variables and can use those components according to Pencil’s rules. Ordinary frames in the kit (e.g. our generated specimen) are for opening the kit file directly—they are not pasted onto the importer’s canvas.

`tokens.pen` is that kit for **tokens** (variables + specimen). You can add more kit files later (e.g. shared budgeting components) and additional `imports` entries with paths relative to each product file.

**Where to look**

- **`tokens.pen`** — canonical variable definitions **plus** a generated **Design tokens specimen** (color swatches, typography, space bars, radius tiles, and a small UI sample), aligned with the React Native token screen and web `/tokens`. Open this file when you want to review tokens visually in Pencil.
- **`pen-tokens.json`** — same variables as JSON (`type` / `value`) for scripts or MCP `set_variables`.

**Budgeting** (`docs/designs/budgeting/main.pen`) declares:

```json
"imports": {
  "si": "../../../packages/design-tokens/tokens.pen"
}
```

Paths are relative to the importing file. `npm run build` in this package regenerates the library `.pen` only.

### Budgeting `main.pen`

`docs/designs/budgeting/main.pen` is not modified by this package’s build (that would be a reverse dependency). When you need to normalize that file again—for example after merging old branches that still embed `variables` or the legacy specimen frame—run from the **repository root**:

```sh
npm run sync:budgeting-pen
```

That runs `scripts/design/sync-budgeting-pen.mjs`, which sets `imports` to `tokens.pen`, strips duplicate root `variables`, and removes frame `q4Jkj` if present.

Compare **web** `/tokens`, **mobile** `TokenSpecimenScreen`, and **Pencil** `tokens.pen` after token changes.

## Adding a new token (checklist)

1. Add the primitive under `core` (or a new semantic key under `semantic`) in `tokens.json`.
2. Use `{path.to.other.token}` for anything that should track another value.
3. Update `scripts/build-tokens.mjs` if the value must appear as `--si-*` in CSS or in the `colors` / other exports in `src/tokens.ts`.
4. Run `npm run build`.
5. Use the new variable in web CSS, mobile styles, or Pencil.
6. Extend `buildPencilVariables()` / `buildPencilSpecimenDocumentChildren()` if the new token should appear in Pencil or the generated specimen.

## Package exports

| Export path | Description |
|-------------|-------------|
| `@sindustries/design-tokens/styles.css` | Global CSS variables + base element styles |
| `@sindustries/design-tokens/tokens` | Generated `tokens` object and helpers |
| `@sindustries/design-tokens/tokens.json` | Raw source JSON (for tooling or documentation) |
| `@sindustries/design-tokens/pen-tokens.json` | Generated Pencil variables (JSON mirror) |
| `@sindustries/design-tokens/tokens.pen` | Generated `.pen` document for Pencil `imports` |
| `@sindustries/design-tokens/design-systems.pen` | Pencil design-systems kit (Halo components); imports `./tokens.pen` for `$si-…` |

## CI / pre-commit

Consider running `npm run build --workspace @sindustries/design-tokens` in CI after changes to `tokens.json` or `build-tokens.mjs`, and failing if `git diff` shows unstaged changes to generated outputs (`styles.css`, `src/tokens.ts`, `pen-tokens.json`, `tokens.pen`). Run `npm run sync:budgeting-pen` at the repo root only when the budgeting Pencil file needs that normalization.
