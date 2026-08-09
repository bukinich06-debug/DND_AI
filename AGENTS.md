<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Project structure

The project is split into layers. `app/` holds thin Next.js route entry points; business code lives in `components`, `services`, `domain`, and `data`.

```
app/              # Next.js routes — thin pages, minimal logic; Route Handlers in app/api/
components/       # UI (React) — no business logic execution
services/         # use cases — 'use server', orchestrates domain + data
domain/           # business rules, entities, repository interfaces (pure TS)
data/             # storage implementations (Prisma, etc.)
```

**Goal:** UI, business logic, and storage stay independent. You can rewrite the UI, replace `data/` (e.g. drop Prisma), or hand off `domain` + `services` — without breaking the other layers.

**Code style:** see `.cursor/rules/code-style.mdc` (names, if/ternaries, thin `ui/`, hooks, exports, scope).

Follow these rules when creating or modifying code.

## Naming

- **Folders:** kebab-case (`folder-name`, `my-component`, `app-layout`)
- **Files:** camelCase (`fileName.ts`, `useButton.ts`, `appLayout.tsx`)
- **Single-word folders** (`button`, `form`, `providers`) — no hyphen. **Multi-word** — always kebab-case.

| Entity | Style | Example |
|--------|-------|---------|
| Folder (feature, component) | kebab-case | `app-layout`, `app-menu` |
| File `.ts` / `.tsx` | camelCase | `appLayout.tsx`, `useAppMenu.ts`, `menuItems.ts` |
| React export (component, hook) | PascalCase / camelCase | `AppLayout`, `useAppMenu` |
| Public barrel | `index.ts` | always `index.ts` (except `services/` — see below) |

**File name ≠ export name.** File `appLayout.tsx` exports `export const AppLayout`.

**Exceptions** (fixed names, not camelCase):

- Next.js App Router: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`
- Barrel files: `index.ts` (not for `services/`)
- Route folders in `app/` — kebab-case (`vs/`); file names follow Next.js conventions above
- Route Handlers — only under `app/api/...` (e.g. `app/api/settings/route.ts`)

Identifier style (`I` prefix, short English names, etc.) — see `.cursor/rules/code-style.mdc`.

## Project layers

### Dependency rules

```
components  →  services  →  domain  ←  data
   (UI)      (scenarios)  (rules)    (storage)
```

| From | May import | Must NOT import |
|------|------------|-----------------|
| `components` | `services` (Server Actions only as entry); `import type` from `domain`; client wrappers in `components/shared/api` if needed | `data`; **any runtime** from `domain` (no calling domain functions/constants from UI) |
| `services` | `domain` (rules + repo interfaces), concrete repo from `data` | `components`; Prisma/SQL directly |
| `data` | `domain` (types, repository interfaces) | `services`, `components` |
| `domain` | nothing from other layers | `data`, `services`, `components`, Next, React, Prisma |

**Types vs runtime:** `components` may use `import type { … } from "@/domain/..."`. UI must **not** run domain business logic. Domain functions are called only from `services`.

**`'use server'`:** only on `services/` entry action files. Never on `domain/`. Never put `'use client'` in `services/` or `data/`.

**Repositories (wiring A):**

1. `domain` — interface, e.g. `ISettingRepository`
2. `data` — implementation (Prisma, etc.)
3. `services` — `import { settingRepository } from '@/data/...'` and call it; no Prisma/SQL inside the service

No DI container. Swap storage by rewriting `data/` under the same interfaces.

**Core rule:** `domain` depends on nothing else. Storage is replaceable; UI is replaceable.

### What goes in each layer

| Layer | Responsibility | Examples |
|-------|----------------|----------|
| `domain/` | Entities, validation, business rules, repository **interfaces** — pure TS | `ISetting`, `validateSetting`, `ISettingRepository` |
| `data/` | Repository **implementations**, DB connection, SQL/ORM, row mapping | `settingRepository.ts`, `dbClient.ts` |
| `services/` | One `'use server'` action per file — uses `domain` rules + repo from `data`. **No** `index.ts` barrels | `getSettings.ts`, `updateSettings.ts` |
| `components/` | React UI, display hooks, forms, layout | `AppLayout`, `SettingsForm` |
| `app/` | Thin route pages; Route Handlers only in `app/api/` | `app/settings/page.tsx`, `app/api/settings/route.ts` |

### `services/` imports and helpers

Do **not** create `services/index.ts` or `services/<feature>/index.ts`. Re-export barrels break `'use server'` / Server Actions.

Import the action file directly:

```ts
import { getSettings } from '@/services/settings/getSettings';
import { updateSettings } from '@/services/settings/updateSettings';
```

- One public action = one file; UI imports **only** action files.
- Private helpers next to actions are OK: `services/<feature>/helpers/...ts` — plain TS, **no** `'use server'`, not for the frontend.
- An action may call other actions or helpers inside `services/`.
- Domain rules stay in `domain/`, not forever dumped into service helpers.

### Next.js constraints

- `data/` and `services/` are **server-only** — no `'use client'`, no React imports
- `'use server'` — only `services/` action entry files
- Client UI must **not** import from `data/` or runtime `domain` — only Server Actions / Route Handlers / props from Server Components
- `domain/` is pure TypeScript — no React, no DB drivers, no Next.js APIs, no `'use server'`
- Route Handlers live **only** in `app/api/...`
- User-facing strings and errors — **Russian**
- Prisma schema workflow (early development): see `.cursor/rules/prisma.mdc`

### Where to put new code

```
New code →
  Renders on screen?       → components/
  Route page?              → app/ (pages); HTTP API → app/api/
  Orchestrates an action?  → services/ ('use server' entry)
  Business rule / entity / repo interface? → domain/
  DB read / write / repo impl? → data/
  UI utility / hook?       → components/shared/
  DB utility / mapping?    → data/shared/
  Pure utility (no UI/DB)? → domain/shared/
