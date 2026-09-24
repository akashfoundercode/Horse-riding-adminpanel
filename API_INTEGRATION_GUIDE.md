# Turf Control Admin — API & Socket.IO Integration Guide

**Version:** 1.0  
**Prepared:** 23 September 2026  
**Audience:** Backend/API team and mobile/app integration team  
**Contract source:** Current Turf Control admin frontend (`src/services/*`, `src/hooks/useHorseRaceSocket.js`, `src/context/GameEngineContext.jsx`).

> This guide documents the endpoints and events the current frontend expects. It is not proof that these routes are already deployed. Confirm the canonical routes, auth policy, and response fields with the backend owner before production. Paths below are relative to the API base URL.

## 1. API base URLs and auth

Use separate base URLs if REST and Socket.IO are hosted separately:

- **REST base:** `https://<api-host>`; routes in this document start with `/api/...`.
- **Socket.IO origin:** `https://<socket-host>`; frontend currently connects to the origin root with Socket.IO (default namespace `/`). If hosted under a custom path/namespace, configure it explicitly in the app.
- Local default in current code: `http://localhost:3000`.
- Do not include `/api` in the configured base URL. Current frontend trims a trailing `/api` automatically.

REST requests use `Authorization: Bearer <JWT>` when a token is present and `Content-Type: application/json` for JSON requests. Horse image upload uses `multipart/form-data` and must let the browser set the boundary. The token is currently read from `localStorage.turf_admin_token` for admin routes; some user/game routes also allow `turf_user_token`.

**Auth gap to resolve:** Current login UI is demo/local-only; it does not call an auth REST endpoint and creates a sample token. This repo therefore does not define a login URL, credential payload, token expiry/refresh, or role claims. Backend must provide the real admin login contract and frontend must wire it before secured production integration. All `/admin` operations must enforce server-side admin authorization regardless of UI.

## 2. Conventions

- JSON response shape should be consistent, preferably `{ "success": true, "data": ..., "message": "..." }`; list responses should include a named array plus pagination metadata.
- Identifiers: `:id` is a user/horse primary key; `gameSerial` / `game_serial` identifies a race. Treat IDs/serials as strings where leading zeros may occur.
- Amounts are INR numeric values, with `type` explicitly `credit` or `debit` and `amount` a positive absolute value.
- For list endpoints support `limit` and `page`; validate/clamp them server-side. The frontend reads common array wrappers (`users`, `bets`, `transactions`, `matches`, `results`, `data`, `items`, `history`). Choose and document one canonical response.
- Suggested common errors: `400` invalid input, `401` missing/invalid token, `403` insufficient role, `404` missing resource, `409` conflicting race state/idempotency, `422` business validation, `500` server error. Return a stable JSON error such as `{ "success": false, "message": "...", "code": "..." }`.

## 3. REST endpoints

All URLs below are relative to the REST base URL from Section 1. `:id`, `:gameSerial`, and `:gameCode` are path parameters. Unless specified otherwise, requests use `Authorization: Bearer <admin-jwt>` and JSON responses.

### 3.1 Users and game session

#### List users — canonical endpoint

- **Purpose:** Load and search players for the admin Users screen.
- **Method:** `GET`
- **URL:** `/api/games/users`
- **Request Body:** None. Query parameters: `search` (optional), `status` (optional), `limit` (optional), `page` (optional).
- **Response:** `200 OK`, `{ "users": [{ "id": "usr_105", "username": "rahul123", "email": "rahul@example.com", "status": "active", "role": "user", "gameCode": "GC20260923001", "wallet": { "balance": 12000, "currency": "INR" }, "createdAt": "2026-09-23T08:00:00.000Z" }], "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 } }`.

#### List users — compatibility fallbacks

- **Purpose:** Compatibility alternatives if the canonical user-list route is not implemented. The frontend tries these after `/api/games/users`.
- **Method:** `GET`
- **URL:** `/api/games/all` or `/api/users`
- **Request Body:** None. Same query parameters as the canonical list endpoint.
- **Response:** Same user-list response shape as `/api/games/users`.

#### Get user by ID

- **Purpose:** Fetch one player's profile and account details.
- **Method:** `GET`
- **URL:** `/api/users/:id`
- **Request Body:** None.
- **Response:** `200 OK`, `{ "user": { "id": "usr_105", "username": "rahul123", "status": "active", "gameCode": "GC20260923001", "wallet": { "balance": 12000, "currency": "INR" } } }` (or the user object directly; choose one canonical wrapper).

#### Find user by game code

- **Purpose:** Resolve a player using their game code.
- **Method:** `GET`
- **URL:** `/api/users/game-code/:gameCode`
- **Request Body:** None. URL-encode the game code path parameter.
- **Response:** `200 OK`, `{ "user": { ... } }` (or user object directly).

#### Create user

