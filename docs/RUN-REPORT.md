# RUN-REPORT.md — ORION Energy, Phases 0 and 1

Branch `build/phase-0-1`, cut from `main` @ `e66b3a8`. Pushed. **Not merged. No PR opened.**
Run date: 2026-09-08.

---

## Summary

All nine lots completed. The brief's target was Lots 0–4, with 5–8 if time allowed.

The site went from **11 pages to 40**, and from a content model of six flat JSON files to fourteen governed
collections in which an unapproved claim **cannot** render — enforced by the build, not by editorial care.

The headline number: the brief scoped roughly eight false or unevidenced claims for removal.
**We found and removed about fifty-three**, plus three defect classes the discovery greps had no pattern
for, and one statement on the live site that was the exact opposite of the truth.

| Lot | Title | Status | Commit |
|---|---|---|---|
| 0 | Discovery | **DONE** | `f43c1e3` |
| 1 | Content model and foundations | **DONE** | `3a34dd9` |
| 2 | Phase 0 remediation | **DONE** | `103c6b6` `3834db5` `cd3c4c1` `3f2cda6` `aa70d4a` |
| 3 | Site partner funnel | **DONE** | `d58aa90` |
| 4 | Business hub and fiscal argument | **DONE** | `5b60f50` |
| 5 | Safety cluster and hardware catalogue | **DONE** | `a088722` |
| 6 | Residential | **DONE** | `ff2c4ef` |
| 7 | Forms and calculators | **DONE** | `2861def` |
| 8 | Sweep and verification | **DONE** | this commit |

Nothing was skipped.

---

## 1. What was found before anything was changed

`docs/00-DISCOVERY.md` is the before-state, captured verbatim. Eleven defects, `D-01` … `D-11`.

**The working tree arrived with all 26 tracked files deleted** (unstaged) while `HEAD` was intact, plus a
stray `index.njk copy` — a file-manager mishap, not an intentional wipe. Restored from `e66b3a8`; nothing
lost. Confirmed with the user before acting.

Three findings mattered more than the rest.

**Every form on the live site is a silent no-op.** `main.js` posted with `mode: 'no-cors'`, which makes the
response opaque and `result.ok` unreadable *by construction*, then called the success handler
unconditionally. And when the endpoint was still the placeholder — which it is — it showed
"Demande envoyée !" and **discarded the submission entirely**. Every visitor who has ever filled in a form
on this site was thanked for a request nobody received.

**Every phone and WhatsApp link is dead.** `site.json` carried `+237 6XX XXX XXX` and `+2376XXXXXXXX`.

**The claim surface was ~6× the brief's estimate.** Same defect classes, far greater density, and spread
through `_data` JSON as well as templates — including one in a meta description.

---

## 2. What was built

**Content model** — 14 collections in `content/`, outside Eleventy's input directory. `src/_data/orion.js`
loads, validates, gates and cross-references them.

Governance is enforced **in the loader**, one level below where the brief asked for it. `CLAUDE.md` says
enforce in the template rather than by editorial discipline; dropping gated items before they become data
is stronger, because a template cannot render what it was never handed. A typo cannot leak an unapproved
claim. Every drop is counted and printed at build time.

**Validation fails the build, it does not warn.** A missing required field, a bad enum, an `IEC` string in a
product's certifications, a response-time figure in a form's confirmation message, or a
universal-compatibility phrase on a GB/T product all abort with the file and the reason.

**Phase 0 remediation** — endpoint moved to one site-wide field and left empty; submit path rewritten to
read `result.ok` and fail loudly; 21 dead CTAs resolved through the `cta` collection; ~53 claim strings
removed or replaced; WhatsApp deep links composed from page context; attribution, event layer and JSON-LD
added where there was none.

**Four funnels** — site partner (5 pages), business (8 pages including the fiscal argument), safety and
technology (6 pages), residential (4 pages plus a redirect) — then four segmented forms, a homepage
segment router, and three calculators.

---

## 3. Judgement calls

`docs/DECISIONS.md` has all of them, roughly fifty, with reasoning. The ones that changed the shape of the
work:

**Named the content loader `orion.js`, not `content.js`.** `content` is a reserved Eleventy data property;
a global data file of that name aborts the build. Found by hitting it.

**Verified the fiscal figures rather than relying on the brief.** The brief states them as given, but a
`donnee_externe` claim requires a public source and a date, and a tax figure a business will act on is the
last place to relay an unchecked number. Both measures confirmed against two independent sources each.

**Did not publish the pre-2025 excise rate.** Two credible sources give it as 12.5 % and as 30 %. A figure
two sources disagree about is not a fact yet. The page says so. The exemption itself is not in dispute and
is published.

**Published the abatement's 24-month duration but no expiry date,** because no source gives one — and said
so, with advice to confirm before committing spend. The site is being read in September 2026 and the
window may be closing.

