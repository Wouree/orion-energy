# DECISIONS

Every judgement call, one line each, with reasoning. Newest at the bottom of each lot.

## Lot 0 — Discovery

- **Restored the deleted working tree rather than treating the empty tree as intent.** All 26 tracked files were deleted unstaged while `HEAD` was intact, and a stray `index.njk copy` remained — the signature of a file-manager mishap, not a deliberate wipe. Rebuilding from nothing would also have made Lots 0 and 2 incoherent, since both assume existing pages to audit and remediate. Confirmed with the user before acting.
- **Created `build/phase-0-1` from `main` @ `e66b3a8`** as `CLAUDE.md` requires. All work is on this branch; `main` is untouched.
- **Installed `node_modules` and Playwright as part of Lot 0, before writing the discovery report.** Lot 0 says "report, do not edit", but it also instructs installing Playwright if absent, and the build had to be run to state the before-state build status truthfully. No source file was modified.
- **Counted `40%` in `style.css:223` and `style.css:604` as false positives.** They are CSS gradient stops, not claims.
- **Counted `24h/24` in `bornes-publiques:40` and `:99` as false positives.** "Stations sécurisées 24h/24" and "bien éclairées 24h/24" describe continuous availability, not a response-time commitment. The brief forbids a response-time *figure*; these are not one.
- **Counted `application/json` in `main.js:186` as a false positive** for the "application" sweep.
- **Widened the claim sweep beyond the brief's literal strings.** The brief lists eight; the same defect classes appear ~53 times, including three strings it did not name: `IEC 62196`, `NF C 15-100`, and an "Installation en 24h" lead-time badge. The brief explicitly anticipates this ("If a claim string appears anywhere Lot 0 did not predict… log it and fix it"), so the wider set is in scope rather than a scope expansion.
- **Treated `securite/index.njk:4` (meta description) as in-scope.** It is a published claim even though it never renders as visible copy — precisely the "alt text, meta description, JSON-LD, OG tags" case the brief calls out.
- **Recorded the Sveltia `base_url` mismatch as a defect rather than fixing it in Lot 0.** `src/admin/config.yml` points at `auth.orionenergycmr.com`; `CLAUDE.md` mandates the shared `auth.wouree.com`. Lot 0 is report-only, and changing an auth host is a Lot 1 structural change. Logged as D-04.
- **Did not change `backend.branch: main` in the Sveltia config.** The CMS is correctly wired to production for the live site; repointing it is outside this branch's authority and would break the client's editing today.
- **Logged the `#25D366` WhatsApp green as compliant, not as a palette violation.** `CLAUDE.md` requires non-brand status/utility colours to sit outside the brand palette; a third-party channel colour on a third-party channel button is the intended case.
