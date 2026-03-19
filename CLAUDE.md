# reps-contact

Find and contact your US congressional representatives.

## Stack

- **Framework**: Astro (hybrid SSR + static) with `@astrojs/cloudflare` adapter
- **Hosting**: Cloudflare Pages (GitHub-triggered deploy, NOT wrangler deploy)
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

Cloudflare Pages is configured to deploy automatically on push to `main` via GitHub integration.
Do NOT deploy via `wrangler deploy` or GitHub Actions — Cloudflare's built-in GitHub trigger handles it.

## Architecture

- `src/pages/` — Astro pages (landing page, API routes)
- `src/components/` — UI components (rep cards, zip lookup form, embed widget)
- `src/lib/` — Data fetching, geocoding, district lookup logic
- `src/data/` — Static data files, migration scripts
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

## Code Style

- Keep it simple — boring, readable code
- Don't over-engineer or add unrequested features
- Errors should bubble up, not be silently swallowed
- Use `git -c commit.gpgsign=false` for all commits