- **Purpose:** Create a player account from the admin Users screen.
- **Method:** `POST`
- **URL:** `/api/users`
- **Request Body:** JSON player fields. The frontend passes the form fields and generates `gameCode` when none is supplied. Example: `{ "username": "rahul123", "email": "rahul@example.com", "gameCode": "GC20260923001", "status": "active" }`.
- **Response:** `201 Created`, `{ "success": true, "user": { "id": "usr_105", "username": "rahul123", "gameCode": "GC20260923001", "status": "active" }, "message": "User created" }`.

#### Update user

- **Purpose:** Update player profile/status; current UI uses it for status changes.
- **Method:** `PUT`
- **URL:** `/api/users/:id`
- **Request Body:** JSON partial/update fields. Current status example: `{ "status": "active" }`.
- **Response:** `200 OK`, `{ "success": true, "user": { "id": "usr_105", "status": "active" } }`.

#### Generate game code

- **Purpose:** Regenerate or assign a game code to a player.
- **Method:** `POST`
- **URL:** `/api/users/:id/game-code`
- **Request Body:** None.
- **Response:** `200 OK`, `{ "success": true, "gameCode": "GC20260923002" }` (the frontend also accepts `code`).

#### Delete user

- **Purpose:** Remove a player account. Service exists; this is not currently a main UI flow.
- **Method:** `DELETE`
- **URL:** `/api/users/:id`
- **Request Body:** None.
- **Response:** `200 OK`, `{ "success": true, "message": "User deleted" }`.

#### Initialize game session

- **Purpose:** Initialize or retrieve a game session for the authenticated game user.
- **Method:** `POST`
- **URL:** `/api/games/initialize`
- **Request Body:** JSON object; current frontend defaults to `{}` and does not define required fields. Backend and app team must agree on the session initialization fields.
- **Response:** `200 OK` or `201 Created`, session/game information, e.g. `{ "success": true, "game": { "id": "game_1", "gameCode": "GC20260923001", "status": "active" } }`.

#### Get my game session

- **Purpose:** Return the logged-in user's active game code/session.
- **Method:** `GET`
- **URL:** `/api/games/me`
- **Request Body:** None.
- **Response:** `200 OK`, `{ "game": { "id": "game_1", "gameCode": "GC20260923001", "status": "active" }, "gameCode": "GC20260923001" }`.

### 3.2 Horses

#### List horses

- **Purpose:** Load race runners and horse configuration for the admin Horses screen.
- **Method:** `GET`
- **URL:** `/api/horses`
- **Request Body:** None. Query: `status=all|active|inactive`; current client omits the query for `active`.
- **Response:** `200 OK`, `{ "horses": [{ "id": "horse_1", "name": "Thunder", "serial_number": 1, "status": "active", "odds": 3.5, "image_url": "https://cdn.example.com/horse.png", "color": "#EF4444", "jockey": "A. Kumar" }] }`.

#### Get horse

- **Purpose:** Fetch one horse's details.
- **Method:** `GET`
- **URL:** `/api/horses/:id`
- **Request Body:** None.
- **Response:** `200 OK`, `{ "horse": { "id": "horse_1", "name": "Thunder", "serial_number": 1, "status": "active", "odds": 3.5, "image_url": "https://cdn.example.com/horse.png" } }` (or horse object directly).

#### Create horse

- **Purpose:** Add a runner to the race configuration.
- **Method:** `POST`
- **URL:** `/api/horses`
- **Request Body:** JSON `{ "name": "Thunder", "serial_number": 1, "image_url": "https://cdn.example.com/horse.png", "status": "active", "odds": 3.5, "color": "#EF4444", "jockey": "A. Kumar" }`; for uploaded image, use `multipart/form-data` fields `name`, `serial_number`, `status`, optional `odds`, `color`, `jockey`, and file field `image` (frontend retries field name `file` for compatibility). Do not manually set multipart boundary.
- **Response:** `201 Created`, `{ "success": true, "horse": { "id": "horse_1", "name": "Thunder", "serial_number": 1, "image_url": "https://cdn.example.com/horse.png" } }`.

#### Update horse

- **Purpose:** Edit horse details, odds, status, or image.
- **Method:** `PUT`
- **URL:** `/api/horses/:id`
- **Request Body:** Partial JSON horse fields as above, or multipart fields for file upload.
- **Response:** `200 OK`, `{ "success": true, "horse": { "id": "horse_1", "name": "Thunder", "status": "active", "odds": 3.5 } }`.

#### Delete horse

- **Purpose:** Remove a horse from the configured runners.
- **Method:** `DELETE`
- **URL:** `/api/horses/:id`
- **Request Body:** None.
- **Response:** `200 OK`, `{ "success": true, "message": "Horse deleted" }`.

### 3.3 Bets and race history

#### Get live bet ledger

