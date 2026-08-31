# Mac Migration Notes

Audit date: 2026-08-31.

## What To Clone

Main app repository:

```text
C:\Users\Bazykina\Desktop\trading tracker\my-trade-mate-git
```

Remote:

```text
https://github.com/Hanna-s-organization/my-trade-mate.git
```

Branch:

```text
main
```

## What To Transfer Separately

Do not rely only on `git clone`. Also preserve:

- local `.env` values;
- Vercel project settings/environment variables;
- Supabase project access;
- browser `localStorage` trading journal data if real trade records exist only in the browser;
- sibling WIP folder `C:\Users\Bazykina\Desktop\trading tracker`;
- separate knowledge base folder `C:\Users\Bazykina\Desktop\hueta`.

## Environment Variables

Required variable names:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Do not paste values into public docs, GitHub issues, or chat unless explicitly needed and safe.

## Mac Setup

Install:

- Git
- Node.js 20 or newer
- npm
- optional: Vercel CLI

Then run:

```bash
npm install
npm run dev
npm run build
npm run test
npm run lint
```

## Known Migration Risks

- `.env` was tracked by Git during the Windows audit. The repo history and any Git bundle may contain environment values.
- The app currently uses browser `localStorage` for trade journal data. A fresh browser on Mac will not automatically have this data.
- The parent folder contains WIP files that are not part of the Git repository.
- There are both npm and Bun lock files. README and package metadata point to npm as the primary package manager.
- `.vercel` is local project-link metadata and is ignored by Git.

## Safe Recovery

The migration kit created during audit contains:

- a source archive without `.env`;
- a sensitive `.env` archive;
- a sensitive Git history bundle;
- a parent-folder WIP archive;
- a `hueta` knowledge-base archive.

Keep sensitive archives private.

