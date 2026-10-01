# strapi-cloud-config

This is the Strapi CMS for the EaseAccess24 blog. The site `EaseAccess24/easeaccess24.com` reads `GET /api/articles` from it through the Public role, with no token. The project is deployed on Strapi Cloud. It was created from the Strapi Cloud blog template (initial commit by `strapi-cloud[bot]`) and has changed little since.

Workspace docs covering both repos are in `../docs/`, one level up. That directory is not in this repo and exists only in the local workspace checkout.

## Stack

- `@strapi/strapi`, `@strapi/plugin-users-permissions` and `@strapi/plugin-cloud`, all at 5.55.1 (upgraded from 5.15.0 on 2026-09-30; Strapi 5.55.1 itself supports Node 20 to 26). JavaScript, with `checkJs` in `jsconfig.json`.
- npm (`package-lock.json`). Node `>=18.0.0 <=22.x.x` (`engines`).
- Database: `DATABASE_CLIENT` in `config/database.js`, defaulting to `sqlite` with `better-sqlite3` at `.tmp/data.db`. Postgres and MySQL are also supported. UNVERIFIED: the production database on Strapi Cloud.
- `node_modules` is not installed in this checkout.

## Scripts

| Command | Notes |
|---|---|
| `npm run develop` | Admin and API on port 1337 with auto-reload. The Content-Type Builder works only in this mode |
| `npm run build` | Build the admin panel |
| `npm run start` | Production mode |
| `npm run strapi -- ts:generate-types` | Regenerate `types/generated/`. UNVERIFIED for this JS project |
| `npm run seed:example` | Do not run. Stale template seeder |
| `npm run deploy` | Do not run. Deploys to Strapi Cloud production |

There is no lint, test or CI.

## Directory map

| Path | Contents |
|---|---|
| `src/api/<name>/content-types/<name>/schema.json` | Content type schemas: article, author, category, tag, about, global |
| `src/api/<name>/{controllers,routes,services}/` | Default `createCoreController`, `createCoreRouter` and `createCoreService` factories, not customized |
| `src/components/shared/*.json` | Components: media, quote, rich-text, seo, slider |
| `src/index.js` | `register` is empty; `bootstrap` is `require("./bootstrap")` |
| `src/bootstrap.js` | Template seeder. Runs on the first boot of an empty database |
| `scripts/seed.js` | Copy of the seeder as a standalone script |
| `data/data.json`, `data/uploads/` | Template demo content and images |
| `config/` | `server.js`, `database.js`, `admin.js`, `api.js`, `middlewares.js`, `plugins.js` |
| `types/generated/` | Committed generated types (`contentTypes.d.ts`, `components.d.ts`) |
| `src/admin/*.example.js` | Inactive admin customization examples |

## Content types

These are the blog types. The full field list is in `../docs/strapi-content-model.md`.

- `article`: draftAndPublish on. Fields: `title`, `slug` (uid from title), `alt_text`, `content` (blocks), `markdown` (richtext; rendered instead of `content` when filled), `category`, `author`, `readingTime`, `isFeatured`, `tags`, `image`, `description` (max 80), and `blocks` (a dynamic zone the frontend does not render).
- `author`: `name`, `avatar`, `Bio`, `email`.
- `category`: `name`, `slug`, `description`.
- `tag`: draftAndPublish on. `Name`, `slug`.
- `about` and `global`: single types left over from the template. Unused by the site.

## Custom code

There is none beyond the core factories and the seeder. The project has no:

- policies, middlewares, lifecycles or cron jobs
- `src/extensions` overrides
- webhooks in code, preview config or admin customizations
- migrations (`database/migrations/` holds only `.gitkeep`)

## Config notes

- `config/api.js`: REST `defaultLimit: 25`, `maxLimit: 100`, `withCount: true`. The frontend depends on the 100 limit (see Gotchas).
- `config/middlewares.js` uses the stock list. CORS and security are Strapi defaults, with no origin restriction.
- `config/plugins.js` is empty. There is no upload or email provider config. Locally, uploads go to `public/uploads/`. On Strapi Cloud, media is served from `*.media.strapiapp.com`.
- `config/server.js` sets `webhooks.populateRelations` from `WEBHOOKS_POPULATE_RELATIONS`.

## Permissions and webhooks

- Role permissions are stored in the database, not in code. The seeder grants the Public role `find` and `findOne` on article, category, author, global and about, once, on first run. It grants nothing on tag.
- The frontend needs Public read access on article and on the populated relations (author, category, tag, upload).
- Per the owner, a webhook in the Strapi Cloud admin calls a Vercel deploy hook to rebuild the site. TODO: confirm which events it covers.

## Changing schemas safely

- Edit schemas through the Content-Type Builder (`npm run develop`) or directly in `schema.json`. Commit the updated `types/generated/` in the same commit.
- Never rename or remove `image`, `author`, `category`, `tags` or `author.avatar` without a matching frontend change deployed first. The site's populate queries return a 400 for unknown keys.
- For a rename: add the new field, migrate content, switch the frontend, then remove the old field.
- Nothing is `required` today, and the frontend assumes `title`, `slug` and `description` exist. Marking them required is safe for the frontend. Removing or renaming them is not.
- Enabling i18n on article, or turning draftAndPublish off, changes the API responses the frontend relies on. Coordinate these first.
- Field casing is mixed (`Bio`, `Name`, `alt_text`, `readingTime`). Keep the existing names.
- After a schema change, update `../docs/strapi-content-model.md` and the mapping tables in `../docs/frontend-strapi-integration.md`.

## Environment variables

These are names only; never read `.env`. The template is `.env.example`.

- `HOST`, `PORT`, `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`.
- Optional: `DATABASE_*`, `FLAG_NPS`, `FLAG_PROMOTE_EE`, `WEBHOOKS_POPULATE_RELATIONS`. See `../docs/environment.md`.

## Gotchas

- The seeder in `src/bootstrap.js`:
  - writes the removed `cover` field (renamed to `image` in `7a9cc0c`)
  - seeds no `content`, tags or images
  - sets `initHasRun` before importing, so a failed import is never retried
  - catches and logs errors instead of failing
- `data/data.json` holds Strapi demo articles. It is not EaseAccess24 content.
- `README.md` is the Strapi template README, and the package name is `my-app-name`.
- The category and tag `slug` fields have no `targetField`, so editors must fill them by hand.
- Tag has draft and publish on. An unpublished tag is left out of article responses.