**Left the charging-tariff field on the revenue calculator deliberately empty,** and the calculator stops at
the margin *before* sharing. The tariff is set site by site and unpublished; a default would become a
promise. With no value the tool renders "—" rather than a figure — the `PENDING_DATA` rule applied to a form
input.

**Wired the i18n architecture but emit no `hreflang`.** The brief asks for `/en/` twins with correct
`hreflang` and separately forbids English copy. A `hreflang` pointing at a 404 is a claim the site cannot
honour — the exact failure this project exists to correct. The machinery is complete and `en.built` is
`false`; enabling English is one line plus the pages.

**Served `/particuliers/recharge-domicile/` with a 301** rather than duplicating the live, indexed
`/services/recharge-domicile/`.

**Did not set `publish_mode: editorial_workflow`.** It would be a real safety gain, but it changes how the
client edits their own site today and nobody asked. Recommended below instead.

**Kept `24h/24` on the public-stations page.** "Stations sécurisées 24h/24" is continuous availability, not
a response commitment. Deleting it would remove a true statement to satisfy a string match.

---

## 4. Where the GB/T constraint forced a rewrite

`CLAUDE.md` requires this to be logged. Five pages:

| Page | What it said | What it says now |
|---|---|---|
| `/services/bornes-publiques/` | *"Compatibilité universelle — connecteurs Type 2 et CCS, compatibles avec la majorité des véhicules électriques du marché"* | Connectors are GB/T; check your vehicle's inlet. **The original was the exact opposite of the truth.** |
| FAQ *Quels véhicules sont compatibles* | *"compatibles avec tous les véhicules électriques et hybrides rechargeables disponibles sur le marché, incluant les connecteurs Type 2 et Type 1"* | Retitled *Quel connecteur équipe vos bornes ?*; states GB/T as fact. |
| `/technologie/materiel/` | *(new)* | GB/T named as the first thing to check, before power or price. |
| `/particuliers/avant-achat/` | *(new)* | Connector is step 1 of 5, ahead of power and price. |
| `/outils/verificateur-domicile/` | *(new)* | States it does **not** check vehicle compatibility, and why. |

**No compatibility checker was built** — and `/particuliers/avant-achat/` says so in the open: such a tool
has to be exact, we have not verified connector data vehicle by vehicle for this market, and a wrong answer
would cost someone a multi-million-franc purchase. The alternative offered is a photo and a human reply.

---

## 5. What the client must supply

`docs/PENDING.md` is the deliverable, grouped by who unblocks it. 20 items, 26 markers, 22 files.

**Two block basic function and should be fixed first:**

1. **P-02 — the form endpoint.** Nothing on this site can capture a lead until a dedicated Apps Script
   deployment and sheet exist, separate from the questionnaire backend. Digitaall to supply.
2. **P-01 — a public voice number.** Every `tel:` link is currently absent because we removed the
   placeholder. One line in the CMS.

**The widest blast radius is P-13, the connector decision** — five pages currently state GB/T as fact and
announce no workaround, because none is confirmed.

---

## 6. Verification

`scripts/verify.js` runs the Lot 8 assertion suite and is safe to run after any change. It was written in
Lot 3 rather than Lot 8, and immediately caught a broken link Lot 2c had already shipped — which argues for
having written it earlier still.

```
10 checks over 41 built pages — all passing

  no href="#" survives                      no PENDING_DATA marker leaks into output
  no banned claim string in page text       no placeholder contact details
  no unapproved claim renders               every page has a canonical URL and a lang
  no response-time figure published         JSON-LD parses on every page
  only known colours appear in CSS          every internal link resolves
```

Banned strings asserted absent from built output: `IEC 61851`, `IEC 62196`, `IEC` (any), `NF C 15-100`,
`Pionnier`, `Premier réseau`, `Garantie complète`, `Ingénieurs certifiés`, `MRS`, `Corley`.

**Colour audit:** only the eleven `CLAUDE.md` tokens, five documented extensions (two of them declared in
the client questionnaire), six status colours deliberately outside the brand palette, and WhatsApp's own
`#25D366` on the WhatsApp button. The pre-rebrand palette that was still shipping in `logo.svg` and the
form-success tick is gone.

**Screenshots:** `scripts/screenshots.js` — 120 full-page captures, 40 pages × 390 / 768 / 1440, in
`docs/screenshots/`. It also asserts no horizontal overflow and no console errors. It found two mobile
overflows caused by an inline `grid-template-columns` that beat the responsive CSS; fixed with a modifier
class, then re-run clean.

**Browser tests:** `scripts/smoke.js` (forms and attribution) and `scripts/smoke-tools.js` (router and
calculators) drive real Chromium. Both caught bugs that reading could not:

