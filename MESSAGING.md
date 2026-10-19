# NorthByte messaging

The Messages tab uses the existing HTML/CSS/JavaScript dashboard. A Node server now provides cookie sessions, a SQLite database and genuine live events. The same `/dashboard/messages` route shows a client workspace or a team inbox based on the authenticated server-side role. The login and registration forms connect to the server rather than trusting browser demo-session data.

## Run locally

Use **Node 24 or newer**; the system's Node 20 cannot run `node:sqlite`. The complete workspace also requires the Laravel PHP/Composer setup and migrations in [ADMIN.md](ADMIN.md). No npm dependencies or separate database service are needed for the local SQLite configuration.

```powershell
npm run dev
npm run check
```

This machine also has a compatible runtime at `C:\Users\Asus\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`. Run `build.mjs`, `server.mjs`, or `--test tests/*.test.mjs` with that executable if Node 20 is still on PATH.

Open `http://127.0.0.1:4173/login`. Development mode seeds two **local test accounts**:

| Role | Email | Password |
| --- | --- | --- |
| Client | client@northbyte.dev | NorthByte2026! |
| Admin | team@northbyte.dev | NorthByteTeam2026! |

Use different browser profiles to test both accounts simultaneously. Cookies are shared between tabs in one profile. These are real server accounts in a development database, not simulated conversations. No messages, replies, read receipts, typing, or presence are fabricated. Presence means the user currently has an authenticated live workspace connection, not that they are viewing a particular conversation. A single demo verification conversation was created during browser QA.

## Deployment

These steps describe the Node messaging service. Deploy the Laravel administration service, shared database, private storage, and fixed upstream proxy as described in ADMIN.md as well. Use Laravel's secure `northbyte:admin` command for the initial Super Admin.

1. Install Node 24+ on a persistent host. Static-only hosting cannot provide messaging.
2. Deploy the project sources and run `npm run build`. **Do not deploy the development `private/` database.**
3. Set environment variables below, use a new production database, and create the initial administrator with the CLI.
4. Run `node server.mjs` under a service manager. Bind to loopback behind an HTTPS reverse proxy.
5. Proxy `/api/events` without buffering or caching, allow long-lived connections, and set a read timeout above the 20-second heartbeat. Proxy all requests to the Node server; it authenticates file downloads.
6. Back up SQLite using its online backup facilities or stop the server before copying the database and its WAL/SHM companions. Protect the data directory with OS permissions and encrypted volumes/backups.

```powershell
$env:NODE_ENV = 'production'
$env:PUBLIC_ORIGIN = 'https://workspace.example.com'
$env:DATABASE_PATH = 'D:\NorthByteData\northbyte.sqlite'
$env:HOST = '127.0.0.1'
$env:PORT = '4173'
# Provision this through the host's secret manager or an interactive secret prompt.
# Do not commit passwords or put them into shell history.
$env:NEW_USER_PASSWORD = [System.Net.NetworkCredential]::new('', (Read-Host 'Initial admin password' -AsSecureString)).Password
node messaging/create-user.mjs admin@example.com "Workspace Administrator" super_admin
Remove-Item Env:NEW_USER_PASSWORD
node server.mjs
```

| Variable | Default | Purpose |
| --- | --- | --- |
| NODE_ENV | development | Set `production` to disable development seeds and use Secure cookies. |
| PUBLIC_ORIGIN | http://127.0.0.1:4173 | Exact browser origin for same-origin/CSRF checks; use HTTPS in production. |
| DATABASE_PATH | ./private/northbyte.sqlite | SQLite database with private attachment BLOBs; outside the deployed static tree is recommended. |
| HOST | 127.0.0.1 | Server bind address. |
| PORT | 4173 | Server port. |
| ALLOW_REGISTRATION | false in production | Set exactly `true` to allow new client registrations. Development registration is enabled. |
| NEW_USER_PASSWORD | none | Used only by `messaging/create-user.mjs`; requires 12+ characters. |

Run the CLI with `admin`, `team_member`, `super_admin`, or `client` to provision more accounts. Public registration always creates a client and ignores submitted role claims. Team members see unassigned conversations or those assigned to them; managers see the whole inbox. Only managers can reassign a conversation to another person. There is no public role-switch control.

## Data and migrations

`messaging/migrations/001.sql` creates users, sessions, projects, conversations, participants/read markers, messages, private attachments, reactions, events, and indexes/constraints. `002.sql` adds message identifiers to invalidation events. `openStore` applies the versioned migration transactionally on startup; re-running it preserves existing data. Messages and attachment associations are committed together, with a unique sender/nonces constraint for retry deduplication.

SQLite uses WAL, foreign keys and parameterized queries. Attachments are BLOBs in the database, never public static files. Pending uploads are removed after 24 hours. Current limits: 5,000 characters per message, six files per message, 10 MB per file. Accepted types are PNG, JPEG, WEBP, PDF, UTF-8 TXT and MD; the server verifies file signatures/content, independently of browser MIME types. PDFs and text download as attachments with a sandbox policy. Documents with active HTML, SVG, scripts, executables and archives are not accepted.

