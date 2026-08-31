# Codex Instructions For My Trade Mate

This repository contains `My Trade Mate`, a Vite + React + TypeScript trading journal app.

## Project Overview

- Frontend: React 18, TypeScript, Vite.
- UI: Tailwind CSS, shadcn-style components, Radix UI, lucide-react.
- Routing: React Router.
- Data/auth integration: Supabase client under `src/integrations/supabase/`.
- Local app state: trading journal entities are currently also stored in browser `localStorage` through `src/lib/trades-storage.ts`.
- Deployment target: Vercel, configured by `vercel.json`.

## Setup

Use Node.js `>=20` and npm.

```bash
npm install
npm run dev
npm run build
npm run test
npm run lint
```

Required environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID` may exist locally for project reference.

Do not print secret values in chat or commit new secret values.

## Architecture Map

- `src/App.tsx` defines the main route tree.
- `src/pages/` contains screen-level pages: dashboard/index, trades, trade details, strategy, database, auth, reset password, not found.
- `src/components/` contains app-specific UI and journal/dashboard components.
- `src/components/ui/` contains reusable shadcn/Radix UI primitives.
- `src/hooks/useAuth.tsx` handles Supabase auth session behavior.
- `src/hooks/useTrading.ts` coordinates trading data behavior.
- `src/lib/trades-storage.ts` defines localStorage keys, default trading entities, normalization, and derived trade calculations.
- `src/lib/types.ts` contains the main app domain types.
- `supabase/migrations/` contains database schema migrations.

## Trading Knowledge Boundary

Trading methodology and course rules are not fully contained in this app repository.

The local course knowledge base currently lives in a separate workspace:

```text
C:\Users\Bazykina\Desktop\hueta\trading-ai-knowledge-base
```

When continuing product work that depends on trading-course rules, read that knowledge base first, especially:

- `AGENTS.md` in the `hueta` workspace
- `trading-ai-knowledge-base/WIKI_SCHEMA.md`
- `trading-ai-knowledge-base/00_index.md`
- `trading-ai-knowledge-base/10_bot_rules/source_of_truth_policy.md`
- `trading-ai-knowledge-base/10_bot_rules/current_chat_handoff.md`

Do not use generic trading, SMC, ICT, TA, macro, or internet assumptions as source of truth for this user's trading rules unless the user explicitly asks for external comparison.

Current phase: learning and knowledge accumulation. Do not create live trade signals, entries, stop losses, or take profits unless the user explicitly changes this phase.

## Current Product Direction

The app is evolving toward a personal trader workspace:

- journal for taken trades;
- journal support for missed trades, early exits, and skipped trades;
- dashboard summaries;
- account/pair/session/style registries;
- later connection to the local trading knowledge base;
- later analytics around execution quality, fear, missed entries, RR, sessions, and repeated mistakes.

Important WIP outside this Git repository may exist in:

```text
C:\Users\Bazykina\Desktop\trading tracker
```

Before major edits, check whether useful newer work exists in that parent folder, especially:

- `trading-journal-feature-notes.md`
- parent `src/`
- strategy scanner files

## Migration Notes

- This repository has a GitHub remote: `https://github.com/Hanna-s-organization/my-trade-mate.git`.
- The branch used during the Windows migration audit was `main`.
- The working tree was clean during the audit.
- `.env` was tracked by Git during the audit even though `.gitignore` ignores `.env`; treat repository history and bundles as sensitive until Supabase keys are reviewed/rotated.
- `node_modules`, `dist`, `.vercel`, logs, and build info are generated/local and should normally be regenerated on a new Mac.

