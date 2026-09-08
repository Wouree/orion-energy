# PROGRESS

Branch `build/phase-0-1`, cut from `main` @ `e66b3a8`. Never merge to `main`.
**Read this file first after any context reset.** Then re-read `docs/CLAUDE.md`.

Legend: `TODO` · `IN PROGRESS` · `DONE` · `SKIPPED`

| Lot | Title | Status | Commit | Notes |
|---|---|---|---|---|
| 0 | Discovery | **DONE** | `f43c1e3` | `docs/00-DISCOVERY.md`. 11 defects (D-01…D-11). Remediation surface ~53 strings vs ~8 scoped. |
| 1 | Content model + foundations | **DONE** | `3a34dd9` | 14 collections live, 43 items, 3 withheld by governance. D-04/05/06 fixed. i18n wired, `en` unbuilt. |
| 2 | Phase 0 remediation | **DONE** | `103c6b6` `3834db5` `cd3c4c1` `3f2cda6` `aa70d4a` | All five parts. ~53 claim strings removed. 21 CTAs wired. Verified in Chromium. |
| 3 | Site partner funnel | **DONE** | `d58aa90` | 5 pages. Nav + footer now data-driven. `scripts/verify.js` added. **4 forward links open** → Lots 4/5. |
| 4 | Business hub + fiscal | **DONE** | | Hub, fiscal page (5 sourced `donnee_externe` claims), method, 5 sector pages. **1 forward link open** → Lot 5. |
| 5 | Safety + hardware | **IN PROGRESS** | | |
| 6 | Residential | TODO | | |
| 7 | Forms + calculators | TODO | | |
| 8 | Sweep + verify | TODO | | |

## Architecture (established Lot 1)
- Editorial content: `content/<collection>/*.md`, **outside** `src/`. Loader: `src/_data/orion.js` → `orion.*` in templates.
  (`content` is a **reserved** Eleventy data name — a `src/_data/content.js` aborts the build.)
- Governance is enforced **in the loader**: gated items never become data. Validation failures **fail the build**.
- Claims render only via `{% claim "slug" %}` / `| claimText` / `| claimValue` / `| hasClaim`.
- `src/_data/site.js` ← `content/site_settings/general.md`. `site.has_phone` / `site.has_form_endpoint` gate rendering.
- i18n: `src/_data/i18n.js` + `src/_data/eleventyComputed.js`. `en.built = false` → **no hreflang emitted**. Flip one line to enable.
- Deps added: `gray-matter`, `playwright`.

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
