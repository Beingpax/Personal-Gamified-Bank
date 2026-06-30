# Personal Bank

Personal Bank is a local-first personal reward app for turning daily effort into imaginary money, milestones, spins, and earned rewards.

The “money” in this app is not real budgeting or finance data. It is an arbitrary score you assign to the tasks, habits, chores, study sessions, workouts, or other work you complete each day. You log one total amount per day, set money targets for yourself, and earn reward-wheel spins when your logged total crosses those targets.

## How It Works

1. Add your daily money total.
2. Create money targets such as `$1,000`, `$2,000`, or `$5,000`.
3. Reach a target to unlock one spin.
4. Add rewards you actually want.
5. Flick the wheel to spend a spin and earn one reward.
6. Review your claimed rewards in the reward history.

Each target can unlock one spin once. If one daily log pushes you past multiple targets, the app grants multiple available spins.

## Main Screens

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

After a reward is earned, the result must be acknowledged with **Get reward**. The earned reward is then removed from future wheel spins and added to reward history.

### Rewards

The rewards screen lets you manage the wheel contents and see previous results. Each reward gets one equal wheel slice. You can add or remove rewards at any time, and claimed rewards appear in the history list with the date and time they were earned.

## Data Storage

Personal Bank stores all data in the browser with `localStorage` under the key `personal-bank-v1`. There is no account system, backend server, cloud sync, or database.

Because storage is local to the browser, clearing site data or using another browser/device will not carry your logs, targets, rewards, or history with it.

The app also reads the legacy key `reward-cockpit-money-v1` so older saved data can be migrated automatically.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Motion for screen/result animation
- Lucide React icons

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

- `src/App.tsx` coordinates app state, target progress, spin spending, and screen routing.
- `src/app/` contains shared state, storage, formatting, daily log, and progress helpers.
- `src/features/targets/` contains the target dashboard and daily ledger.
- `src/features/wheel/` contains wheel rendering, reward segment math, and spin interaction.
- `src/features/rewards/` contains reward editing and reward history.
- `src/components/` contains layout and reusable UI components.
