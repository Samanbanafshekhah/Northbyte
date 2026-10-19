# NorthByte administration

The administration application is a separate native HTML/CSS/JavaScript interface at `/admin`, backed by **Laravel 12 and Sanctum**. Existing public pages, login animations, branding, and English/Persian content remain in place. The client dashboard now submits projects and their files to Laravel. Existing messaging, its records and authenticated SSE transport are reused.

## Modules

| Route | Functionality |
| --- | --- |
| `/admin/login` | Session login, throttling, CSRF, email password-reset flow. |
| `/admin/dashboard` | Actual database counts, selectable 7/30/90-day submission/registration charts, status distribution, recent projects and activity. |
| `/admin/clients` | Paginated/sortable directory, search/status filters, profiles, account suspension, assignment, projects/conversations, private administrative notes. |
| `/admin/projects` | Paginated table and Kanban board with validated status changes, optimistic version checks, assignment and audit logging. |
| `/admin/projects/:id` | Project overview, budget/timeline, milestones, private files, project discussion, administrative notes, activity. |
| `/admin/messages` | Existing private messaging with real SSE updates and HTTP polling fallback, history search, replies, read markers, typing, attachments, assignments and internal notes. |
| `/admin/files` | Private project files, type/project/search filters, image previews, downloads, upload validation, soft deletion with an audit record. Conversation attachments remain accessible in messaging. |
| `/admin/team` | Super Admin-only account creation, role/status/permission changes, session revocation and self/last-admin protection. |
| `/admin/content` | English/Persian forms for selected website copy, services, portfolio, technology lists, team names/biographies; versioned drafts and explicit publishing. |
| `/admin/notifications` | Scoped notifications, unread badge, mark-read controls, project/upload events and synchronization of existing registrations/messages. |
| `/admin/activity-logs` | Paginated searchable audit history, actors, timestamps and non-sensitive changes. |
| `/admin/settings` | Profile, password, language and notification preferences; global brand/contact/attachment/registration settings for Super Admins. |

UI language and direction switch between English and Persian. Tables, forms, dialogs, navigation, errors and messages have translated UI labels. User-authored text, names and messages remain unchanged. Layouts adapt to smaller screens and respect reduced-motion preferences. Charts use inline SVG and real queries, with no simulated metrics or online statuses.

## Requirements

- **Node 24+** for the existing server/SQLite transport and the legacy password bridge.
- **PHP 8.3+ recommended** for deployment; the local machine currently provides PHP 8.2.12, which is compatible with the installed Laravel 12 release and was used for the feature tests.
- Composer 2 and PHP extensions: PDO/SQLite (or the chosen database driver), fileinfo, mbstring, openssl, XML, curl and **zip** for DOCX/optional ZIP validation.
- A persistent local disk for private uploads and sessions. SMTP and a queue worker are needed only when email notifications/reset delivery are configured.

The local installation uses the **existing SQLite database**, shared by Laravel and Node, so users, projects and messages are not duplicated. Laravel's database configuration includes MySQL/PostgreSQL connection settings. **Do not point Laravel alone at a different production database while leaving Node on SQLite:** the shared messaging/session transport must be migrated or adapted at the same time. MySQL/PostgreSQL end-to-end operation is not configured or verified by this local implementation.

## Local setup

From the project root, install the Laravel dependencies, create its environment file and generate a unique application key:

```powershell
composer install --working-dir=backend
Copy-Item backend/.env.example backend/.env
php backend/artisan key:generate
```

If this XAMPP installation has the zip extension disabled, enable it in your PHP configuration or invoke Composer as:

```powershell
php -d extension=zip C:\ProgramData\ComposerSetup\bin\composer.phar install --working-dir=backend
```

Set `DB_DATABASE` in `backend/.env` to the **absolute path** of `private/northbyte.sqlite`. Set `NODE_BINARY` to a Node 24+ executable. On this machine the compatible Node runtime is:

```text
C:\Users\Asus\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe
```

For a fresh installation, initialize the existing messaging schema by starting `node server.mjs` once, or let Laravel's shared-table migration create it. Back up any existing database before migration. Use SQLite's backup facilities, or stop both services and copy the database with its WAL/SHM companions. Never run `migrate:fresh`, `db:wipe`, or destructive rollbacks against the workspace database.

```powershell
node admin-ui/export-content.mjs
php backend/artisan migrate
```

The migration already ran successfully on this workspace after creating a backup under `private/before-admin-*.sqlite`. It preserves the existing operational records. SQLite native `ADD COLUMN ... REFERENCES` avoids rebuilding legacy tables with their implicit indexes. If recovering the initial partial migration, an `assigned_to_legacy` column is retained rather than discarding any assignments.

Create the first administrator with explicit credentials:

```powershell
php backend/artisan northbyte:admin your-address@example.com --name="Your Name" --role=super_admin
```

