# Reward Cockpit

Reward Cockpit is a local-first React/Vite app for turning daily dollar logs into money milestones, earned spins, and reward-wheel results. It stores all data in the browser with `localStorage`, so no account or server is required.

## Features

- Save one dollar total for each selected day.
- Track ordered targets such as `$1,000`, `$2,000`, and `$3,000`.
- Show progress only on the current milestone; future milestones stay locked until reached.
- Earn one spin whenever logged dollars cross a target, including large entries that clear multiple targets.
- Spend spins on a grab-and-flick reward wheel.
- Remove earned rewards from the wheel and keep a private reward history.
- Preserve corrected accounting when logs or targets change.

## Development

```bash
npm install
npm run dev
```

The app stores data locally in the browser with `localStorage`.
