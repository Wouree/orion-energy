# BUILD_BRIEF.md — ORION Energy, Phases 0 and 1

Read `CLAUDE.md` first. Read `docs/PROGRESS.md` before starting and after every compaction.

Work the lots in order. Update `docs/PROGRESS.md` on entering and leaving each lot. Commit at every lot boundary. If a lot is blocked, log it, mark it `SKIPPED` with the reason, and move to the next — **do not stall**.

Target: Lots 0–4 are the priority. Lots 5–8 if time allows. Finishing five lots properly beats touching all nine.

---

## LOT 0 — Discovery (report, do not edit)

Establish ground truth before changing anything.

1. Repo layout: Eleventy version, data cascade, layout and include structure, existing collections, where site-wide config lives.
2. `grep` for `YOUR_GOOGLE_APPS_SCRIPT_URL_HERE` and `form-endpoint`. Report every file, and whether the value is per-page front matter or inherited from `_data`. **This determines whether Lot 2 is a one-line fix or a structural one.**
3. `grep` for `href="#"` and `href='#'`. Report file, line, link text.
4. `grep` for each and report file and line: `Pionnier`, `Premier réseau`, `40%`, `-40 %`, `Garantie complète`, `Ingénieurs certifiés`, `IEC 61851`, `24h`, `Réponse sous 24`, and `application` where it refers to session tracking.
5. `grep` for `wa.me`. Report whether message text is hardcoded once in a layout or set per page.
6. Confirm whether Playwright is installed; install if not.
7. Confirm Sveltia config location and current collections.

Write findings verbatim to `docs/00-DISCOVERY.md` before any edit. This is the recoverable before-state.

**Decision rule for the rest of the run:** if a value is inherited from `_data` or a layout, fix it there once. If duplicated per page, fix per page and log the duplication as a defect.

Commit: `docs: lot 0 discovery findings`

---

## LOT 1 — Content model and foundations

Scaffold the CMS collections. Fields are specified in `docs/CONTENT-MODEL.md` if present; otherwise create it from this list.

Collections: `claim`, `cta`, `form_definition`, `site_settings`, `product`, `person`, `sector_solution`, `faq_item`, `guide`, `article`, `station`, `partner`, `testimonial`, `city`.

Critical field requirements:
- `claim` — must include `approved` boolean; templates must not render an unapproved claim.
- `station` — must include `status` (`ouverte` | `installation` | `annoncee` | `etude`) **and** `owner_type` (`orion` | `partner` | `private`) from day one. Private listings stay disabled; the field must exist so peer-to-peer sharing is a later feature flag, not a data migration.
- `product` — populate with the four models from `CLAUDE.md`.
- `person` — populate with the two names, `draft: true`.
- `site_settings` — includes `form_endpoint`, left empty (see Lot 2).

Set up the i18n architecture: every route gets an `/en/` twin with correct `hreflang`. **Build the structure; write no English copy.**

Commit: `feat(cms): scaffold content collections and i18n architecture`

---

## LOT 2 — Phase 0 remediation

Apply the fixes, conditional on Lot 0 findings.

**2a — form endpoint.** Move to a single site-wide value in `_data`. Leave the value empty and log in `docs/PENDING.md`: the site forms need their own Apps Script deployment and sheet, separate from the questionnaire backend; Digitaall to supply. Frontend branches on `result.ok`, not `response.ok`.

**2b — dead CTAs.** Wire every `href="#"`. Where no destination exists yet, point at `/contact/`. Fail the run if any survive.

**2c — claims.** Exact replacements, client-approved:

| Remove | Replace with |
|---|---|
| Pionnier de la recharge électrique au Cameroun | L'opérateur de recharge du Cameroun — de l'audit à la maintenance |
| Premier réseau dédié… | Le seul acteur qui conçoit, installe, alimente et exploite la recharge de bout en bout |
| −40 % de coût d'exploitation… | **Delete. No replacement.** |
| Garantie complète | Garantie de 12 mois sur le matériel et 12 mois sur l'installation (pièces et main-d'œuvre) |
| Ingénieurs certifiés / IEC 61851 | **Delete both.** Hardware carries CE and RoHS only. |
| Sessions suivies "via l'application" | **Delete.** The app does not exist. |
| Réponse sous 24h | **Delete the figure. Substitute no number.** |

If a claim string appears anywhere Lot 0 did not predict — alt text, meta description, JSON-LD, OG tags — log it and fix it.

**2d — WhatsApp.** Compose deep links from page context; URL-encode. Number `237692439292`. Distinct pre-filled text for home charging, fleet, site partner, contact.

**2e — foundations.** Analytics, UTM capture, form-source hidden fields (`source_page`, `segment`, `tool_result`, `utm_*`, `language`), `Organization` and `LocalBusiness` schema.

Commits: `fix(forms):` · `fix(cta):` · `fix(copy):` · `fix(whatsapp):` · `feat(analytics):`

---

## LOT 3 — Site partner funnel

The highest-value unblocked work. Revenue-share terms are known. **Never name MRS or Corley.**