- **Purpose:** Load current/live bets for the Bets screen and race.
- **Method:** `GET`
- **URL:** `/api/bets/live-ledger`
- **Request Body:** None. Query: `game_serial` (optional), `raceId` (optional), `limit`, `page`, `status` (client sends status uppercase).
- **Response:** `200 OK`, `{ "bets": [{ "id": "bet_1", "userId": "usr_105", "username": "rahul123", "gameCode": "GC20260923001", "gameSerial": "20260923001", "horseId": "horse_1", "horseNumber": 1, "amount": 100, "odds": 3.5, "status": "OPEN", "createdAt": "2026-09-23T08:00:00.000Z" }], "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 } }`.

#### Get live bet ledger — fallback

- **Purpose:** Compatibility route used only when `/api/bets/live-ledger` returns HTTP 404.
- **Method:** `GET`
- **URL:** `/api/bets/live`
- **Request Body:** None. Same query parameters as `/api/bets/live-ledger`.
- **Response:** Same live bet ledger response shape.

#### List all bets

- **Purpose:** Fetch historical/all bet records and apply ledger filters.
- **Method:** `GET`
- **URL:** `/api/bets`
- **Request Body:** None. Query: `limit`, `page`, `status`, `game_serial`.
- **Response:** `200 OK`, `{ "bets": [{ "id": "bet_1", "userId": "usr_105", "gameSerial": "20260923001", "horseNumber": 1, "amount": 100, "status": "won", "payout": 350, "createdAt": "2026-09-23T08:00:00.000Z" }], "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 } }`.

#### Get live bet pool — canonical endpoint

- **Purpose:** Get current race total pot and bet distribution by horse.
- **Method:** `GET`
- **URL:** `/api/admin/races/live-bets`
- **Request Body:** None.
- **Response:** `200 OK`, `{ "gameSerial": "20260923001", "totalPot": 12500, "totalBets": 48, "horsePots": { "1": 2500, "2": 10000 } }`.

#### Get live bet pool — compatibility fallbacks

- **Purpose:** Compatibility alternatives if the canonical pool route is unavailable.
- **Method:** `GET`
- **URL:** `/api/bets/pool` or `/api/races/live-bets`
- **Request Body:** None.
- **Response:** Same live pool response shape.

#### Get previous race results — canonical endpoint

- **Purpose:** Load recent completed race results for Rounds/History screens.
- **Method:** `GET`
- **URL:** `/api/races/previous-results`
- **Request Body:** None. Query: `limit`, `page`.
- **Response:** `200 OK`, `{ "results": [{ "gameSerial": "20260923001", "winner": { "horseId": "horse_1", "number": 1, "name": "Thunder" }, "finishOrder": [{ "rank": 1, "number": 1, "name": "Thunder", "time": "58.10s", "gap": "-" }], "totalBets": 12500, "totalPayout": 9000, "ggr": 3500, "seedHash": "sha256:...", "finishedAt": "2026-09-23T08:01:00.000Z" }], "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 } }`.

#### Get race history — compatibility fallbacks

- **Purpose:** Compatibility alternatives for recent race results/history.
- **Method:** `GET`
- **URL:** `/api/races/history`, `/api/admin/races/history`, `/api/matches`, or `/api/races`
- **Request Body:** None. Query: `limit`, `page`.
- **Response:** Same completed-results response shape as `/api/races/previous-results` (frontend accepts `results` or `matches`).

**Integration boundary:** The current admin service modules do not define REST endpoints for placing bets or settling a race. The player app/backend contract must define bet placement separately; result generation, acceptance, settlement, payouts and balances must remain server-authoritative.

### 3.4 Wallet and ledger

#### List wallet transactions — canonical endpoint

- **Purpose:** Load the admin wallet ledger and transaction history.
- **Method:** `GET`
- **URL:** `/api/admin/wallets/transactions`
- **Request Body:** None. Query: `userId`, `gameCode`, `type`, `category`, `limit`, `page`.
- **Response:** `200 OK`, `{ "transactions": [{ "id": "tx_1", "userId": "usr_105", "username": "rahul123", "type": "credit", "category": "win", "amount": 350, "balanceBefore": 12000, "balanceAfter": 12350, "referenceId": "RACE-20260923001", "description": "Bet win", "status": "completed", "currency": "INR", "createdAt": "2026-09-23T08:01:00.000Z" }], "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 } }`.

#### List wallet transactions — compatibility fallbacks

- **Purpose:** Compatibility alternatives for the wallet ledger list.
- **Method:** `GET`
- **URL:** `/api/wallet/transactions`, `/api/wallet/ledger`, `/api/admin/wallets/ledger`, or `/api/admin/ledger`
- **Request Body:** None. Same query parameters as the canonical endpoint.
- **Response:** Same wallet transaction response shape.

#### Credit wallet

- **Purpose:** Atomically add funds to one player's wallet and create an auditable ledger entry.
- **Method:** `POST`
- **URL:** `/api/admin/wallets/credit`
- **Request Body:** `{ "userId": "usr_105", "type": "credit", "amount": 500, "category": "manual", "description": "Admin wallet top-up" }`; `userId` may be replaced by `username` where supported.
- **Response:** `200 OK`, `{ "success": true, "transaction": { "id": "tx_2", "userId": "usr_105", "type": "credit", "amount": 500, "balanceBefore": 12000, "balanceAfter": 12500, "category": "manual", "description": "Admin wallet top-up", "status": "completed" }, "balance": 12500 }`.