The command securely prompts for the password and confirmation. It requires at least 12 characters. `NEW_ADMIN_PASSWORD` can instead be supplied through a secret manager; never put it into committed files or command history. Existing accounts are not overwritten unless `--promote` is explicitly supplied. **No founder/co-founder accounts or default Super Admin password are created.** Existing development messaging accounts remain development accounts; they must not be used as production credentials.

Start both services:

```powershell
npm run dev
```

`dev.mjs` launches Laravel on `127.0.0.1:8001` and the website on `127.0.0.1:4173`, using the same origin through the Node proxy. Stop any existing listeners on those ports before starting another copy. `PHP_BINARY` and `LARAVEL_PORT` can override the PHP executable or internal port.

Open `http://127.0.0.1:4173/admin/login`. Super Admins can use every module; administrators see operational modules; team members see assigned projects and their permitted communication/file tools. The current public website remains at `/` and clients continue to use `/dashboard`.

## Authentication and permissions

- Sanctum authenticates the admin UI through encrypted, HttpOnly session cookies. `/sanctum/csrf-cookie` bootstraps CSRF protection; admin mutations require `X-XSRF-TOKEN`. Tokens are not stored in browser localStorage.
- Laravel uses a separate `northbyte_admin_session` file-session store, preserving the existing Node `sessions` table. Successful admin login also issues a short-lived, hashed-at-rest Node session for the reused messaging API. Admin logout revokes this bridge session.
- Existing scrypt password hashes are verified through a local Node subprocess receiving input on STDIN. New administrative passwords are Laravel bcrypt hashes. Node supports verification of those hashes through PHP on STDIN. Passwords/hashes are never placed in process arguments or responses.
- Role/capability checks run in middleware; project and file access also use policies/scoped queries. Ordinary clients cannot use admin APIs. Administrative notes are separate records and never returned by client APIs. Internal chat notes remain filtered by the existing messaging backend.
- Super Admins manage team accounts and global settings. Administrators manage clients/projects/files/content. Team members access assigned projects; their custom permissions cannot exceed the role's built-in capabilities. The current Super Admin cannot remove their own access, and at least one active Super Admin is required.
- Suspending clients or changing team access revokes bridge sessions. Active Laravel requests reload the user and enforce account status/permissions. Password hash session checks invalidate old Laravel sessions after password changes.

## Migrations and storage

- `0001_01_01_000000_create_shared_tables.php`: reuses or creates the existing users, Node sessions, projects, conversations, participants, messages, attachments, reactions and events with their existing identifiers. Also provides password-reset tokens.
- Standard Laravel cache/job migrations support cache locks and queued mail.
- `2026_10_18_000001_add_administration.php`: additive account/profile/capability fields, richer projects and versions, milestones, project attachments, private notes, notifications, audit logs, settings and versioned CMS content.

Private project files live under `backend/storage/app/private`, outside public storage. Downloads are authorized controllers with no-cache/nosniff headers. Accepted formats are PDF, PNG, JPG, WEBP and DOCX. Images are decoded for validation, PDFs are signature checked, and DOCX files require valid OOXML entries. ZIP is disabled by default; enabling it also enables archive path/size/expansion/unsafe-entry checks. Limits are configurable up to a deployment hard cap. Add quarantine/malware scanning according to the deployment's upload threat model.

The website proxy blocks direct access to `backend/`, private folders, and the admin HTML shell. Protected `/admin/*` HTML is served by Laravel after authentication and authorization. Static admin JavaScript/CSS contain no credentials or operational data.

## Client integration

`site.config.js` now points `projectApiBase` to `/api/client`. Client project submissions, their requirements and attachments persist on the server, and administrators see them immediately. `ClientSession` validates the existing HttpOnly Node session and its Origin/CSRF token on each client mutation. Clients can only read/download their own records and files explicitly marked client-visible.

Old browser-only drafts remain in the client workspace. Starting a discussion for an old local-only request synchronizes its metadata through an owner-scoped import endpoint and creates/reuses its project conversation. Files that existed only as browser descriptors must be selected again; no file contents are invented. Full profile migration from older browser-only settings is outside this change.

## API overview

All admin API responses are JSON. Paginated collections include `data`, `current_page`, `last_page`, `total` and pagination URLs. Filters use `search`, `status`, `sort`, `direction`, `page`, and relevant file/project parameters. Mutation validation returns Laravel's standard `message` and `errors` fields. API paths under `/api/admin` include:

```text
POST login, logout, forgot-password, reset-password
GET  session, lookup, overview?days=7|30|90
PATCH profile
GET  clients, clients/:id
PATCH clients/:id
POST clients/:id/notes
GET/POST projects
GET/PATCH projects/:id
POST projects/:id/milestones, projects/:id/notes, projects/:id/discuss
GET files; POST projects/:id/files; GET/DELETE files/:id
GET/POST team; PATCH team/:id
GET content; PUT content/:group; POST content/:group/publish
GET notifications; POST notifications/read
GET activity-logs
GET/PUT settings
```

