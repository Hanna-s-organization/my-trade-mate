# My Trade Mate

Vite + React + TypeScript trading journal app with Supabase auth and data storage.

## Local development

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env`
3. Fill in:
   `VITE_SUPABASE_URL`
   `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Start the app:
   `npm run dev`

## Vercel deployment

Use these project settings in Vercel:

- Framework Preset: `Vite`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

Required environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

SPA routing is configured via `vercel.json`, so direct visits to routes like
`/reset-password` correctly resolve to the app.
