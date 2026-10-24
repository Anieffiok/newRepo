# ROVIA

ROVIA is a career growth platform API. It helps users manage their profile, education, experience, skills, certifications, goals, and interests. It also tracks opportunities, applications, eligibility and readiness checks, learning resources, documents, notifications, and privacy settings. The API is built with Express 5 and PostgreSQL.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Running the App](#running-the-app)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Authentication:** registration, login, refresh tokens, logout, email verification, and password reset.
- **Profile:** user profile, education, work and project experience, certifications, goals, interests, and skills.
- **Opportunities:** browse opportunities, save them, and submit new ones.
- **Applications:** track applications, stages, and outcomes.
- **Eligibility and readiness:** analyse fit for an opportunity and track readiness items.
- **Preparation and learning:** practice sessions, a preparation checklist, and saved learning resources.
- **Documents:** upload PDF, PNG, or JPG files up to 5 MB, stored in S3-compatible object storage. Downloads use short-lived pre-signed URLs.
- **Notifications and privacy:** notification preferences and profile visibility controls.
- **Account management:** data export, and permanent account deletion.
- **Admin tools:** user management, opportunity verification, content reports, reports, settings, and audit logs.
- **Scheduled jobs:** background tasks run on a schedule using `node-cron`.

---

## Tech Stack

| Area       | Technology                                                 |
| ---------- | ---------------------------------------------------------- |
| Runtime    | Node.js (ES modules)                                       |
| Framework  | Express 5                                                  |
| Database   | PostgreSQL with Sequelize ORM and sequelize-cli migrations |
| Auth       | JWT access and refresh tokens, Argon2 password hashing     |
| Validation | express-validator                                          |
| Storage    | S3-compatible object storage (AWS SDK v3)                  |
| Email      | Nodemailer (SMTP)                                          |
| Logging    | Pino                                                       |
| Security   | Helmet, CORS, cookie-parser, express-rate-limit            |
| API docs   | swagger-jsdoc and swagger-ui-express (OpenAPI)             |
| Testing    | Jest and Supertest                                         |

---

## Project Structure

```text
ROVIA/
├── src/
│   ├── app.js              # Express app: middleware, routes, error handling
│   ├── server.js           # Starts the HTTP server and cron jobs
│   ├── config/             # Environment, database, logger, AI config
│   ├── database/
│   │   ├── migrations/     # Schema migrations
│   │   ├── models/         # Sequelize models
│   │   └── seeders/        # Seed data (skills, interests, opportunities, settings)
│   ├── docs/
│   │   └── swagger.js      # OpenAPI setup and docs protection
│   ├── middleware/         # Auth, roles, validation, errors, request IDs
│   ├── modules/            # Feature modules (routes, controllers, services, validators)
│   ├── routes/index.js     # Mounts all module routes under /api/v1
│   └── utils/              # Tokens, passwords, email, storage, errors
├── tests/integration/      # Integration tests (one file per module)
├── .sequelizerc            # sequelize-cli paths
├── jest.config.js
└── package.json
```

---

## Prerequisites

- Node.js 20 LTS or later (recommended)
- npm
- PostgreSQL 14 or later
- An S3-compatible bucket for document storage (for example Backblaze B2 or AWS S3)
- An SMTP account for sending emails (for example Gmail with an app password)
- A Google Gemini API key, if you use the AI features

---

## Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/okeleyeayomide08/ROVIA.git
cd ROVIA

# 2. Install dependencies
npm install

# 3. Create your environment file (see Environment Variables below)
#    Create a file named .env in the project root.

# 4. Run database migrations
npm run db:migrate

# 5. (Optional) Load seed data
npm run db:seed

# 6. Start the development server
npm run dev
```

The API runs at `http://localhost:5000` by default. All routes are under `/api/v1`. The health check is at `/health`.

---

## Environment Variables

Create a `.env` file in the project root. **Never commit this file.** It is listed in `.gitignore`.

### Required

| Variable                 | Description                                                            | Example                                     |
| ------------------------ | ---------------------------------------------------------------------- | ------------------------------------------- |
| `NODE_ENV`               | `development`, `test`, `staging`, or `production`                      | `development`                               |
| `PORT`                   | Port the server listens on                                             | `5000`                                      |
| `DATABASE_URL`           | PostgreSQL connection string                                           | `postgres://user:pass@localhost:5432/rovia` |
| `JWT_ACCESS_SECRET`      | Secret for signing access tokens (use a long random string)            | `replace-with-long-random-string`           |
| `JWT_REFRESH_SECRET`     | Secret for signing refresh tokens (must differ from the access secret) | `replace-with-another-long-random-string`   |
| `JWT_ACCESS_EXPIRES_IN`  | Access token lifetime                                                  | `15m`                                       |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime                                                 | `7d`                                        |

### Optional

| Variable                    | Description                                               | Default                               |
| --------------------------- | --------------------------------------------------------- | ------------------------------------- |
| `DATABASE_URL_TEST`         | Database used by the test suite                           | none                                  |
| `FRONTEND_URL`              | Origin allowed by CORS (must match your frontend exactly) | `http://localhost:3000`               |
| `API_BASE_URL`              | Public API URL shown in Swagger "Try it out"              | `http://localhost:5000/api/v1`        |
| `DOCS_USER`                 | Username for the API docs                                 | none                                  |
| `DOCS_PASSWORD`             | Password for the API docs                                 | none                                  |
| `COOKIE_SECURE`             | Set `true` to send cookies only over HTTPS                | `true` in production                  |
| `COOKIE_SAME_SITE`          | `lax`, `strict`, or `none`                                | `none` in production, `lax` otherwise |
| `COOKIE_DOMAIN`             | Cookie domain                                             | none                                  |
| `LOG_LEVEL`                 | Pino log level                                            | `info`                                |
| `SMTP_HOST`                 | SMTP server host                                          | `smtp.gmail.com`                      |
| `SMTP_PORT`                 | SMTP server port                                          | `465`                                 |
| `SMTP_USER`                 | SMTP username                                             | none                                  |
| `SMTP_PASS`                 | SMTP password or app password                             | none                                  |
| `EMAIL_FROM`                | Sender name and address                                   | `Rovia <teamrovia@gmail.com>`         |
| `STORAGE_ENDPOINT`          | S3-compatible endpoint URL                                | none                                  |
| `STORAGE_ACCESS_KEY_ID`     | Storage access key ID                                     | none                                  |
| `STORAGE_SECRET_ACCESS_KEY` | Storage secret access key                                 | none                                  |
| `STORAGE_BUCKET_NAME`       | Bucket name                                               | `rovia-documents`                     |
| `STORAGE_REGION`            | Storage region                                            | `us-west-004`                         |
| `GEMINI_API_KEY`            | Google Gemini API key for AI features                     | none                                  |
| `AI_MODEL`                  | Primary AI model name                                     | see `src/config/ai.js`                |
| `AI_FALLBACK_MODEL`         | Fallback AI model name                                    | see `src/config/ai.js`                |

### Example `.env` for local development

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/rovia
DATABASE_URL_TEST=postgres://postgres:postgres@localhost:5432/rovia_test
JWT_ACCESS_SECRET=change-me-access-secret-at-least-32-chars
JWT_REFRESH_SECRET=change-me-refresh-secret-at-least-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
```

The app will not start if any of the required variables are missing.

---

## Database

Migrations and seeds use `sequelize-cli`, configured by `.sequelizerc` and `src/config/database.cjs`.

```bash
npm run db:migrate         # Apply all pending migrations
npm run db:migrate:undo    # Undo the last migration
npm run db:seed            # Run all seeders
```

Seeders load initial skills, interests, opportunities with their requirements, and system settings. Run migrations before seeds.

---

## Running the App

| Command       | What it does                                              |
| ------------- | --------------------------------------------------------- |
| `npm run dev` | Starts the server with nodemon (restarts on file changes) |
| `npm start`   | Starts the server with Node.js (use in production)        |

---

## API Documentation

All endpoints are under `/api/v1`.

| Route            | Purpose                   |
| ---------------- | ------------------------- |
| `/api/v1`        | API root                  |
| `/health`        | Health check              |
| `/api-docs`      | Interactive Swagger UI    |
| `/api-docs.json` | Raw OpenAPI specification |

**Swagger access:**

- **Local development:** `/api-docs` is open when `DOCS_USER` and `DOCS_PASSWORD` are not set.
- **Production:** `/api-docs` is protected with HTTP Basic auth using `DOCS_USER` and `DOCS_PASSWORD`. If those are not set in production, the docs return 404.

**Authentication:** protected endpoints require the header `Authorization: Bearer <accessToken>`. Get the token from `POST /api/v1/auth/login` or `POST /api/v1/auth/register`.

**Response format:**

```json
{ "success": true, "data": {}, "message": "..." }
```

```json
{
  "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "...", "fields": {} }
}
```

**Common error codes:** `VALIDATION_ERROR` (400), `INVALID_FILE_TYPE` (400), `FILE_TOO_LARGE` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), `RATE_LIMITED` (429), `INTERNAL_ERROR` (500).

**Rate limiting:** 100 requests per 15 minutes per IP address on the API.

**Document uploads:** send `multipart/form-data` with the field name `file`. Downloads return JSON with a `downloadUrl` that expires in 15 minutes. Fetch that URL without the `Authorization` header.

---

## Testing

```bash
npm test               # Run all integration tests
npm run test:watch     # Run tests in watch mode
```

Tests run against the database set in `DATABASE_URL_TEST`. Use a separate database, not your development or production database. Tests run in band (one at a time) so they do not interfere with each other.

---

## Deployment

1. Set `NODE_ENV=production` and all required variables on your host. Do not upload `.env`.
2. Set `FRONTEND_URL` to your exact frontend origin, including `https://`.
3. Set `API_BASE_URL` to your public API URL, for example `https://api.example.com/api/v1`.
4. Set `DOCS_USER` and `DOCS_PASSWORD` if you want the Swagger docs online.
5. Run `npm run db:migrate` against the production database.
6. Start the app with `npm start`.
7. Check `GET /health` returns `200`.

Production uses SSL for the PostgreSQL connection and sets cookies to `Secure` and `SameSite=None`. Both the API and the frontend must be served over HTTPS.

---

## Contributing

1. Create a branch from `main`.
2. Make your changes and add or update tests.
3. Run `npm test` and confirm it passes.
4. Open a pull request with a clear description of the change.

---

## License

ISC. See `package.json`.