- Hidden modal fields carried `required`. A hidden required field is invalid and not focusable, so the
  browser refused to submit and could not say why — **the form did nothing when clicked.**
- The calculator result panel is a sibling column, so `form.parentElement` never found it and **every
  calculator threw on submit.**

### The one thing not verified

**Item 7 of Lot 8 — "confirm the Cloudflare Pages build succeeded" — could not be done from here.**
`CLAUDE.md` forbids touching Cloudflare settings and forbids deploys, and no dashboard credential was
available. Agreed with the user at the start of the run.

What *was* verified: `npx @11ty/eleventy` builds clean — 41 files, no warnings — and all assertions run
against the real `_site/` output.

**What you should check after pushing:** the Pages build for `build/phase-0-1`. Cloudflare build failures
are silent, and this run changed `.eleventy.js`, added a dependency (`gray-matter`), moved content outside
`src/`, and added `_redirects`. If the build fails, the two likeliest causes are the Node version used by
Pages (this ran on **v20.19.1**) and the `content/` directory not being present in the deploy context.

---

## 7. Things discovered that contradict or extend the brief

1. **The claim surface was ~6× larger than scoped** — ~53 strings against ~8. Same classes, greater density.
2. **Three defect classes the brief's greps did not cover:** `IEC 62196` (a whole card in `/securite/`),
   `NF C 15-100`, and an "Installation en 24h" badge contradicted by the confirmed 4-week lead time.
3. **Two "sous 48h" quote commitments** — the same class as `Réponse sous 24h`, at a different number, with
   no pattern in the brief.
4. **Five more invented figures in the FAQ**, found only by reading all 17 answers rather than trusting the
   greps: a 2–5 year warranty, an 11 kW model not in the catalogue, "80 % in 30–60 minutes", a "1/5 of a
   tank" cost ratio, and payment terms nobody agreed.
5. **The compatibility claims were not merely unevidenced, they were inverted.** The live site advertised
   Type 2 and CCS on hardware that carries GB/T.
6. **Five of six Sveltia collections were structurally invalid** — collection-level `file:` — and all five
   also wrapped a key the bare JSON arrays did not have. The CMS would have written a shape Eleventy
   cannot read.
7. **The CMS pointed at a per-client auth host**, `auth.orionenergycmr.com`, where `CLAUDE.md` mandates the
   shared `auth.wouree.com`.

---

## 8. What I would do next

**Immediately, before anything else ships:**

1. **Stand up the forms Apps Script and sheet (P-02).** Everything else on this site is a funnel into a
   form that currently cannot receive anything. Remember the frontend branches on `result.ok`, not
   `response.ok` — the backend must return `{ok: true}` explicitly.
2. **Supply the phone number (P-01).** One CMS field, and every footer regains a working `tel:` link.
3. **Confirm the Cloudflare build,** for the reasons in section 6.

**Then, in order of value:**

4. **Settle the connector position (P-13).** It is the largest open question and it shapes five pages.
   Whatever the answer, it is better than five pages that can only state a fact and stop.
5. **Get the warranty exclusions (P-08).** The one place where a customer is most likely to feel misled
   later is the one where we currently have to say "not settled".
6. **Get publication consent for the team (P-11).** The page exists and renders empty. Two signatures.
7. **Decide the host revenue share (P-10),** which would let the revenue calculator show a host's actual
   share rather than the pool.

**Recommended, not done:**

8. **Turn on `publish_mode: editorial_workflow` in Sveltia.** An approval step before anything reaches the
   live site is exactly this project's concern. Not done because it changes how the client edits their
   site today and was not asked for — their call.
9. **Run `scripts/verify.js` in CI.** It is the whole governance argument in ten assertions, and it is
   worth more failing a build than passing a review.
10. **Write the English mirror.** The architecture is complete; `en.built = false` in `src/_data/i18n.js`
    is the only switch, plus the pages themselves.
11. **Replace the Cloudinary URLs with `eleventy-img`.** Not needed yet, but `CLAUDE.md` documents two
    traps for when it is — the `path.isAbsolute()` issue with Sveltia's leading slash, and passing the `id`
    argument to `filenameFormat`.

---

## 9. Files to read, in order

| File | What it is |
|---|---|
| `docs/PENDING.md` | **The client-facing deliverable.** What must be supplied, grouped by who supplies it. |
| `docs/00-DISCOVERY.md` | The before-state, verbatim. The record of what was actually wrong. |
| `docs/DECISIONS.md` | Every judgement call, with reasoning. |
| `docs/CONTENT-MODEL.md` | The fourteen collections, their fields, and the governance gates. |
| `docs/PROGRESS.md` | Lot status. Read first after any context reset. |
| `scripts/verify.js` | The assertion suite. Run it after any change. |
