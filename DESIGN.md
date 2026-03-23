# Design System — reps-contact

## Product Context
- **What this is:** A civic tool to find and contact your US congressional representatives by zip code
- **Who it's for:** US citizens who want to engage with their elected officials — all ages, all technical levels
- **Space/industry:** Civic tech (peers: congress.gov, govtrack.us, 5calls.org, ballotpedia)
- **Project type:** Single-page web app with SSR

## Aesthetic Direction
- **Direction:** Civic Editorial — authoritative and trustworthy like an institution, warm and action-oriented like a campaign
- **Decoration level:** Intentional — subtle warmth in backgrounds and borders, party-colored accents on cards
- **Mood:** Walking into a well-designed civic building. Serious but welcoming. You trust this tool because it looks like it was built with care, not generated from a template.
- **Reference sites:** congress.gov (authority), 5calls.org (action), govtrack.us (data)

### Design Risks (deliberate departures from civic tech norms)
1. **Serif display font** — most civic tech uses sans-serif everything. Instrument Serif adds editorial weight and makes the page feel authored, not templated.
2. **Warm amber accent** instead of government blue for CTAs — breaks from the default and adds urgency/action energy. Blue is still used for party and links.
3. **Warm background tone** — subtle but moves away from the cold gray that every civic site uses. Feels more inviting.

## Typography
- **Display/Hero:** Instrument Serif — editorial authority, warmth, distinctiveness
- **Body:** DM Sans — clean, highly readable, modern geometric sans
- **UI/Labels:** DM Sans (same as body)
- **Data/Tables:** DM Sans with font-variant-numeric: tabular-nums
- **Code:** JetBrains Mono
- **Loading:** Google Fonts CDN (`<link>` in `<head>`)
- **Scale:**
  - Hero: 48px/56px desktop, 36px/44px mobile
  - H2: 30px/36px
  - Body large: 18px/28px
  - Body: 16px/24px
  - Small: 14px/20px
  - Caption: 12px/16px

## Color
- **Approach:** Restrained — navy for authority, amber for action, warm neutrals everywhere else
- **Navy (primary brand):**
  - 50: #F0F3F8, 100: #D9E0ED, 200: #B3C1DB, 700: #2A3F6B, 800: #1F3056, 900: #1B2A4A, 950: #111B32
- **Amber (action/CTA):**
  - 50: #FFF8EB, 100: #FEECC0, 500: #D97706, 600: #B45309, 700: #92400E
- **Warm neutrals:**
  - 50: #FAF9F6 (page bg), 100: #F5F3EE, 200: #E8E5DD, 300: #D4CFC4, 500: #8A8279, 600: #6B6458, 700: #4A453C, 800: #3D3830, 900: #1A1A1A
- **Party colors:**
  - Republican: text #B91C1C, bg #FEF2F2, border #FECACA
  - Democrat: text #1D4ED8, bg #EFF6FF, border #BFDBFE
  - Independent: text #7C3AED, bg #F5F3FF, border #DDD6FE
- **Semantic:** success #059669, warning #D97706, error #DC2626, info #2563EB
- **Dark mode:** Not implemented (single light theme for now)

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable
- **Scale:** 2xs(2px) xs(4px) sm(8px) md(16px) lg(24px) xl(32px) 2xl(48px) 3xl(64px) 4xl(96px)

## Layout
- **Approach:** Grid-disciplined
- **Content width:** max-w-2xl (672px) for the search form area, max-w-4xl (896px) for results
- **Border radius:** sm: 4px, md: 8px, lg: 12px, xl: 16px, full: 9999px
- **Cards:** 12px radius, subtle shadow, party-colored left border accent (4px)
- **Photos:** 8px radius, slightly larger than current (h-28 w-24)

## Motion
- **Approach:** Minimal-functional
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(50-100ms) short(150-250ms) medium(250-400ms)
- **Usage:** Hover states, loading spinner, card hover lift. No entrance animations.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-23 | Initial design system | Created via /design-consultation. Civic editorial aesthetic with Instrument Serif + DM Sans, navy/amber palette, warm neutrals. |
