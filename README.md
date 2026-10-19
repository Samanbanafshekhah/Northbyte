# NorthByte website

Native HTML, CSS, and JavaScript with Node 24+ / SQLite authentication and private messaging, plus a Laravel 12 administration backend. See [ADMIN.md](ADMIN.md) for backend setup, migrations, secure administrator creation, API routes, and deployment; [MESSAGING.md](MESSAGING.md) documents the messaging transport.

## Run and verify

- Complete the PHP/Composer environment setup and migrations in ADMIN.md first.
- `npm run dev` rebuilds the static page and starts Node at http://127.0.0.1:4173 and Laravel at port 8001. Set `PHP_BINARY` if PHP is not on PATH.
- `npm run build` regenerates `index.html` after content, configuration, or renderer edits.
- `npm run check` checks JavaScript syntax and runs content, navigation, portrait mapping, and reversible-motion tests. Run the build before checks.
- `npm run check:admin` runs the isolated Laravel authorization, project, file, CMS, and account tests.
- Open `/admin/login` for the separate administration workspace.

The static English document contains the public site for readability without JavaScript. The public marketing pages can be hosted statically; login, registration and messaging require the Node server and persistent storage. The server binds to loopback by default. Production requires the HTTPS proxy and environment setup in MESSAGING.md.

## Editable values

Edit `site.config.js`:

- `brand`: existing **NorthByte** name, in one place.
- `people`: **Saman Banafshe Khah / Founder / person-2.png** (sunglasses) and **Mohsen Zirak / Co-founder / person-1.png** (clear glasses). Includes English/Persian names and centralized portrait paths.
- `contactEmail`: currently empty. Set a real address to enable the contact form's mailto draft and visible email link. Without it, the form explicitly offers a local brief download and does not send data.
- `publicUrl`: set the real public URL to include canonical and Open Graph URL metadata.
- `authEndpoint`: `/api/auth/login`, backed by server-side password verification and session cookies.
- `registerEndpoint`: `/api/auth/register`, creates client accounts when registration is enabled.
- `sessionEndpoint`: `/api/session`, protects the dashboard with authenticated server sessions.
- `projectApiBase`: `/api/client`, backed by Laravel for private project submission and uploads.
- `postLoginPath`: destination used after a successful API sign-in.
- `demoAuth`: legacy client-side preview is disabled. Development test users are seeded server-side; see MESSAGING.md. Never deploy the development database.

`content.js` holds all English/Persian copy and case studies. Category names are used instead of unapproved client/product names. Relevant technologies are suggestions fitting the described scope, not claims of a verified project stack. No launch dates, outcomes, metrics, or endorsements are asserted. Replace titles with approved public names only when available.

## Design and behavior

Sections: hero, services, selected work, process, team, technology, contact, footer. Portraits appear **only in the team section**, as circular profile photos beside English/Persian biographies. The hero uses an animated abstract architecture illustration. Services and projects use lightweight HTML/CSS diagrams. The original portrait files and faces are unchanged.

All main content groups use reversible viewport reveal motion, with subtle card/button hover effects and an animated architecture illustration. Effects pause when the hero is offscreen. OS reduced-motion settings and the footer control disable decorative movement. Scroll depth uses a single scheduled animation frame.

Persian uses Vazir, RTL layout, translated navigation, project descriptions, form validation/status, document title, description, and Open Graph metadata. Language preference is stored locally; entered form values and expanded projects survive switching. Remote fonts are optional; system fallbacks are included.

Contact form uses native validation with localized messages. A configured email opens a draft for the visitor to send; it never claims server delivery. Without JavaScript, the submit button is disabled to avoid accidentally exposing form data in a GET query. No analytics or external form service is included.

The build generates dedicated `/login` and `/register` pages with English/Persian copy, accessible validation, password controls, reduced-motion support, and responsive layouts. Their submit handlers only send credentials when the corresponding API endpoint is configured.

The client workspace is available at `/dashboard`, with nested project, file, message, profile, and settings routes. It includes a six-step project request flow, private server submissions/uploads, local draft autosave, project tracking, responsive navigation, notifications, and empty states. `/dashboard/messages` provides persistent private conversations, SSE updates, uploads, replies, reactions, unread counts and a role-controlled team inbox. New project requests persist in the shared database and appear in `/admin/projects`; older browser-only drafts are preserved and can be imported when opening a project discussion. The public website can consume explicitly published bilingual CMS content while retaining its static fallback.

The build also generates site.bundle.js, a classic script that supports directly opening index.html without module imports. Prefer npm run dev for browser testing. Biographies are editable in site.config.js and use only the supplied team background.

