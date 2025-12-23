# Repository Guidelines

## Project Structure & Module Organization
- `src/components` holds UI primitives such as `WebchatWithConversations`, `EmbeddedLayout`, and list items; `src/pages/EmbedPage.tsx` renders the embed route.  
- `src/hooks` contains stateful helpers like `useConversationList`; `src/utils` carries config parsing and helpers.  
- `src/i18n` provides runtime language handling; CSS translations live in `public/translations` with docs in `docs/translation/README.md`.  
- `src/inject/inject.ts` powers the embeddable `inject.js` served from `public/` for iframe usage.  
- Static assets are in `public/`; built artifacts go to `dist/` after `npm run build`.

## Build, Test, and Development Commands
- `npm install` — install dependencies (project tracks `package-lock.json`).  
- `npm run dev` — start Vite dev server at http://localhost:5173 with HMR.  
- `npm run build` — type-check with `tsc -b` then bundle via Vite for production.  
- `npm run preview` — serve the production build locally.  
- `npm run lint` — run ESLint over the repo.

## Coding Style & Naming Conventions
- TypeScript + React 18 with functional components; prefer hooks and prop drilling over globals except the intentional `window.botpress` API.  
- 2-space indentation, single quotes, and trailing commas (follow existing files); no semicolons.  
- Components/pages use `PascalCase.tsx`; hooks start with `use*`; utility modules are `camelCase.ts`.  
- Keep embed-facing changes synchronized between `src/inject/inject.ts` and the generated `public/inject.js`.

## Testing Guidelines
- No automated test harness is configured yet. For changes, smoke-test both modes: conversation list (`npm run dev` → root path) and embed (`/embed` or `mode=embedded`).  
- Validate language switching by toggling `lang` param and loading CSS from `public/translations`. Add targeted tests with Vitest/RTL if you introduce critical logic.

## Commit & Pull Request Guidelines
- Follow the existing Conventional Commit style (`feat: …`, `fix: …`, optional scope or issue tag like `(#1)`).  
- PRs should describe behavior changes, link related issues, and note the Botpress client/script parameters used for testing.  
- Include screenshots or short GIFs for UI changes (desktop + mobile) and mention any i18n or embed-impacting updates.

## Security & Configuration Tips
- Keep real Botpress Client IDs and script URLs out of commits; use `.env` (`VITE_BOTPRESS_CLIENT_ID`) for defaults.  
- When hosting `inject.js` on a CDN, set `host` in `window.botpress.init` to your embed origin to avoid mixed content or CORS issues.
