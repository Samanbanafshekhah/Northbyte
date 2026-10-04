# NorthByte website

Native HTML, CSS, and JavaScript, extending the existing dependency-free project. No framework migration or runtime package installation.

## Run and verify

- `npm run dev` rebuilds the static page and serves http://127.0.0.1:4173.
- `npm run build` regenerates `index.html` after content, configuration, or renderer edits.
- `npm run check` checks JavaScript syntax and runs content, navigation, portrait mapping, and reversible-motion tests. Run the build before checks.

The static English document contains the entire site for readability without JavaScript. Language switching, scroll effects, and contact preparation use JavaScript. Publish the root HTML/CSS/JS files and `assets/` on a static host. `server.mjs` is a loopback development server, not a production backend.

## Editable values

Edit `site.config.js`:

- `brand`: existing **NorthByte** name, in one place.
- `people`: **Saman Banafshe Khah / Founder / person-2.png** (sunglasses) and **Mohsen Zirak / Co-founder / person-1.png** (clear glasses). Includes English/Persian names and centralized portrait paths.
- `contactEmail`: currently empty. Set a real address to enable the contact form's mailto draft and visible email link. Without it, the form explicitly offers a local brief download and does not send data.
- `publicUrl`: set the real public URL to include canonical and Open Graph URL metadata.
- `authEndpoint`: sign-in API endpoint. It is empty by default, so `/login` reports that workspace access is not connected instead of simulating authentication.
- `registerEndpoint`: account-registration API endpoint. It is empty by default, so `/register` never creates a fake account.
- `sessionEndpoint`: authenticated-session endpoint used to protect `/dashboard` when a backend is connected.
- `projectApiBase`: API base for private project submission and uploads. It is empty by default, so the dashboard runs in clearly labelled local preview mode.
- `postLoginPath`: destination used after a successful API sign-in.
- `demoAuth`: local preview credentials for testing login → dashboard. These values are public client-side demo data and must be disabled when real authentication is connected.

`content.js` holds all English/Persian copy and case studies. Category names are used instead of unapproved client/product names. Relevant technologies are suggestions fitting the described scope, not claims of a verified project stack. No launch dates, outcomes, metrics, or endorsements are asserted. Replace titles with approved public names only when available.

## Design and behavior

Sections: hero, services, selected work, process, team, technology, contact, footer. Portraits appear **only in the team section**, as circular profile photos beside English/Persian biographies. The hero uses an animated abstract architecture illustration. Services and projects use lightweight HTML/CSS diagrams. The original portrait files and faces are unchanged.

All main content groups use reversible viewport reveal motion, with subtle card/button hover effects and an animated architecture illustration. Effects pause when the hero is offscreen. OS reduced-motion settings and the footer control disable decorative movement. Scroll depth uses a single scheduled animation frame.

Persian uses Vazir, RTL layout, translated navigation, project descriptions, form validation/status, document title, description, and Open Graph metadata. Language preference is stored locally; entered form values and expanded projects survive switching. Remote fonts are optional; system fallbacks are included.

Contact form uses native validation with localized messages. A configured email opens a draft for the visitor to send; it never claims server delivery. Without JavaScript, the submit button is disabled to avoid accidentally exposing form data in a GET query. No analytics or external form service is included.

The build generates dedicated `/login` and `/register` pages with English/Persian copy, accessible validation, password controls, reduced-motion support, and responsive layouts. Their submit handlers only send credentials when the corresponding API endpoint is configured.

The client workspace is available at `/dashboard`, with nested project, file, message, profile, and settings routes. It includes a six-step project request flow, file type/size validation, local draft autosave, project tracking, responsive navigation, notifications, and empty states. Real authentication, authorization, messaging, and private file access require the configured backend endpoints; the static preview does not claim to provide server security.

The build also generates site.bundle.js, a classic script that supports directly opening index.html without module imports. Prefer npm run dev for browser testing. Biographies are editable in site.config.js and use only the supplied team background.