#### Debit wallet

- **Purpose:** Atomically deduct funds from one player's wallet and create an auditable ledger entry.
- **Method:** `POST`
- **URL:** `/api/admin/wallets/debit`
- **Request Body:** `{ "userId": "usr_105", "type": "debit", "amount": 500, "category": "manual", "description": "Admin wallet deduction" }`; `userId` may be replaced by `username` where supported.
- **Response:** `200 OK`, `{ "success": true, "transaction": { "id": "tx_3", "userId": "usr_105", "type": "debit", "amount": 500, "balanceBefore": 12500, "balanceAfter": 12000, "category": "manual", "description": "Admin wallet deduction", "status": "completed" }, "balance": 12000 }`. Reject insufficient balance unless business rules explicitly say otherwise.

#### Adjust wallet — compatibility fallbacks

- **Purpose:** Unified legacy adjustment route, used if the type-specific credit/debit endpoint is not found.
- **Method:** `POST`
- **URL:** `/api/admin/wallets/adjust` or `/api/wallet/adjust`
- **Request Body:** Same adjustment schema as credit/debit, with `type` set to `credit` or `debit`.
- **Response:** Same transaction and resulting balance response as the type-specific route.

#### Bonus all players

- **Purpose:** Credit an amount to eligible players in bulk; service exists, though no main UI flow currently calls it.
- **Method:** `POST`
- **URL:** `/api/admin/wallets/bonus-all`
- **Request Body:** `{ "amount": 100, "description": "Festive Bonus" }`.
- **Response:** `200 OK`, `{ "success": true, "affectedUsers": 120, "transactions": [{ "id": "tx_4", "userId": "usr_105", "amount": 100, "balanceAfter": 12600 }] }`.

#### Get wallet balance

- **Purpose:** Read the current balance for one player.
- **Method:** `GET`
- **URL:** `/api/admin/wallets/balance/:userId`
- **Request Body:** None.
- **Response:** `200 OK`, `{ "userId": "usr_105", "balance": 12600, "currency": "INR" }`.

#### Get wallet balance — fallback

- **Purpose:** Legacy compatibility path for wallet balance lookup.
- **Method:** `GET`
- **URL:** `/api/wallet/balance/:userId`
- **Request Body:** None.
- **Response:** Same balance response shape.

For every wallet write, enforce admin role, positive amount and configured limits, atomic balance update, immutable audit record, and idempotency (recommend an `Idempotency-Key` header). Never trust a client-submitted `balanceBefore` or `balanceAfter` as the authoritative ledger value.

### 3.5 Race controls, jackpot, and analytics

#### Force or schedule race winner

- **Purpose:** Set an override winner for a live or future race.
- **Method:** `POST`
- **URL:** `/api/admin/race/force-winner`
- **Request Body:** `{ "gameSerial": "20260923001", "horseSerial": 1, "reason": "Approved operational override" }`.
- **Response:** `200 OK`, `{ "success": true, "gameSerial": "20260923001", "horseSerial": 1, "reason": "Approved operational override" }`.

#### List scheduled winners

- **Purpose:** Read active and future forced-winner overrides.
- **Method:** `GET`
- **URL:** `/api/admin/race/scheduled-winners`
- **Request Body:** None.
- **Response:** `200 OK`, `{ "scheduledWinners": [{ "gameSerial": "20260923001", "horseSerial": 1, "reason": "Approved operational override" }] }`.

#### Clear forced winner

- **Purpose:** Remove a winner override and return that race to the normal result mode.
- **Method:** `DELETE`
- **URL:** `/api/admin/race/force-winner/:gameSerial` (the frontend uses literal `current` if no serial is supplied).
- **Request Body:** None.
- **Response:** `200 OK`, `{ "success": true, "gameSerial": "20260923001" }`.

#### Extend race time

- **Purpose:** Add time to the active race/betting window.
- **Method:** `POST`
- **URL:** `/api/admin/race/extend-time`
- **Request Body:** `{ "extraSeconds": 10 }`.
- **Response:** `200 OK`, `{ "success": true, "gameSerial": "20260923001", "extraSeconds": 10, "timeRemainingSec": 25 }`.

#### Force or schedule jackpot — canonical endpoint

- **Purpose:** Set the multiplier on the current/future race, optionally schedule it after a delay or number of rounds.
- **Method:** `POST`
- **URL:** `/api/admin/jackpot/force`
- **Request Body:** `{ "multiplier": 3, "gameSerial": "20260923001", "reason": "Approved promotion", "afterSeconds": 0, "roundsAfter": 0 }`. Multiplier accepts `2`, `3`, `4`, `"N"`, `"2X"`, `"3X"`, `"4X"`, or `"RANDOM"`.
- **Response:** `200 OK`, `{ "success": true, "gameSerial": "20260923001", "multiplier": 3, "isJackpot": true }`.

