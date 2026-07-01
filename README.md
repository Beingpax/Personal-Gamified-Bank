# Personal Bank

Personal Bank is a local-first personal reward app for turning daily effort into imaginary money, milestones, spins, and earned rewards.

The money in this app is not real budgeting or finance data. It is an arbitrary score you assign to the tasks, habits, chores, study sessions, workouts, or other work you complete each day. You log one total amount per day, set money targets for yourself, and earn reward-wheel spins when your logged total crosses those targets.

## How It Works

1. Add your daily money total.
2. Create money targets such as `$1,000`, `$2,000`, or `$5,000`.
3. Reach a target to unlock one spin.
4. Add rewards you actually want.
5. Flick the wheel to spend a spin and earn one reward.
6. Review your claimed rewards in the reward history.

Each target can unlock one spin once. If one daily log pushes you past multiple targets, the app grants multiple available spins.

## Screens

### All Targets

The targets screen is the main dashboard. It shows:

- Total logged money.
- Progress toward the next active target.
- Completed, active, locked, and reward-granted targets.
- A daily log editor for the selected date.
- A ledger of saved daily totals.

Only days you save appear in the daily log. Missing days are simply ignored.

When a spin has already been spent for a milestone, the app locks the target and the earliest daily log entries needed to justify that earned reward. This protects past rewards from being accidentally invalidated while still allowing later editable logs and new targets.

### Spin Wheel

The wheel screen shows your available spins and current rewards. To spin, grab the wheel and flick it. A spin is only spent if the flick is fast enough. When the wheel stops, the reward under the pointer is recorded as earned.

After a reward is earned, acknowledge the result with **Yay!**. The win is recorded in reward history, removed from the active wheel, and shown on the reward shelf.

### Rewards

The rewards screen lets you manage the wheel contents and see previous results. Each active reward gets one equal wheel slice. You can add or remove rewards at any time, and claimed rewards leave the active wheel and appear in the history list with the date and time they were earned.

## Data And Sync

Personal Bank is local-first. The browser stores active app data in IndexedDB through Dexie, so the app stays usable without an account or network connection.

When Supabase is configured and the user signs in with email magic-link auth, local changes are queued in IndexedDB and uploaded to Supabase. The app also pulls remote rows back into the local database. Soft deletes are synced with `deleted_at` timestamps so removed targets, logs, rewards, and spin claims can converge across devices.

Existing legacy `localStorage` data under `personal-bank-v1` is decoded, validated, and migrated into IndexedDB the first time the local database opens. Missing fields are merged with defaults, invalid array items are skipped, and malformed legacy data falls back to a fresh initial state rather than being trusted as `AppState`.

Sync status appears in the top bar:

- `Local`: no signed-in Supabase session, or Supabase is not configured.
- `Syncing`: queued changes are being pushed and remote records are being pulled.
- `Synced`: the latest sync attempt completed.
- `Offline`: the browser is offline and changes are waiting locally.
- `Pending`: a sync attempt failed and queued changes remain local.

## Supabase Setup

Database changes are managed through Supabase CLI migrations. This project is linked to the Supabase project, and the current schema lives in `supabase/migrations/`.

Apply pending migrations:

```bash
npx supabase db push
```

Set the frontend environment variables:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

Enable email login in Supabase Auth. Magic-link login is used by default.

## Upload / Deployment

The app is configured for Cloudflare Workers static assets through `wrangler.jsonc`.

Build the static app:

```bash
npm run build
```

Upload the built `dist` assets with Wrangler:

```bash
npx wrangler deploy
```

The Wrangler config uses `not_found_handling: "single-page-application"` so direct navigation to app routes can still load the React app.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Supabase Auth and Postgres
- Dexie for IndexedDB
- Motion for screen/result animation
- Lucide React icons
- Cloudflare Wrangler for static asset upload

## Development

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run linting:

```bash
npm run lint
```

## Project Structure

- `src/App.tsx` coordinates screen routing and wheel animation state.
- `src/app/usePersonalBankState.ts` owns app state, local writes, sync triggers, auth state, and view selectors.
- `src/app/localDb.ts` contains the IndexedDB schema, local CRUD helpers, pending sync queue, and legacy import entry point.
- `src/app/sync.ts` pushes pending local changes to Supabase and merges remote rows back into IndexedDB.
- `src/app/storage.ts` decodes legacy `localStorage` data for migration.
- `src/app/targetProgress.ts` contains target reconciliation, locking, milestone status, and progress helpers.
- `src/features/targets/` contains the target dashboard and daily ledger.
- `src/features/wheel/` contains wheel rendering, reward segment math, and spin interaction.
- `src/features/rewards/` contains reward editing and reward history.
- `src/components/` contains layout and reusable UI components.