```

Group files by feature inside each layer: `domain/settings/`, `services/settings/`, `data/settings/`, `components/settings/`.

### Feature subfolders (`domain/`, `data/`, `services/`)

Do **not** let a feature folder grow into a flat pile of files.
Group by **concern** (what the code does), not by technical type alone.

**When to split**

- As soon as **2+ files share one concern** (`validation`, `helpers`, `search`, `crud`, …) — put them in a kebab-case subfolder.
- Soft limit: if the feature root has **~7+** `.ts` files (excluding `index.ts`, `types.ts`, `constants.ts`), regroup into concern subfolders.
- Keep at the feature root only thin entry/shared pieces: `types.ts`, `constants.ts`, and (for `domain/` / `data/`) `index.ts`.

**Good** — `domain/chunks`, `services/chunks`, `data/chunks`:

```
domain/chunks/
  types.ts
  constants.ts
  index.ts
  validation/          # validators
  helpers/             # pure helpers

services/chunks/
  importDocBundle.ts   # one-off / cross-cutting action OK at root
  crud/                # add / update / delete
  search/              # search / filter / rerank
  helpers/             # private plain-TS helpers (no 'use server')

data/chunks/
  searchByEmbedding.ts
  crud/
```

**Bad** — flat feature dump (e.g. `services/llm/` with many peer actions):

```
services/llm/
  checkTopicChanged.ts
  describeAttachedImage.ts
  expandSearchQueries.ts
  extractTermsFromMessage.ts
  isRelevant.ts
  planUserRequest.ts
  rewriteQueryForRag.ts
  …keeps growing
