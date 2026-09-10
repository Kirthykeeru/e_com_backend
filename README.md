# Electric Shop — Backend

Node.js + Express backend for the Electric Shop ecommerce platform (SQLite/libSQL storage,
JWT auth, Socket.IO, optional email notifications).

Frontend repo: https://github.com/Kirthykeeru/e_com_frontend

## Structure
- `src/app.js`: Express app (routes + middleware, no listening)
- `src/server.js`: HTTP + Socket.IO entrypoint
- `src/db/`: database connection (local SQLite file, or a hosted Turso/libSQL database in
  production), schema, migration, and seed script
- `tests/`: Jest + Supertest integration tests
- `Dockerfile`: optional container build (see [Docker](#docker) below)

## Run locally
```bash
npm install
copy .env.example .env
npm run migrate
npm run seed
npm run dev
```
Server listens on `PORT` (default `4000`). Point a frontend at it via `VITE_API_BASE_URL` /
`VITE_SOCKET_URL`.

### Tests
```bash
npm test
```

### Email notifications (optional)
Admins are always notified of new orders in real time via WebSocket. To also send an email,
fill in `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, and `ADMIN_NOTIFY_EMAIL`
in `.env`. Leave `SMTP_HOST` blank to skip email entirely — order notifications are just logged
to the console instead.

## Docker
Not required for the Render deploy below — Render builds this natively from `npm install`.
Useful when targeting a container-only host (VPS, Fly.io, Railway's Dockerfile mode, Cloud Run):
```bash
docker build -t electric-shop-api .
docker run --env-file .env -p 4000:4000 electric-shop-api
```
Run `npm run migrate && npm run seed` once against your target database before the first start.

## Deploying (free hosting)
Uses [Render](https://render.com) (free web service) + [Turso](https://turso.tech) (free,
non-expiring hosted libSQL/SQLite) so data survives restarts — Render's free tier wipes the
local filesystem on every redeploy and every time the service wakes from idle sleep.

1. Create a free Turso database (`turso db create electric-shop`, or via app.turso.tech) and
   grab its `DATABASE_URL` and an auth token.
2. In Render: **New > Web Service** pointing at this repo, or **New > Blueprint** to use the
   included `render.yaml`.
3. Fill in the secret env vars: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `SEED_ADMIN_PASSWORD`
   (SMTP vars optional — leave blank to skip email).
4. First boot runs `npm run migrate && npm run seed` automatically, creating the schema and the
   admin account in Turso.
5. Set `CLIENT_ORIGIN` to your deployed frontend's real URL (CORS) once you know it.

Free tier sleeps after ~15 minutes idle and takes 30-60s to wake on the next request.

## Default admin
Set via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env` (defaults below if unset):
- email: `admin@electric.com`
- password: `Admin123!`

## API notes
- Buyers: browse active products, add to cart, checkout, view order history.
- Admins: manage user accounts (create, update roles, reset passwords), set per-user price
  overrides, create/edit/activate/deactivate products and adjust stock, view all orders, receive
  real-time (and optionally email) notifications on new orders, review an audit log of admin
  actions.
