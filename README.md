# StepCorrect V2 MVP

StepCorrect is a calm, premium, recovery-focused web app for daily inventory, step work, check-ins, and sponsor-style reflection.

## Routes

Public:

- `/`
- `/how-it-works`
- `/pricing`
- `/safety`
- `/login`
- `/signup`

App:

- `/app`
- `/app/inventory`
- `/app/inventory/new`
- `/app/inventory/[id]/clarify`
- `/app/inventory/[id]/review`
- `/app/inventory/[id]/actions`
- `/app/inventory/[id]`
- `/app/check-in`
- `/app/steps`
- `/app/settings`

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn-style UI primitives
- Supabase-ready repositories with local JSON fallback
- OpenAI Responses API integration for live classification and resentment extraction
- OpenAI Embeddings-based similarity memory and weekly pattern feedback
- Expo Router React Native mobile app scaffold in `apps/mobile`
- Shared StepCorrect core package in `packages/core`

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy env vars:

```bash
cp .env.example .env.local
```

3. Optional: add Supabase values in `.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

4. Start the app:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

If Supabase env vars are missing, StepCorrect runs in local demo mode using `.data/stepcorrect-store.json`.
If `OPENAI_API_KEY` is missing, or a model call fails, the web app falls back to deterministic local classification, extraction, and feedback logic.
The first local demo store is seeded with a few historical resentment entries, actions, check-ins, and local fallback embeddings so pattern memory works immediately in dev mode.

## Mobile app

The newer standalone React Native app now lives in [mobile](mobile). The older scaffold remains in [apps/mobile](apps/mobile) as reference.

The dedicated mobile build reuses shared StepCorrect types and deterministic fallback logic from [packages/core](packages/core), and ships with seeded local demo data so inventory, pattern cards, and weekly reflection work on first launch.

Run it with:

```bash
cd mobile
npm install
npm run dev
```

## Supabase schema

Apply:

- [20260409121500_create_inventory_entries.sql](supabase/migrations/20260409121500_create_inventory_entries.sql)
- [20260409170000_stepcorrect_v2_schema.sql](supabase/migrations/20260409170000_stepcorrect_v2_schema.sql)
- [20260409194500_add_pattern_memory.sql](supabase/migrations/20260409194500_add_pattern_memory.sql)

The third migration adds embedding memory and stored weekly pattern feedback.

## Web AI layer

The live web flow now uses:

- [classify-inventory.ts](lib/ai/classify-inventory.ts)
- [extract-resentment.ts](lib/ai/extract-resentment.ts)
- [create-embedding.ts](lib/ai/create-embedding.ts)
- [generate-feedback-cards.ts](lib/ai/generate-feedback-cards.ts)
- [build-pattern-summary.ts](lib/patterns/build-pattern-summary.ts)
- [client.ts](lib/openai/client.ts)

The mobile/shared package in [packages/core/src/inventory.ts](packages/core/src/inventory.ts) still uses deterministic local logic for now.

The fallback seed flow still supports:

- raw entry: `I’m resentful at my sister`
- clarification: `Criticized my recovery`
- exact clarifying question and exact resentment extraction from the product spec

## Current placeholders

- Auth UI is scaffolded but not wired to Supabase auth yet
- Reminder preferences, export, and delete actions are UI placeholders
- Fear extraction is reserved but not implemented beyond schema support