- `/site-partenaire/` — hub. Your car park can become a destination.
- `/site-partenaire/criteres/` — eligibility, self-qualification.
- `/site-partenaire/modeles-economiques/` — lead with the model ORION actually offers: ORION carries equipment, civil works, grid connection, consumed electricity, maintenance, insurance and signage; the host contributes land. This is a strong offer — make the economics legible.
- `/site-partenaire/programme/` — badge, map listing, comms kit, usage reports, co-marketing.
- `/site-partenaire/proposer-mon-site/` — submission form: site type, address, hours, spaces, footfall, available power, existing solar, security, decision-maker.

Commit: `feat(site-partenaire): host funnel, criteria, commercial models, submission form`

---

## LOT 4 — Business hub and the fiscal argument

- `/entreprises/` — hub, routes by sector.
- `/entreprises/incitations-fiscales/` — **highest priority page on the site.** Cameroon's 2025 Finance Law: excise exemption on EVs plus a 50 % abatement on taxable value for two years, explicitly covering batteries and charging stations. 2026 Finance Law raised excise on older imports (12.5 % for 12–20 years, 25 % beyond 20). Every figure needs a `claim` entry classed `donnee_externe`, with source and date. No client data required — build it fully.
- `/entreprises/methode/` — the five-step method: audit, modelling, business case, deployment, operation.
- Sector pages from the `sector_solution` template: `/flottes/`, `/hotellerie-restauration/`, `/centres-commerciaux/`, `/immobilier/`, `/stations-service/`.

Cross-link hotels and forecourts into `/site-partenaire/modeles-economiques/`. That link is where a customer becomes a network node — it matters more than any other interlink on the site.

Commit: `feat(entreprises): hub, fiscal incentives, method, sector pages`

---

## LOT 5 — Safety cluster and hardware catalogue

- `/securite/` hub.
- `/securite/coupures-et-surtensions/` — outages and surge protection. Pure expertise, no client data. A local electrician currently out-ranks ORION on this; write it properly.
- `/securite/protocole-installation/` — what is tested before handover.
- `/securite/garantie/` — durations and cover are known; exclusions and territory are `PENDING_DATA`.
- `/technologie/materiel/` — the four models with full spec tables from `product`. State connectors factually. Observe the GB/T constraint in `CLAUDE.md`.
- `/technologie/solaire-et-stockage/` — the competitive wedge: charging designed for an unreliable grid. Pricing is `PENDING_DATA`.

Commit: `feat(securite): safety cluster` · `feat(technologie): hardware catalogue and solar`

---

## LOT 6 — Residential

- `/particuliers/` hub.
- `/particuliers/avant-achat/` — pre-purchase readiness. **Do not build the compatibility checker** (GB/T constraint).
- `/particuliers/tarifs-installation/` — publish the 7 kW band with the inclusion and exclusion lists. 11 kW and 22 kW are `PENDING_DATA`.
- `/particuliers/recharge-domicile/`, `/guide-puissance/`.

Commit: `feat(particuliers): residential hub, pre-purchase, pricing`

---

## LOT 7 — Forms and tools

Four segmented forms per `form_definition`: résidentiel, entreprise, site partenaire, support. Plus the segment router — the homepage's central element, storing the selection and passing it as a hidden field into whichever form is reached.

**Publish no SLA figure in any confirmation message.**

Calculators — build the shared `lp-calculator` shell (inputs → visible assumptions → result → email capture → pre-filled T3 CTA):
- `/outils/calculateur-revenus-site/`
- `/outils/calculateur-tco-flotte/`
- `/outils/verificateur-domicile/`

**Tariffs are user-editable inputs, not hardcoded constants.** Default each to a sourced, dated public figure with a `claim` entry classed `donnee_externe`. This is deliberate: it is more honest than a supplier-supplied number, and it means the calculators ship without waiting on client data.

Commit: `feat(forms): four segmented forms and segment router` · `feat(outils): calculators with editable assumptions`

---

## LOT 8 — Sweep and verify

1. Playwright screenshots at 390 / 768 / 1440 for every page built, into `docs/screenshots/`.
2. Assert zero `href="#"` remain.
3. Assert no unapproved `claim` renders.
4. Assert the strings `IEC 61851`, `Pionnier`, `Premier réseau`, `Garantie complète`, `MRS`, `Corley` appear nowhere in built output.
5. Assert no response-time figure is published.
6. Colour audit: only the tokens in `CLAUDE.md` appear, plus non-brand status colours.
7. Confirm the Cloudflare Pages build succeeded — failures are silent.
8. Finalise `docs/PENDING.md` and `docs/DECISIONS.md`.

Commit: `chore: verification sweep and build report`

---

## Final report

Write `docs/RUN-REPORT.md`:
- Lots completed, skipped, and why
- Every `PENDING_DATA` slot, grouped by what the client must supply
- Every judgement call made, with reasoning
- Anything discovered that contradicts this brief
- What you would do next

Push the branch. Do not open a PR. Do not merge.
