# reps-contact

Find and contact your US congressional representatives.

## Stack

- **Framework**: Astro (hybrid SSR + static) with `@astrojs/cloudflare` adapter
- **Hosting**: Cloudflare Workers (deployed via `wrangler deploy`)
- **Database**: Cloudflare D1
- **Package manager**: pnpm
- **Styling**: Tailwind CSS

## Commands

```bash
pnpm install         # install dependencies
pnpm dev             # local dev server
pnpm build           # production build
pnpm test            # run tests
```

## Deployment

@astrojs/cloudflare v13+ targets Cloudflare Workers (not Pages). Deploy with:

```bash
pnpm build
npx wrangler deploy --config dist/server/wrangler.json
```

Live URL: https://reps-contact.option-zero.workers.dev

## Architecture

- `src/pages/` — Astro pages (landing page, API routes)
- `src/components/` — UI components (rep cards, zip lookup form, embed widget)
- `src/lib/` — Data fetching, geocoding, district lookup logic
- `scripts/` — Data seeding scripts
- `d1-schema/` — D1 database migrations
- `public/` — Static assets (headshots, etc.)

## gstack

This project uses gstack skills for development workflow. Available skills:
- `/office-hours` — brainstorm and reframe
- `/plan-eng-review` — architecture review
- `/review` — code review
- `/qa` — testing
- `/ship` — deployment
- `/browse` — headless browser testing

Use `/browse` exclusively for any web interaction or testing.

## Dev Server

Run the dev server in a tmux session named `devserver` with a window named after the project:

```bash
tmux new-session -d -s devserver -n repscontact "bash -c 'export PATH=$HOME/.nvm/versions/node/v22.22.1/bin:$HOME/.local/share/pnpm:\$PATH && pnpm dev --host'"
```

The dev server MUST accept requests to hostname `marvin-wsl` (configured in `astro.config.mjs` via `vite.server.allowedHosts`).

## Code Style

- Keep it simple — boring, readable code
- Don't over-engineer or add unrequested features
- Errors should bubble up, not be silently swallowed
- Use `git -c commit.gpgsign=false` for all commits

## Design System

Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.