#### Force jackpot — compatibility fallbacks

- **Purpose:** Compatibility routes if the canonical force route is not deployed.
- **Method:** `POST`
- **URL:** `/api/admin/jackpot/set` or `/api/jackpot/force`
- **Request Body:** Same as `/api/admin/jackpot/force`.
- **Response:** Same force-jackpot response shape.

#### Get jackpot status — canonical endpoint

- **Purpose:** Read current/scheduled jackpot state and active mode.
- **Method:** `GET`
- **URL:** `/api/admin/jackpot/status`
- **Request Body:** None.
- **Response:** `200 OK`, `{ "success": true, "gameSerial": "20260923001", "isJackpot": true, "mode": "MANUAL", "multiplier": 3 }`.

#### Get jackpot status — compatibility fallbacks

- **Purpose:** Compatibility routes for jackpot status.
- **Method:** `GET`
- **URL:** `/api/admin/jackpot/summary` or `/api/jackpot/status`
- **Request Body:** None.
- **Response:** Same jackpot status response shape.

#### Clear forced jackpot

- **Purpose:** Remove the jackpot override for a race; frontend uses `current` when no serial is supplied.
- **Method:** `DELETE`
- **URL:** `/api/admin/jackpot/force/:gameSerial`
- **Request Body:** None.
- **Response:** `200 OK`, `{ "success": true, "gameSerial": "20260923001", "isJackpot": false }`.

#### Clear forced jackpot — fallback

- **Purpose:** Compatibility clear route.
- **Method:** `DELETE`
- **URL:** `/api/admin/jackpot/clear/:gameSerial`
- **Request Body:** None.
- **Response:** Same clear-jackpot response shape.

#### Get jackpot configuration — canonical endpoint

- **Purpose:** Load automatic jackpot trigger mode and parameters.
- **Method:** `GET`
- **URL:** `/api/admin/jackpot/config`
- **Request Body:** None.
- **Response:** `200 OK`, `{ "mode": "PROBABILITY", "enabled": true, "targetMultiplier": "RANDOM", "intervalRounds": 5, "intervalSeconds": 180, "probabilityPercent": 5, "allowedMultipliers": [2, 3, 4] }`.

#### Get jackpot configuration — compatibility fallbacks

- **Purpose:** Compatibility routes for jackpot config retrieval.
- **Method:** `GET`
- **URL:** `/api/admin/jackpot/mode` or `/api/jackpot/config`
- **Request Body:** None.
- **Response:** Same config response shape.

#### Update jackpot configuration — canonical endpoint

- **Purpose:** Save automatic jackpot mode and trigger settings.
- **Method:** `POST`
- **URL:** `/api/admin/jackpot/config`
- **Request Body:** `{ "mode": "PROBABILITY", "enabled": true, "targetMultiplier": "RANDOM", "intervalRounds": 5, "intervalSeconds": 180, "probabilityPercent": 5, "allowedMultipliers": [2, 3, 4] }`. Modes: `EVERY_ROUND`, `ROUND_INTERVAL`, `TIME_INTERVAL`, `PROBABILITY`, `MANUAL`, `OFF`.
- **Response:** `200 OK`, `{ "success": true, "config": { "mode": "PROBABILITY", "enabled": true, "targetMultiplier": "RANDOM", "intervalRounds": 5, "intervalSeconds": 180, "probabilityPercent": 5, "allowedMultipliers": [2, 3, 4] } }`.

#### Update jackpot configuration — compatibility fallbacks

- **Purpose:** Compatibility routes for saving jackpot configuration.
- **Method:** `POST`
- **URL:** `/api/admin/jackpot/mode` or `/api/jackpot/config`
- **Request Body:** Same as `/api/admin/jackpot/config`.
- **Response:** Same config update response shape.

#### Get admin analytics

- **Purpose:** Load dashboard KPIs and platform analytics.
- **Method:** `GET`
- **URL:** `/api/admin/analytics`
- **Request Body:** None.
- **Response:** `200 OK`, `{ "activePlayers": 120, "livePot": { "totalPot": 12500, "horsePots": { "1": 2500, "2": 10000 } }, "revenue": { ... }, "rounds": { ... } }`. Exact KPI schema must be confirmed against dashboard needs.

Jackpot modes used in the UI are `EVERY_ROUND`, `ROUND_INTERVAL`, `TIME_INTERVAL`, `PROBABILITY`, `MANUAL`, and `OFF`. Standard/no jackpot is represented by `N`/1X.

## 4. Socket.IO contract

### Connection

