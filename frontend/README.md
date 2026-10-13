# File Guide — What's Common vs. What's Not

This explains every file/folder in the frontend, what it's for, and why
it's classified as **common** (shared, single source of truth, whole team
must follow it) or **not common** (feature-specific, owned by one
view/component, safe to change without affecting others).

**Rule of thumb:** if two or more features would break/diverge when a file
changes, it's common. If only one feature touches a file, it's not common.

---

## Root config files — COMMON

These aren't feature code — they're rules the whole team is bound by.
Changing them affects every file in the project at once.

| File | What it is | Why common |
|---|---|---|
| `vite.config.ts` | Build tool config (dev server, path aliases, plugins) | One dev server config for everyone. If it's wrong, nobody's app runs. |
| `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` | TypeScript compiler rules (strictness, target, path aliases) | Everyone's code is type-checked against the same rules — no one can quietly loosen strictness for their own file. |
| `package.json`, `package-lock.json` | Dependencies + scripts (`dev`, `build`, `lint`) | Locks everyone to the *same version* of every library. Without the lockfile, two devs could get different React/Tailwind versions and hit bugs the other can't reproduce. |
| `.gitignore` | What never gets committed | Same ignore rules for every contributor (e.g. nobody accidentally commits `.env` or `node_modules`). |
| `.env.example` | Documents required env vars (`VITE_API_BASE_URL`) without real values | Tells every dev what env vars they must set locally — the actual `.env` is personal/not committed. |
| `index.html` | Vite's single HTML entry point | There is only one entry point for the whole app — not per-feature. |

---

## Design-system / shared source — COMMON

These are imported by *multiple* views/components. If one dev changes
these carelessly, every screen that imports them changes too — so the
whole team has to agree on their contents.

| File | What it is | Why common |
|---|---|---|
| `src/index.css` | Tailwind entry + global styles/animations | Every component's Tailwind classes resolve against this one file's config/tokens. |
| `src/types/index.ts` | Shared TypeScript interfaces (`Transaction`, `View`, etc.) | If Transactions and Statement each invented their own `Transaction` type, they'd drift out of sync with the backend and with each other. One shared type = one source of truth. |
| `src/utils/formatters.ts` | Currency/date formatting helpers | If every view formatted amounts differently, the app would show inconsistent numbers for the same data. |
| `src/api/client.ts` | Base HTTP client (base URL, headers, error handling) | Every API call in the app goes through this. One place to change the backend URL, auth headers, or error handling. |
| `src/api/transactions.ts`, `src/api/statement.ts` | Wrappers around specific backend endpoints | Common in the sense that *multiple views* call these same functions (e.g. Transactions view and the modal both use `transactions.ts`) — one function, reused, instead of each view writing its own `fetch()` call with slightly different logic. |
| `src/components/common/*` (ActionButton, Avatar, FormField, FormSelect, PageHeading, Toast) | Reusable UI primitives | These are used across multiple views. If `ActionButton` looked different in each place it was copy-pasted, buttons wouldn't look consistent across the app. |
| `src/components/layout/*` (AppLayout, Header, NavButton, Sidebar) | App shell — wraps every screen | There's only one layout wrapping the whole app; every view renders inside it. Changing it changes the frame around everything. |
| `src/components/tables/TransactionTable.tsx` | Shared table used by both Transactions and Statement views | Two different views render the exact same table component — so its columns, empty state ("no data recorded"), and row rendering must be defined once, not duplicated. |

---

## Feature-specific files — NOT COMMON

These belong to exactly one feature/view. Changing them only affects that
one screen — no team-wide coordination needed, and no other feature
imports them.

| File | What it is | Why NOT common |
|---|---|---|
| `src/views/transactions/TransactionsView.tsx` | The Transactions screen (landing page) — search, filter, "Add transaction" button | Only this one screen uses this file. Statement doesn't import it. |
| `src/views/statement/StatementView.tsx` | The Statement screen — date range, totals | Only this one screen uses this file. Transactions doesn't import it. |
| `src/views/statement/StatementMetric.tsx` | A single stat card used only inside StatementView | Scoped to one parent view — not reused elsewhere. |
| `src/components/modals/TransactionModal.tsx` | The "create transaction" form modal | Only opened from the Transactions view. Nothing else depends on it. |
| `src/App.tsx` | Wires views together, owns top-level state (current view, transaction list) | Technically only one file "owns" this — it's not reused, just the orchestrator. Borderline common (everyone is affected if it breaks) but not shared/imported by other files. |
| `src/main.tsx` | Vite/React mount point | Exists once, does one job (`ReactDOM.createRoot(...).render(<App/>)`) — nothing imports it. |
| `src/vite-env.d.ts` | Type declarations for Vite-specific globals (e.g. `import.meta.env`) | Auto-generated/boilerplate, not something the team collaborates on. |
| `public/favicon.svg` | Browser tab icon | Single static asset, not logic, not shared code. |

---

## Removed / not part of the app

| File | Status |
|---|---|
| `src/views/overview/` | **Deleted.** Overview screen removed from the app entirely. |
| `src/views/settings/` | **Deleted.** No backend feature exists for Settings; removed from nav and codebase. |
| `src/data/mockTransactions.ts` | **Inert/unused.** Kept as an empty placeholder only — must not be imported anywhere. All tables must show real backend data or a "no data recorded" empty state, never mock rows. |

---

## Quick mental model

```
COMMON        = "if I change this, other files/features might break"
                 (config, types, api layer, shared UI primitives, layout)

NOT COMMON    = "if I change this, only this one screen is affected"
                 (a specific view, a modal only that view opens)
```

The `src/api/` folder sits in the **common** bucket not because it talks to
the backend's source code (it never imports Python files — see below), but
because *multiple frontend features* share the same request functions
instead of each writing its own duplicate `fetch()` call.

### Why `src/api/` doesn't import from the backend folder

The frontend (`.tsx`/`.ts`, runs in the browser) and backend
(`krissaco-final2`, `.py`, runs on a server) are separate processes in
separate languages. There is no file-level import between them — the only
connection is **HTTP over the network**: the frontend sends a request to a
URL, the backend (once running as a live server) queries its database and
sends back JSON. `src/api/*.ts` files just know the URL and the expected
JSON shape — that's the entire "contract," not a code dependency.