Client APIs are `/api/client/projects`, `/projects/import`, `/projects/:id`, `/projects/:id/discuss`, `/projects/:id/files`, and `/files/:id`. Client mutations require the Node `X-CSRF-Token` and exact Origin. The public CMS endpoint is read-only `/api/public/content`. Existing `/api/conversations`, `/api/messages`, `/api/attachments` and `/api/events` remain the messaging transport; see MESSAGING.md.

## CMS and static builds

`node admin-ui/export-content.mjs` snapshots the existing bilingual source content as the CMS's initial editable content. Draft changes are private and version checked. Publishing atomically releases the saved draft and writes a public-only `published-content.json` snapshot. The public site fetches published content and safely renders it, preserving the existing layout and animations. Only the intended `<br>`, `<em>` and `<strong>` formatting is accepted by the renderer; executable markup is escaped.

`npm run build` still generates readable static HTML and `site.bundle.js`, using the published snapshot when present. Without the backend or a published snapshot it uses the original `content.js` / `site.config.js`. Publish the generated static assets when using a static host; the interactive admin/client APIs require the backend. Contact details/brand changes update the public API cache after saving settings.

## Production configuration

Use a supported PHP 8.3+ release, Node 24+, HTTPS, PHP-FPM and a process/service manager. The PHP development server is for local development only. Set the following in `backend/.env`:

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-workspace.example
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=strict
SESSION_ENCRYPT=true
SANCTUM_STATEFUL_DOMAINS=your-workspace.example
SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=database
```

Generate an application key, configure the shared database path/driver and private storage permissions, migrate against a backed-up database, and provision administrators with explicit credentials. The Node service also needs `NODE_ENV=production`, matching `PUBLIC_ORIGIN`, `DATABASE_PATH`, `LARAVEL_PORT` and, when necessary, `PHP_BINARY`. The PHP service needs `NODE_BINARY`. Never deploy the development database or expose private storage, `.env`, backend source or Composer vendor files through a static root.

An HTTPS reverse proxy should forward the site to the Node server; Node sends admin/client/CMS/Sanctum routes to the internal Laravel service and retains the existing authenticated SSE route. Disable proxy buffering/caching on `/api/events` and allow long-lived requests. If SSE cannot connect, the messaging UI falls back to five-second authenticated polling and disables transport-only typing behavior. Use one Node process with the current shared SQLite transport; multiple replicas require shared presence/events/rate limiting and database adaptation.

Optional email requires real SMTP configuration (`MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS`, transport settings). Password reset reports unavailable when mail delivery is unconfigured. Operational emails require `ADMIN_MAIL_NOTIFICATIONS=true`, the recipient's email preference, and a queue worker:

```powershell
php backend/artisan queue:work --tries=3
```

Deployment commands after configuration:

```powershell
composer install --working-dir=backend --no-dev --optimize-autoloader
php backend/artisan migrate --force
php backend/artisan config:cache
php backend/artisan route:cache
php backend/artisan view:cache
npm run build
```

Keep `APP_DEBUG=false`, maintain OS/storage permissions, encrypted backups and an upload retention/quarantine policy. No production deployment or live infrastructure changes were performed.

## Verification

```powershell
npm run check
npm run check:admin
```

Tests use temporary/in-memory databases rather than resetting the local workspace. They cover admin/guest/client boundaries, role/capability scopes, sessions, legacy password verification with an isolated fixture, client submission and CSRF, project status/version checks, private file access, administrative note isolation, team management, suspension, notification ownership, draft privacy, versioned publishing, preferences/password changes, CMS rendering safety, and existing messaging/site behavior.

Current environment-dependent work: configure production SMTP and a queue worker; provision a real Super Admin; choose and test production infrastructure; adapt the shared Node transport before changing database engines or deploying multiple replicas. These settings have not been replaced with invented secrets.

Reference: [Laravel Sanctum documentation](https://laravel.com/docs/12.x/sanctum).

## Main source files

Frontend: `admin-ui/admin.js`, `ui.js`, `i18n.js`, `messages-locale.js`, `admin.css`, `index.html`, `login.html`. CMS integration: `cms.js`, `app.js`, `render.js`, `build.mjs`. Backend: `backend/routes/admin.php`, controllers/requests/middleware under `backend/app/Http`, models/policies/services/notifications under `backend/app`, migrations and seed snapshot under `backend/database`, provisioning command under `backend/app/Console/Commands`. Integration: `messaging/laravel-proxy.mjs`, password bridge helpers, `server.mjs`, `dev.mjs`, `dashboard.js`, `messages.js`, `site.config.js`. Tests: `backend/tests/Feature/AdminPanelTest.php`, `tests/admin-render.test.mjs`, and the existing site/messaging suite.
