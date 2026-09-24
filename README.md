# Turf Control — Race Admin Panel

React (JS, no TypeScript) admin dashboard for the horse race betting game. All data here is mock data in `src/data/mockData.js` — wire your real API in by replacing that file's exports with fetch calls (e.g. React Query or plain `fetch` in `useEffect`).

## Run locally

```bash
npm install
npm run dev
```

Opens at http://localhost:5173

## Structure

- `src/pages/Dashboard.jsx` — live round status, revenue chart, top horse, recent rounds
- `src/pages/Horses.jsx` — manage the 12 runners: odds, gate number, active/paused, add/edit modal
- `src/pages/Rounds.jsx` — round history + provably-fair seed verification modal
- `src/pages/Users.jsx` — player list, coin balance adjustment modal, ban/unban
- `src/pages/Bets.jsx` — full bet ledger with won/lost filter
- `src/pages/Settings.jsx` — stake denominations, bet limits, round cycle timing, jackpot cap
- `src/components/` — Sidebar, Topbar (live 40s round-phase ticker), Modal, Badge, StatCard

## Wiring to your real backend

Each page currently does `useState(mockArray)`. Swap that for your API response shape — the mock data in `mockData.js` is already shaped to match the schema discussed (rounds, horses, users, bets), so most pages should need only the data-fetching swapped, not the UI.

The Topbar's round clock is a local 40-second simulation (`CYCLE = 40`) — replace `useRoundClock` with a socket subscription to your real round-state broadcast so all admins see the same phase/countdown in sync.

## Notes

- No outcome-fixing / result-prediction feature is included by design — round results should come from your provably-fair engine (server seed + client seed + nonce), verifiable per-round in the Rounds page.
- Tailwind theme tokens (colors, fonts) live in `tailwind.config.js`.
# horsh-riding-api
# Horse-riding-adminpanel
# Horse-riding-adminpanel
