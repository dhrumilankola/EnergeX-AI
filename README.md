# EnergeX-AI-Hiring-Test - Dhrumil Ankola

Screening test for software engineer applicants (debugging + QA)

### What this submission implements
- Backend (Lumen, PHP): GraphQL API with JWT auth for users and posts
- Backend (Node.js, TypeScript): Redis cache API with MySQL fallback
- Database (MySQL 8): Users and posts via migrations
- Frontend (React + Vite): Minimal UI consuming GraphQL and cache API
- Testing: PHPUnit (PHP) and Jest + Supertest (Node)
- DevOps: Docker Compose for PHP, Nginx, Node, MySQL, Redis
- CI: GitHub Actions running Node and PHP test suites

## Architecture
```
React UI ──► Lumen (GraphQL) ──► MySQL
            ▲                 
            │                 
            └── Node (Cache API) ──► Redis ──► MySQL (fallback)
```

## Assessment mapping
- Backend (Lumen): Auth + posts implemented using GraphQL (Lighthouse) instead of REST. JWT used.
- Backend (Node): Cache layer exposes `/cache/*` routes; Redis-first, MySQL fallback; invalidation on writes.
- Database (MySQL): Migrations for `users` and `posts`; bcrypt hashing.
- Frontend (React): Login/register, list posts, create post (see `frontend-react/src/pages`).
- Testing: PHPUnit tests in `backend-lumen/tests`; Jest unit/integration in `backend-node/tests`.
- Docker: `docker-compose.yml` orchestrates all services; volumes and healthchecks configured.
- CI/CD: `.github/workflows/ci.yml` runs tests for Node and PHP on push/PR.

## Getting started
Prereqs: Docker Desktop, Node 18+, PHP 8.2+ (only if running locally outside Docker)

1) Clone
```bash
git clone <repo-url>
cd EnergeX-AI-Hiring-Test
```

2) Create `.env` in repo root
```env
# MySQL
DB_HOST=db
DB_PORT=3306
DB_DATABASE=energex
DB_USERNAME=app
DB_PASSWORD=app
DB_ROOT_PASSWORD=root

# Redis
REDIS_HOST=cache
REDIS_PORT=6379
REDIS_PASSWORD=redispass

# JWT (Lumen)
JWT_SECRET=please_change_me

# Frontend / Realtime
FRONTEND_URL=http://localhost:5173
REALTIME_API_SECRET=dev-internal-secret
```

3) Start services
```bash
docker-compose up -d --build
```

4) Apply migrations
```bash
docker exec -it energex_app php artisan migrate
```

5) URLs
- Lumen API (behind Nginx): http://localhost:8000
- GraphQL endpoint: http://localhost:8000/graphql
- Node cache API: http://localhost:4000/cache
- Frontend (vite dev): run locally via `npm run dev` in `frontend-react`

## APIs
### Lumen GraphQL
Schema excerpts are in `backend-lumen/graphql/schema.graphql`.
- register(name, email, password) → `AuthPayload { token, user }`
- login(email, password) → `AuthPayload { token, user }`
- posts: `[Post!]!`
- post(id: ID!): `Post`
- createPost(title, content): `Post` (auth required)

Auth: pass JWT as `Authorization: Bearer <token>`.

### Node cache API
- GET `/cache/posts` → cached list
- GET `/cache/posts/:id` → cached item
- POST `/cache/posts` → create and invalidate `posts:all`
- PUT `/cache/posts/:id` → update and invalidate `post:{id}`
- DELETE `/cache/posts/:id` → delete and invalidate related keys
- GET `/cache/health` → Redis/MySQL health

Response shape (example):
```json
{ "data": [...], "source": "cache|database", "timestamp": "ISO-8601" }
```

## Running tests
Node (backend-node):
```bash
cd backend-node
npm ci
npm test
```

PHP (backend-lumen):
```bash
cd backend-lumen
composer install
vendor/bin/phpunit -v
```

CI: see `.github/workflows/ci.yml` (spins up MySQL/Redis services and runs both suites).

## Docker services
- `app`: Lumen (PHP-FPM) with code volume and persistent `vendor` volume
- `nginx`: serves Lumen on port 8000
- `realtime`: Node cache API on port 4000
- `db`: MySQL 8 with healthcheck
- `cache`: Redis 7 with password and LRU settings

## Notes and deviations
- The Lumen part uses GraphQL instead of the REST shape specified. Endpoints are equivalent in capability.
- Frontend is a minimal Vite React app; see `frontend-react/src/pages` for flows.
- Bonus: basic WebSocket scaffold exists in Node via Socket.io.

## Troubleshooting
- Ensure ports 8000 (nginx), 4000 (node), 3306 (mysql), 6379 (redis) are free.
- If migrations fail, verify `.env` and the `db` container health.
- For cache misses, confirm `REDIS_PASSWORD` and connectivity to `cache`.

—

EnergeX Full-Stack Developer Technical Assessment - Dhrumil Ankola