## HTTP API

All authenticated calls use an HttpOnly, SameSite=Strict session cookie. Every mutation except login/registration also requires the `X-CSRF-Token` from `GET /api/session`. Every mutation requires an Origin matching PUBLIC_ORIGIN. API and private file responses are not cached.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | /api/auth/login, /api/auth/register, /api/auth/logout | Authentication; registration creates clients only. |
| GET | /api/session | Current user and CSRF token. |
| GET | /api/conversations | Scoped, cursor-paginated inbox, search/filter, aggregate unread count. Query `search`, `filter`, `before` (conversation ID). |
| POST | /api/conversations | Start a conversation; project ID deduplicates project channels. |
| PATCH | /api/conversations/:id | Team status/assignment changes. |
| GET | /api/conversations/:id/messages | 40-message cursor page; query `before` (message ID). Includes scoped info and recent shared files. |
| POST | /api/conversations/:id/messages | Send public message or authorized internal note, optional reply/files, required idempotency nonce. |
| GET, PATCH, DELETE | /api/messages/:id | Scoped read; sender-only edit or soft deletion. |
| POST | /api/messages/:id/reactions | Toggle an allowed emoji reaction. |
| POST | /api/conversations/:id/attachments | Private raw upload; `X-File-Name` contains URI-encoded filename. |
| GET | /api/attachments/:id | Authorized download; images support `?preview`. |
| POST | /api/conversations/:id/read, /typing, /mute | Read cursor, throttled typing, notification muting. |
| POST | /api/projects | Register the signed-in client's project metadata for discussion. |
| GET | /api/team, /api/team/clients | Authorized team identity/client selection. |
| GET | /api/events | Authenticated server-sent event stream, optional `since` or Last-Event-ID. |

## Live updates

This dependency-free server uses **Server-Sent Events (SSE)** for server-to-browser events and authenticated HTTP for commands. SSE supports the required live message experience without adding a WebSocket dependency. Required events are implemented: `message.created`, `message.updated`, `message.deleted`, `conversation.updated`, `typing.started`, `typing.stopped`, `message.read`, `reaction.added`, `reaction.removed`, `presence.updated`. `ready` and `inbox.updated` handle reconnects and changed team scope.

Each event is authorized against current conversation permissions. Durable events carry invalidation IDs, never message bodies or note contents; clients refetch through authorized APIs. Internal-note events and files are filtered on the server. Reconnection replays up to 1,000 missed invalidations and refreshes the inbox/latest history; nonces deduplicate optimistic sends. Typing expires after five seconds; presence is derived from live sessions. Listener setup is once per dashboard lifecycle, route-local references are released on navigation, and logout closes the stream and revokes the server session.

## Features and verification

- Responsive inbox/chat/details panels, mobile list/back navigation, search, unread filters, skeletons, and empty/error/disconnection states.
- Message grouping, date separators, multiline composer, emoji insertion, replies, copy, own edit/delete, reactions, send retry, read markers, and new-message jump button.
- Private image previews and document downloads, drag/drop, upload progress, validation, removal before send.
- Team assignment, open/pending/resolved/closed filters/statuses, internal notes, and scoped client selection.
- Unread sidebar counts, generic authorized toasts, document title updates, conversation mute, and per-account notification preference.
- Project detail and submission-success **Discuss This Project** buttons create/reuse one private channel per project.
- Keyboard controls, focus states, reduced-motion styling, scrypt password hashing, rate limits, CSRF/origin checks, text escaping, and CSP.

`tests/messaging.test.mjs` starts an isolated HTTP server with a temporary SQLite database. It checks simultaneous client/admin sends, real event delivery, reconnect replay, persistence after DB reopen, project deduplication, pagination, typing/read events, files and spoofed-file rejection, ownership, CSRF, assignment boundaries, internal-note isolation, reactions/edit/delete/muting, and session revocation. Existing site tests run as well. Browser QA verified client login, conversation creation, sending, and refresh persistence.

## Current limits

- Run **one Node process** per SQLite database. Connection presence, typing and rate limiting are process-local. Multiple replicas require a shared event/rate-limit/presence service and a suitable database. SQLite attachment BLOBs suit a modest workspace; larger deployments should use private object storage behind the same authorization checks.
- The existing project builder/profile/preferences are still per-account browser data. Discussing a project syncs its title/description/ownership to the messaging server; it does not migrate the entire old project-management feature or previously selected local project files. Upload files in the project conversation for secure persistent sharing.
- No email verification, password recovery, 2FA, push/email notifications, antivirus pipeline, document conversion, or user-management web UI is implemented. Before accepting untrusted production uploads, integrate malware scanning/quarantine appropriate to the deployment. This implementation has automated security checks, not an independent security audit.
- Conversation search currently covers titles and client names, not message bodies. Shared-file panel shows the most recent 30 files. Message history uses cursor paging rather than virtualization; loaded older pages remain in memory while the conversation is open.
- A browser profile shares one sign-in across tabs. Switching client/team accounts requires different profiles or signing out and back in.
