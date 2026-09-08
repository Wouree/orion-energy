# PROGRESS

Branch `build/phase-0-1`, cut from `main` @ `e66b3a8`. Never merge to `main`.
**Read this file first after any context reset.** Then re-read `docs/CLAUDE.md`.

Legend: `TODO` · `IN PROGRESS` · `DONE` · `SKIPPED`

| Lot | Title | Status | Commit | Notes |
|---|---|---|---|---|
| 0 | Discovery | **DONE** | — | `docs/00-DISCOVERY.md`. 11 defects (D-01…D-11). Remediation surface ~53 strings vs ~8 scoped. |
| 1 | Content model + foundations | TODO | | 14 collections, i18n architecture |
| 2 | Phase 0 remediation | TODO | | 2a endpoint · 2b CTAs · 2c claims · 2d WhatsApp · 2e foundations |
| 3 | Site partner funnel | TODO | | 5 pages. Never name MRS / Corley. |
| 4 | Business hub + fiscal | TODO | | `/entreprises/incitations-fiscales/` = highest priority page |
| 5 | Safety + hardware | TODO | | |
| 6 | Residential | TODO | | |
| 7 | Forms + calculators | TODO | | |
| 8 | Sweep + verify | TODO | | |

## Environment (established Lot 0)
- Eleventy **3.1.2**, input `src` → output `_site`, Nunjucks. Build verified clean: 11 pages, 0.08 s.
- `node_modules` installed. Playwright **1.63.0** + Chromium installed.
- git **2.15.0** — no `git restore`, no `git branch --show-current`. Use `git checkout --` / `git rev-parse --abbrev-ref HEAD`.
- Single layout `src/_includes/base.njk`. No collections, no i18n, no eleventy-img yet.

## Standing user decisions (this run)
1. Working tree was restored from `HEAD`; the stray `index.njk copy` was deleted. Not an intentional wipe.
2. Cloudflare Pages build cannot be verified from here (no credentials, deploys forbidden).
   Lot 8 verifies the **local** Eleventy build and flags the CF check in `RUN-REPORT.md`.
3. Push `build/phase-0-1` to origin after **every** lot. Branch only. No PR. No merge.