- **Socket.IO client package:** `socket.io-client` v4.
- **Server URL:** `https://<socket-host>` using the default namespace `/`. Current client supports WebSocket then polling, with reconnection enabled.
- **Handshake auth payload:** `{ "token": "Bearer <JWT>" }` in the Socket.IO `auth` object. Validate the token and role on the server.
- **Subscription:** The current client emits several compatibility aliases after connecting: `subscribe:admin`, `admin:subscribe`, `join:room` with `"admin"`, `join_room` with `"admin"`, `join` with `"admin"`, and `room:join` with `"admin"`. This is not a stable contract. Agree on one canonical event, recommended `admin:subscribe`, then update client/server to use only that event. Never grant admin room access solely because a client requests a room by name.
- **Initial state:** After successful authenticated subscription/reconnection, send a fresh `race:current_state` snapshot and relevant admin state so clients recover from missed broadcasts.

### 4.1 Server → client events

#### Current race state snapshot

- **Purpose:** Send authoritative current race state on subscribe/reconnect and when a state snapshot is needed.
- **Direction:** Server → Client (admin subscribers; optionally player subscribers with an appropriate filtered payload).
- **Event Name:** `race:current_state`
- **Payload:** `{ "gameSerial": "20260923001", "status": "BETTING_OPEN", "stageDuration": 40, "timeRemainingSec": 30, "elapsedSec": 10, "stageEndsAt": "2026-09-23T08:00:30.000Z", "jackpot": { "isJackpot": false, "multiplier": 1 } }`.

#### Betting window opened

- **Purpose:** Notify clients that a new race betting window has opened.
- **Direction:** Server → Client.
- **Event Name:** `race:betting_open`
- **Payload:** Same base race-state schema as `race:current_state`, with the new `gameSerial` and `status: "BETTING_OPEN"`.

#### Race countdown tick

- **Purpose:** Synchronize the pre-race countdown.
- **Direction:** Server → Client.
- **Event Name:** `race:countdown_tick`
- **Payload:** `{ "gameSerial": "20260923001", "countdown": 3 }` (countdown value is seconds remaining).

#### Live race track frame

- **Purpose:** Stream horse positions/progress while a race is running.
- **Direction:** Server → Client.
- **Event Name:** `race:running_track` (frontend also listens to compatibility alias `race:track_update`).
- **Payload:** `{ "gameSerial": "20260923001", "elapsedSec": 12, "timeRemainingSec": 28, "progressRatio": 0.3, "horses": [{ "serialNumber": 1, "name": "Thunder", "currentDistanceM": 300, "progressPercent": 30, "speedKmh": 58, "currentRank": 1, "gapToLeaderM": 0, "status": "LEADING" }] }`. Current display code can receive around five frames per second; tune frequency to actual client and network needs.

#### Race result

- **Purpose:** Announce the server-settled result and summary of the completed race.
- **Direction:** Server → Client.
- **Event Name:** `race:result`
- **Payload:** `{ "gameSerial": "20260923001", "winner": { "serial_number": 1, "name": "Thunder" }, "positions": [{ "rank": 1, "number": 1, "name": "Thunder", "time": "58.10s", "gap": "-" }], "totalBets": 12500, "totalPayout": 9000, "ggr": 3500, "totalPlayers": 48, "seedHash": "sha256:...", "startedAt": "2026-09-23T08:00:00.000Z", "finishedAt": "2026-09-23T08:01:00.000Z" }`. Frontend accepts `positions` or `finishOrder`; winner object should include one of `serial_number`, `horse_id`, or `number`.

#### Active player count

- **Purpose:** Update the live count of active players.
- **Direction:** Server → Client.
- **Event Name:** `active_players:update`
- **Payload:** `{ "activePlayers": 120 }`.

#### Admin analytics/metrics update

- **Purpose:** Push refreshed dashboard KPI values without polling.
- **Direction:** Server → Admin Client.
- **Event Name:** `admin:metrics_update` (frontend compatibility aliases: `admin:analytics_update`, `analytics:update`).
- **Payload:** `{ "activePlayers": 120, "livePot": { "totalPot": 12500, "horsePots": { "1": 2500, "2": 10000 } }, "revenue": { ... }, "rounds": { ... } }`.

#### Live bet pool update

- **Purpose:** Update race pot totals and per-horse distribution.
- **Direction:** Server → Admin Client.
- **Event Name:** `admin:bet_pool_update` (aliases: `bet:pool_update`, `race:pool_update`).
- **Payload:** `{ "gameSerial": "20260923001", "totalPot": 12500, "totalBets": 48, "horsePots": { "1": 2500, "2": 10000 } }`.

#### New live bet ledger entry

- **Purpose:** Append a newly accepted bet to the live ledger.
- **Direction:** Server → Admin Client.
- **Event Name:** `admin:bet_live` (alias: `bet:ledger_entry`).
- **Payload:** `{ "id": "bet_1", "userId": "usr_105", "username": "rahul123", "gameCode": "GC20260923001", "gameSerial": "20260923001", "horseId": "horse_1", "horseNumber": 1, "amount": 100, "odds": 3.5, "status": "OPEN", "createdAt": "2026-09-23T08:00:00.000Z" }`.