```

Prefer something like `services/llm/plan/`, `services/llm/rewrite/`, `services/llm/relevance/` — or another split that matches real concerns.

**Rules by layer**

| Layer | Subfolders | Barrels |
|-------|------------|---------|
| `domain/` | yes, by concern | `index.ts` at feature and concern folders OK |
| `data/` | yes, by concern | same |
| `services/` | yes, by concern | **still no** `services/**/index.ts` — import the action file by path |

Subfolder names: kebab-case, short, simple English (`crud`, `search`, `validation`, `helpers` — not `validation-utilities-and-guards`).

## TypeScript (structure)

- **Functions:** always declare with `const` and arrow syntax — never `function` declarations

  ```ts
  // ✅
  const getUserName = (user: IUser) => user.name;

  // ❌
  function getUserName(user: IUser) {
    return user.name;
  }
  ```

- **Types:** prefer `interface` over `type`. Use `type` only when `interface` cannot express the shape (unions, mapped types, tuples, etc.)
- **Interface names:** always prefix with `I` (`IUser`, `IButtonProps`, `IFormState`)
- Export-only-what-others-need and other style details — see `.cursor/rules/code-style.mdc`

## UI libraries

Use the UI stack already declared in the project's `package.json`. Do **not** add `@eos/*` packages. Do not invent a UI kit that the project does not use.

## Folder-component vs container

### Folder-component (has `ui/`)

A folder is a **component** if it contains a `ui/` subfolder.

```
button/
├── hooks/
│   └── useButton.ts
├── helpers/
│   └── getButtonStyle.ts
├── types/
│   └── index.ts
├── ui/
│   └── button.tsx
└── index.ts          # public API: export { Button } from './ui/button'
```

Rules:

- `ui/` contains **only** `.tsx` component files (wiring only — see code-style)
- `index.ts` at the folder root is the **only public entry point** for external imports
- Co-locate logic next to the component: `hooks/`, `helpers/`, `types/`, `constants/`
- **No `model/` folder** in UI components — UI logic lives in `hooks/`
- Never put DB queries in `components/`

### Container folder (no `ui/`)

If a folder has **no** `ui/`, it is **not** a component — it only groups other folders (e.g. `pages`, `widgets`).

Exception: standard non-component folder names (`hooks`, `helpers`, `types`, `constants`, `shared`) are never components by themselves.

## Simple vs composite components

### Simple component

One main component in `ui/`. Logic folders (`hooks`, `helpers`, etc.) may sit alongside `ui/`.

### Composite component

Parent has child **folder-components** as siblings. Each child owns its own logic.

- Parent may have its **own** `hooks/` for itself — children must **not** import the parent's hooks.
- Do **not** put hooks at the composite root for children to share. If several children need the same hook → put it in `shared` (local or `components/shared/`).

```
form/
├── text-input/
│   ├── hooks/
│   │   └── useTextInput.ts
│   ├── ui/
│   │   └── textInput.tsx
│   └── index.ts
├── submit/
│   ├── ui/
│   │   └── submit.tsx
│   └── index.ts
├── hooks/
│   └── useForm.ts       # parent's own hooks — children do not import these
├── ui/
│   └── form.tsx
└── index.ts
```

Real project example (composite layout):

```
components/app-layout/
├── app-menu/
│   ├── constants/menuItems.ts
│   ├── types/index.ts
│   ├── ui/appMenu.tsx
│   └── index.ts
├── ui/appLayout.tsx
└── index.ts
```

## Public API and imports (`index.ts`)

- `index.ts` defines what is **public**; everything else is **private** to that folder-component
- **Do not** import deep private paths from outside (e.g. `../../../../hooks/useButton`) — if the path is long, you are likely misusing a private module
- For `types/`, `constants/`: one `index.ts` re-exporting all entities is OK when there are few files
- Barrels are for **folder-components**, `domain/`, and `data/` — **not** for `services/` (import action files by path, see above)

## Shared code (layer-scoped)

There is **no** root-level `shared/` folder. Reusable code lives in `shared/` **inside its layer**:

| Location | What goes here | Examples |
|----------|----------------|----------|
| `components/shared/` | UI hooks, display formatters, client-only helpers | `useDebounce`, `formatDateForDisplay` |
| `domain/shared/` | Pure utilities with no React, no DB | shared validators, common types |
| `data/shared/` | DB connection, row mapping, persistence helpers | `dbClient`, `mapRowToEntity` |

Rules:

- Code that touches DB, `fetch` to backend, or `fs` → `data/` only, never `components/shared/`
- Code with React hooks or JSX → `components/` only, never `domain/` or `data/`
- If reused only within one folder-component tree → local `shared/` inside that component (private, not re-exported through parent `index.ts`)
- If something from a local `shared/` is needed elsewhere → move it to the appropriate layer `shared/` (`components/shared/`, `domain/shared/`, or `data/shared/`)

## Flexibility

These rules are a framework, not dogma. Small pragmatic exceptions are OK when they improve clarity or speed. When unsure, prefer consistency with nearby code and discuss with the team.

## Quick checklist for the agent

Before creating files, ask:

1. Renders on screen? → `components/` (or `app/` for a route page)
2. HTTP API route? → `app/api/...` only
3. Orchestrates an action? → `services/` (one `'use server'` file per action, **no** `index.ts`, deep import)
4. Business rule / entity / repo **interface**? → `domain/` (pure TS, no `'use server'`)
5. DB read/write / repo **impl**? → `data/` (Prisma: `db push` — see `.cursor/rules/prisma.mdc`); service imports repo from `data`, no Prisma in service
6. Reusable utility? → `shared/` inside the correct layer, not at project root
7. Feature folder grouped by concern (no flat pile in `domain`/`data`/`services`)?
8. Is this a component? → create `ui/` + root `index.ts`; **no** `model/` — logic in `hooks/`
9. Composite? → parent may have own `hooks/`; children do not import them; shared hook for several children → `shared`
10. Is it reusable only locally? → local `shared/` inside the folder-component, not exported in parent `index.ts`
11. Is the import path long and ugly? → probably a private import — fix structure instead
12. `components` imports from `domain` only via `import type`? No runtime domain / no `data` in UI?
13. `'use server'` only on `services/` actions? `domain` / `data` without Next/React directives?
14. Folder kebab-case? File camelCase? (not PascalCase for `.tsx` — `appLayout.tsx`, not `AppLayout.tsx`)
15. UI from the project's `package.json` (no `@eos/*`)?
16. User-facing strings/errors in Russian?
17. Code style (names, if, ternaries, thin `ui/`, hooks, exports, scope)? → `.cursor/rules/code-style.mdc`
18. Only code that was requested — no extra mocks/messages?