#### Wallet ledger transaction

- **Purpose:** Notify clients that the backend committed a wallet transaction.
- **Direction:** Server → Admin Client / relevant player Client.
- **Event Name:** `ledger:transaction` (aliases: `admin:wallet_transaction`, `admin:ledger_entry`, `wallet:transaction`, `wallet:ledger_entry`).
- **Payload:** `{ "id": "tx_2", "userId": "usr_105", "username": "rahul123", "type": "credit", "category": "win", "amount": 350, "balanceBefore": 12000, "balanceAfter": 12350, "referenceId": "RACE-20260923001", "description": "Bet win", "status": "completed", "currency": "INR", "createdAt": "2026-09-23T08:01:00.000Z" }`.

#### Wallet balance update

- **Purpose:** Push the authoritative current balance after a committed transaction.
- **Direction:** Server → relevant Client (and authorized Admin Client).
- **Event Name:** `wallet:balance_update` (aliases: `wallet:balance`, `user:balance_update`).
- **Payload:** `{ "userId": "usr_105", "balance": 12350, "currency": "INR", "transactionId": "tx_2", "gameSerial": "20260923001" }`.

#### Race control update

- **Purpose:** Broadcast a committed winner override/race-control state change.
- **Direction:** Server → Admin Client.
- **Event Name:** `admin:race_control_updated`
- **Payload:** `{ "gameSerial": "20260923001", "forcedWinner": { "horseSerial": 1, "reason": "Approved operational override" }, "updatedAt": "2026-09-23T08:00:00.000Z" }`.

#### Race time extended

- **Purpose:** Synchronize the updated timer after an authorized extension.
- **Direction:** Server → Client.
- **Event Name:** `admin:time_extended` (alias: `race:time_extended`).
- **Payload:** `{ "gameSerial": "20260923001", "extraSeconds": 10, "timeRemainingSec": 25 }`.

#### Jackpot state update

- **Purpose:** Broadcast the current or scheduled jackpot state.
- **Direction:** Server → Client.
- **Event Name:** `admin:jackpot_update` (aliases: `race:jackpot`, `jackpot:update`).
- **Payload:** `{ "gameSerial": "20260923001", "isJackpot": true, "multiplier": 3, "mode": "MANUAL", "updatedAt": "2026-09-23T08:00:00.000Z" }`.

#### Jackpot status refresh notification

- **Purpose:** Tell the Jackpot screen to refetch canonical jackpot status.
- **Direction:** Server → Admin Client.
- **Event Name:** `admin:jackpot_updated`
- **Payload:** `{ "gameSerial": "20260923001", "version": 12 }`.

#### Jackpot config refresh notification

- **Purpose:** Tell the Jackpot screen to refetch canonical jackpot configuration/status.
- **Direction:** Server → Admin Client.
- **Event Name:** `admin:jackpot_config_updated`
- **Payload:** `{ "version": 4, "updatedAt": "2026-09-23T08:00:00.000Z" }`.

### 4.2 Client → server events

Client commands below are observed in the current UI. For production, prefer REST as the sole mutation command path and use server broadcasts for resulting state. Where socket commands remain enabled, include a unique `commandId`, authorize every command, validate the current race state, and deduplicate against REST operations.

#### Subscribe admin socket

- **Purpose:** Subscribe an authenticated, authorized admin connection to admin updates.
- **Direction:** Client → Server.
- **Event Name:** `admin:subscribe` (recommended canonical name; current client also emits legacy room-subscription aliases described above).
- **Payload:** No required payload. Server derives admin identity/permissions from the verified handshake token, not a client-supplied room name.

#### Set forced winner

- **Purpose:** Force or schedule the winning horse for a race.
- **Direction:** Client → Server.
- **Event Name:** `admin:set_forced_winner`
- **Payload:** `{ "commandId": "cmd_001", "gameSerial": "20260923001", "horseSerial": 1, "reason": "Approved operational override" }`.

#### Clear forced winner

- **Purpose:** Clear the forced winner for a race.
- **Direction:** Client → Server.
- **Event Name:** `admin:clear_forced_winner`
- **Payload:** `{ "commandId": "cmd_002", "gameSerial": "20260923001" }`.

#### Extend race time

- **Purpose:** Add seconds to the active race/betting timer.
- **Direction:** Client → Server.
- **Event Name:** `admin:extend_time`
- **Payload:** `{ "commandId": "cmd_003", "gameSerial": "20260923001", "extraSeconds": 10 }`.

#### Set/schedule jackpot

- **Purpose:** Apply or schedule the jackpot multiplier for a race.
- **Direction:** Client → Server.
- **Event Name:** `admin:set_jackpot`
- **Payload:** `{ "commandId": "cmd_004", "gameSerial": "20260923001", "multiplier": 3, "reason": "Approved promotion", "afterSeconds": 0, "roundsAfter": 0 }`.

#### Configure jackpot

- **Purpose:** Set automatic jackpot mode/settings. Current frontend also uses this event for force-jackpot operations, so the payload is ambiguous and should be split/standardized before production.
- **Direction:** Client → Server.
- **Event Name:** `admin:configure_jackpot`
- **Payload:** Config form: `{ "commandId": "cmd_005", "mode": "PROBABILITY", "enabled": true, "targetMultiplier": "RANDOM", "intervalRounds": 5, "intervalSeconds": 180, "probabilityPercent": 5, "allowedMultipliers": [2, 3, 4] }`; force operation currently may send `{ gameSerial, multiplier, afterSeconds?, roundsAfter? }`.

#### Set jackpot mode

- **Purpose:** Set the automatic jackpot mode/configuration.
- **Direction:** Client → Server.
- **Event Name:** `admin:set_jackpot_mode`
- **Payload:** `{ "commandId": "cmd_006", "mode": "PROBABILITY", "enabled": true, "targetMultiplier": "RANDOM", "intervalRounds": 5, "intervalSeconds": 180, "probabilityPercent": 5, "allowedMultipliers": [2, 3, 4] }`.

#### Clear jackpot

- **Purpose:** Clear a forced jackpot override for a race.
- **Direction:** Client → Server.
- **Event Name:** `admin:clear_jackpot`
- **Payload:** `{ "commandId": "cmd_007", "gameSerial": "20260923001" }`.

#### Adjust player wallet

- **Purpose:** Current UI emits a wallet adjustment notification adjacent to the REST adjustment call. Do not apply this event as a second balance mutation if REST already processed it.
- **Direction:** Client → Server (observed, but REST should be the authoritative mutation path).
- **Event Name:** `admin:wallet_adjust`
- **Payload:** `{ "commandId": "cmd_008", "userId": "usr_105", "username": "rahul123", "gameCode": "GC20260923001", "amount": 500, "type": "credit", "category": "manual", "description": "Admin wallet top-up" }`. Client may also include `balanceBefore`/`balanceAfter`; server must calculate authoritative values itself.

#### Client-emitted transaction event (do not accept as a write)

- **Purpose:** Current simulated/local settlement code emits transaction-shaped events; server must not accept these as authoritative ledger writes.
- **Direction:** Client → Server (observed in demo code; production backend should reject/ignore as a command).
- **Event Name:** `admin:wallet_transaction` and `ledger:transaction`
- **Payload:** Transaction-shaped JSON object. Production transaction events must be generated and broadcast by the backend only after its own settlement commits.

### 4.3 Socket event envelope recommendation

Include the following metadata in state-changing broadcasts where practical: `eventId` (unique), `occurredAt` (ISO-8601 UTC), `gameSerial` (when race-scoped), and `version` (monotonic within the entity). On reconnect, send a snapshot or let the client fetch REST state; do not assume sockets deliver missed events.

**Controls not connected to backend:** “Force next stage” and “Void/refund round” currently call local functions only. This repository has no REST route or socket command for them. Define an explicitly authorized, idempotent backend operation before these controls are used with real race state or real money.

## 5. Suggested end-to-end flows

1. Authenticate admin through the real backend login contract; store/use its JWT. Connect socket with the same admin identity and subscribe only after authorization.
2. Load initial users, horses, bets, race history, wallet ledger and analytics through REST. Subscribe for live events and reconcile by event/version ID.
3. For control or wallet mutations, call the canonical REST endpoint once. Backend validates permission and race state, commits atomically, then broadcasts the resulting state to subscribers.
4. On socket reconnect, fetch a fresh REST snapshot (or consume a versioned server snapshot), then resume events. Never assume every event was received.
5. Keep result generation, bet acceptance, payout/refunds and balances authoritative on the server. The current UI contains simulated/local fallbacks and should not be treated as production state.

## 6. Backend decisions to confirm before integration

- Production REST URL, Socket.IO URL/path/namespace, CORS origins, TLS and environment separation.
- Admin login/refresh/logout route, JWT claims, expiry and permission roles; resolve the demo-only login.
- Canonical routes among listed fallback paths and exact response schema/pagination.
- Canonical Socket.IO subscribe event, room authorization and one canonical event name per alias group.
- Which admin mutations are REST-only vs socket commands; idempotency and duplicate prevention.
- Exact bet, race, jackpot, metrics and analytics schemas; timestamp format and INR precision.
- Backend API for void/refund and force-stage controls, if those UI actions are retained.
- Rate limits, audit fields, wallet transaction rules, and reconciliation behavior after reconnect.

## 7. Frontend source map

- REST clients: `src/services/userApi.js`, `horseApi.js`, `betApi.js`, `walletApi.js`, `raceControlApi.js`
- Socket client: `src/services/socket.js`
- Incoming events: `src/hooks/useHorseRaceSocket.js`
- Admin commands, mapping and local fallback behavior: `src/context/GameEngineContext.jsx`
- Demo auth implementation: `src/context/AuthContext.jsx`, `src/pages/Login.jsx`
