# 00 — DISCOVERY (Lot 0)

Ground-truth before-state, captured before any edit.
Branch `build/phase-0-1`, cut from `main` at `e66b3a8`.
Date: 2026-09-08.

**Read this alongside `docs/DECISIONS.md`.** Nothing in this file has been fixed yet; it is the record of what was found.

---

## 0. Pre-flight anomaly (resolved before discovery)

The working tree arrived with **all 26 tracked files deleted** (unstaged deletions) and one stray artefact,
`src/services/recharge-domicile/index.njk copy`. `HEAD` was intact.

Diagnosis: a file-manager copy/move gone wrong, not an intentional wipe. Confirmed with the user.
Action: `git checkout -- .` restored all 26 files byte-identical to `e66b3a8`; the stray copy was deleted.
No content was lost. Discovery below runs against the restored tree.

---

## 1. Repo layout

| Fact | Value |
|---|---|
| Generator | Eleventy **3.1.2** (`@11ty/eleventy` ^3.1.2, sole dependency) |
| Input / output | `src` → `_site` |
| Includes / data dirs | `src/_includes` / `src/_data` |
| Template engine | Nunjucks (`njk`, `md`, `html`; html + md both routed through njk) |
| Build command | `npm run build` → `npx @11ty/eleventy` |
| Build status at discovery | **Clean.** 11 pages written, 5 files copied, 0.08 s |
| `node_modules` | Absent on arrival; installed during Lot 0 |
| Layouts | **One** — `src/_includes/base.njk` (290 lines). Every page uses it. No partials, no macros, no layout chaining |
| Collections | **None.** No `addCollection`, no tag-driven collections, no `_data` directory JS |
| Pagination | None |
| i18n | **None.** `<html lang="fr">` hardcoded in `base.njk`; no `/en/` routes, no `hreflang`, no locale data |

### `.eleventy.js` (complete surface)
- One filter: `date` — ignores its input and returns the current year when passed `"Y"`. Used once, for the footer copyright.
- Passthrough: `src/css`, `src/js`, `src/images`, `src/admin`, `src/favicon.ico` (**the favicon does not exist** — silent no-op).
- Watch targets: `src/css/`, `src/js/`.
- No shortcodes, no transforms, no eleventy-img, no plugins.

### Pages (11 routes, all `index.njk`)
```
/                              src/index.njk                              143 lines
/a-propos/                     src/a-propos/index.njk                      97
/comment-ca-marche/            src/comment-ca-marche/index.njk            117
/contact/                      src/contact/index.njk                      141
/faq/                          src/faq/index.njk                           56
/reserver/                     src/reserver/index.njk                     184
/securite/                     src/securite/index.njk                     105
/services/recharge-domicile/   src/services/recharge-domicile/index.njk   342
/services/bornes-publiques/    src/services/bornes-publiques/index.njk    286
/services/entreprises/         src/services/entreprises/index.njk         319
/admin/                        src/admin/index.html                        12
```

### Data cascade — `src/_data/`
Six flat JSON files, global scope, no computed data, no directory data files, no front-matter data inheritance:

| File | Shape | Contents |
|---|---|---|
| `site.json` | object | site-wide config incl. `formEndpoint`, phone, whatsapp, cloudinary base, analytics ids |
| `services.json` | array (3) | recharge-domicile, bornes-publiques, entreprises |
| `faq.json` | array (sections → items) | 90 lines |
| `process.json` | array (4) | the four-step process |
| `values.json` | array (6) | "pourquoi ORION" cards |
| `trust.json` | array (5) | trust-bar labels |

**Consequence for later lots:** there is no content model to extend — the collections in Lot 1 are greenfield.
Every claim currently lives either in one of these six JSON files or hardcoded in a template. Both paths must be swept.

---

## 2. Form endpoint — `YOUR_GOOGLE_APPS_SCRIPT_URL_HERE`

**Verdict: inherited from `_data`, single source. Lot 2a is a one-line data fix, not a structural one.**

| File | Line | Role |
|---|---|---|
| `src/_data/site.json` | 11 | `"formEndpoint": "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE"` — **the single source of truth** |
| `src/_includes/base.njk` | 8 | `<meta name="form-endpoint" content="{{ site.formEndpoint }}">` — injected once into every page |
| `src/js/main.js` | 170 | reads `meta[name="form-endpoint"]` |
| `src/js/main.js` | 172 | guards on the literal placeholder string |
| `src/admin/config.yml` | 27 | exposes the field to the CMS |

No page sets it in front matter. No duplication. Good.

### But the submit path is broken in two ways

`src/js/main.js` lines 166–196:

1. **`mode: 'no-cors'`** — the response is opaque. `result.ok` is unreadable *by construction*.
   The code never parses the body at all; it `await fetch(...)` and immediately calls `showFormSuccess()`.
2. **Success is unconditional.** The only path to the error branch is a network-layer throw.
   An Apps Script that returns `{ok:false, error:"..."}` with HTTP 200 — which is the documented behaviour
   in `CLAUDE.md` — renders "Demande envoyée !" to the user. **Silent data loss.**

Additionally, when the endpoint is still the placeholder (i.e. today, in production) the handler
**fakes a success message and discards the submission entirely** (lines 172–175). Every form on the live
site is currently a no-op that tells the user their request was sent.

→ Logged as defect **D-01**. Fixed in Lot 2a.

---

## 3. Dead CTAs — `href="#"`

**21 occurrences across 6 files.** Every one carries a `data-form-type` attribute, so each is a modal
trigger whose href was never given a no-JS destination.

| File | Line | Link text | `data-form-type` |
|---|---|---|---|
| `src/index.njk` | 26 | *(icon + label, hero secondary)* | rappel |
| `src/index.njk` | 140 | Demander un rappel | rappel |
| `src/securite/index.njk` | 102 | Demander un rappel | rappel |
| `src/faq/index.njk` | 53 | Demander un rappel | rappel |
| `src/comment-ca-marche/index.njk` | 114 | Demander un rappel | rappel |
| `src/services/recharge-domicile/index.njk` | 24 | *(hero ghost)* | rappel |
| `src/services/recharge-domicile/index.njk` | 165 | Demander un devis | devis |
| `src/services/recharge-domicile/index.njk` | 188 | Demander un devis | devis |
| `src/services/recharge-domicile/index.njk` | 210 | Demander un devis | devis |
| `src/services/recharge-domicile/index.njk` | 334 | *(footer ghost)* | rappel |
| `src/services/bornes-publiques/index.njk` | 20 | *(hero primary)* | contact |
| `src/services/bornes-publiques/index.njk` | 240 | *(partner block)* | **partenaire** |
| `src/services/bornes-publiques/index.njk` | 274 | *(closing primary)* | contact |
| `src/services/bornes-publiques/index.njk` | 278 | *(closing ghost)* | rappel |
| `src/services/entreprises/index.njk` | 20 | *(hero primary)* | devis |
| `src/services/entreprises/index.njk` | 24 | *(hero ghost)* | rappel |
| `src/services/entreprises/index.njk` | 146 | Demander un devis | devis |
| `src/services/entreprises/index.njk` | 167 | Demander un devis | devis |
| `src/services/entreprises/index.njk` | 187 | Demander un devis | devis |
| `src/services/entreprises/index.njk` | 307 | *(closing primary)* | devis |
| `src/services/entreprises/index.njk` | 311 | *(closing ghost)* | rappel |

**Duplicated per page — not inherited.** Per the brief's decision rule this is fixed per page and logged
as a duplication defect (**D-02**). Four distinct `data-form-type` values are already in use
(`rappel`, `devis`, `contact`, `partenaire`), which maps cleanly onto the Lot 7 segmented forms.

Note `bornes-publiques:240` — `data-form-type="partenaire"` is the existing, unwired entry point to what
Lot 3 builds as `/site-partenaire/`. That is the correct destination for it.

---

## 4. Claim strings

### 4a. `Pionnier` — 4 occurrences
| File | Line | Text |
|---|---|---|
| `src/index.njk` | 17 | Pionnier de la recharge électrique au Cameroun |
| `src/a-propos/index.njk` | 12 | Pionnier de l'infrastructure de recharge pour véhicules électriques au Cameroun. |
| `src/services/recharge-domicile/index.njk` | 299 | `<h3>Pionnier au Cameroun</h3>` |
| `src/services/entreprises/index.njk` | 276 | `<h3>Pionnier au Cameroun</h3>` |

The brief supplies a replacement for the `index.njk:17` form only. The other three are variants the brief
did not predict — logged, and covered by the same client instruction.

### 4b. `Premier réseau` — 2 occurrences
| File | Line | Text |
|---|---|---|
| `src/services/recharge-domicile/index.njk` | 300 | Premier réseau dédié de recharge pour véhicules électriques au Cameroun. L'expérience qui fait la différence. |
| `src/services/entreprises/index.njk` | 277 | *(identical string)* |

### 4c. `-40%` — 1 occurrence
| File | Line | Text |
|---|---|---|
| `src/services/entreprises/index.njk` | 58 | `<span class="lp-stat-number">-40%</span>` |

Two other `40%` matches are CSS gradient stops (`style.css:223`, `style.css:604`) — **not claims**, leave alone.
The stat sits in a `lp-stat` grid; deleting the figure leaves an orphan cell that must be restructured, not blanked.

### 4d. `Garantie complète` — 2 occurrences
| File | Line |
|---|---|
| `src/comment-ca-marche/index.njk` | 96 | `<li><strong>Garantie complète</strong> — équipements et main-d'œuvre couverts</li>` |
| `src/_data/values.json` | 23 | `"title": "Garantie complète"` (+ its unbounded `description` on line 24) |

### 4e. `Ingénieurs certifiés` — 3 occurrences, plus 17 further `certifi*` claims
Direct string:
| File | Line |
|---|---|
| `src/_data/trust.json` | 2 | `{ "label": "Ingénieurs certifiés", "icon": "award" }` |
| `src/reserver/index.njk` | 170 | trust badge |
| `src/services/recharge-domicile/index.njk` | 285 | `<h3>Ingénieurs certifiés</h3>` (+ body line 286: "formés et certifiés… Pas de sous-traitance") |

**The brief under-counts this one.** `grep certifi` returns **20 hits across 11 files**. The certification
claim is diffused through the whole site as an unfalsifiable adjective — "expertise certifiée",
"techniciens certifiés", "ingénieurs certifiés", "professionnels certifiés", "connecteurs certifiés",
"ingénieur certifié", "Êtes-vous agréés et certifiés ?" (FAQ, answered "Oui"). Full list:

```
src/index.njk:104                              La confiance d'une expertise certifiée
src/securite/index.njk:4                       (meta description) …techniciens certifiés
src/securite/index.njk:30                      …connecteurs certifiés
src/securite/index.njk:58                      …par des professionnels certifiés
src/securite/index.njk:78                      Diplômés et certifiés en génie électrique
src/securite/index.njk:99                      …par un ingénieur certifié
src/comment-ca-marche/index.njk:85             certificat d'installation
src/_data/faq.json:7                           …professionnels certifiés
src/_data/faq.json:73-74                       Êtes-vous agréés et certifiés ? → "Oui…"
src/_data/trust.json:2                         Ingénieurs certifiés
src/reserver/index.njk:170                     Ingénieurs certifiés
src/_data/values.json:3-4                      Expertise certifiée / formés et certifiés
src/_data/process.json:17                      techniciens certifiés
src/services/recharge-domicile/index.njk:285-286  Ingénieurs certifiés
src/securite/index.njk:83                      Un certificat d'installation vous est remis
```

`securite/index.njk:4` is a **meta description** — exactly the "anywhere Lot 0 did not predict" case the
brief anticipates. Logged.

### 4f. `IEC 61851` — 6 occurrences, plus `IEC 62196` and `NF C 15-100`
| File | Line | Context |
|---|---|---|
| `src/securite/index.njk` | 25 | `<h3>Norme IEC 61851</h3>` — an entire card |
| `src/securite/index.njk` | 29 | `<h3>Norme IEC 62196</h3>` — a second card, **same class of unbacked claim, not in the brief's list** |
| `src/securite/index.njk` | 79 | "Formés spécifiquement… (norme IEC 61851)" |
| `src/_data/faq.json` | 7 | inside an FAQ answer |
| `src/_data/values.json` | 9 | "conformes aux normes IEC 61851 et aux codes de sécurité électrique locaux" |
| `src/services/recharge-domicile/index.njk` | 32 | hero badge "Normes IEC 61851" |
| `src/services/recharge-domicile/index.njk` | 279 | "conformes aux normes IEC 61851 **et NF C 15-100**" |
| `src/_data/trust.json` | 3 | `{ "label": "Normes IEC" }` |
| `src/a-propos/index.njk` | 71 | "formés aux normes internationales IEC" |

**Two strings beyond the brief:** `IEC 62196` (a whole card in `/securite/`) and `NF C 15-100`
(the French domestic wiring standard). Neither is among CE/RoHS. Both are the same defect class and are
removed with the rest. Removing the two `/securite/` cards guts that page's "Normes" section — it needs
rebuilding around what is actually true, which is Lot 5 work.

### 4g. Response-time figures — 12 occurrences
Every one must lose its number with no substitute.

| File | Line | Text |
|---|---|---|
| `src/_data/trust.json` | 6 | `{ "label": "Réponse sous 24h", "icon": "clock" }` |
| `src/_data/values.json` | 19 | "Nous garantissons une réponse sous 24 heures…" |
| `src/_data/process.json` | 5 | "Notre équipe vous répond sous 24 heures." |
| `src/reserver/index.njk` | 11 | "Notre équipe vous contacte sous 24 heures." |
| `src/reserver/index.njk` | 167 | "Pas d'engagement. Évaluation gratuite. **Réponse sous 24h.**" |
| `src/contact/index.njk` | 96 | "Nous vous répondons sous 24 heures." |
| `src/comment-ca-marche/index.njk` | 24 | "…vous répond sous 24 heures pour confirmer le rendez-vous." |
| `src/js/main.js` | 207 | **form success message** — "Notre équipe vous contactera sous 24 heures." |
| `src/services/recharge-domicile/index.njk` | 36 | hero badge "**Installation en 24h**" |
| `src/services/recharge-domicile/index.njk` | 106 | process tag "**En 24 heures**" |

`main.js:207` is the confirmation message the brief separately forbids in Lot 7 — it is already in violation today.

`recharge-domicile:36` and `:106` are a *different* claim — a 24-hour **installation** lead time, not a
response time. Unbacked and contradicted by the confirmed 4-week hardware lead time. Removed too.

**Not claims — leave alone:** `bornes-publiques:40` ("Stations sécurisées 24h/24") and `:99`
("bien éclairées 24h/24") describe continuous availability, not a commitment window.

### 4h. `application` (session tracking) — 5 occurrences
The mobile app does not exist. Every reference to it is a promise of a product.

| File | Line | Text |
|---|---|---|
| `src/_data/values.json` | 29 | "Suivez vos sessions de recharge… en temps réel via l'application." (card "Technologie connectée") |
| `src/comment-ca-marche/index.njk` | 83 | "Configuration de l'application de suivi sur votre téléphone" |
| `src/services/recharge-domicile/index.njk` | 117 | "…configurons l'application de suivi…" |
| `src/services/bornes-publiques/index.njk` | 106 | "Payez via **l'application mobile**, par carte ou par mobile money." |
| `src/services/bornes-publiques/index.njk` | 160 | "Lancez la session via l'application ou sur l'écran de la borne." |

`main.js:186` (`'Content-Type': 'application/json'`) is a false positive.

`bornes-publiques:106` also mis-states payment: confirmed rails are Mobile Money first (Orange Money,
MTN MoMo), then VISA/MasterCard. It needs rewriting, not just app-removal.

---

## 5. WhatsApp — `wa.me`

**Verdict: number is inherited from `_data`; message text is hardcoded, in two places, and is not page-aware.**

| File | Line | Message text |
|---|---|---|
| `src/_includes/base.njk` | 124 | floating button — "Bonjour ORION Energy, je souhaite des informations sur vos services." |
| `src/_includes/base.njk` | 105 | footer link — **no `?text=` at all** |
| `src/contact/index.njk` | 34 | "Bonjour ORION Energy, je souhaite des informations." |

Three links, two message variants, one of them empty. None carries page context. All read the number from
`site.whatsapp`.

**The number is a placeholder: `"+2376XXXXXXXX"`.** So is `phone` (`"+237 6XX XXX XXX"`) and
`phoneClean` (`"+2376XXXXXXXX"`). Every `wa.me/` and `tel:` link on the live site is broken today.
`CLAUDE.md` supplies the real WhatsApp number (`237692439292`); it supplies **no voice number**, so
`phone`/`phoneClean` become `PENDING_DATA` (**P-01**). Logged as defect **D-03**.

---

## 6. Playwright

Not present at discovery (`node_modules` absent entirely). Installed during Lot 0 as a devDependency
(`playwright@1.63.0`) with the Chromium browser binary, for the 390 / 768 / 1440 screenshot runs.

---

## 7. Sveltia CMS

**Location:** `src/admin/config.yml` (112 lines), with `src/admin/index.html` (12 lines) as the mount point.
Both are passthrough-copied to `/admin/`.

**Backend:**
```yaml
backend:
  name: github
  repo: Wouree/orion-energy
  branch: main
  base_url: https://auth.orionenergycmr.com
```

Two problems:
1. `base_url` points at **`auth.orionenergycmr.com`**, a per-client auth host.
   `CLAUDE.md` states the standing shared OAuth worker for all Digitaall client sites is **`auth.wouree.com`**,
   and that a per-client Worker must never be deployed. Logged as defect **D-04**.
2. `branch: main` — the CMS writes straight to the production branch. Correct for the live site, and
   out of scope to change here, but noted: CMS edits made during this run would land on `main`, which
   this branch is forbidden to touch.

**Current collections (6)** — all file-based, none folder-based, no `claim`, no `product`, no `station`:

| `name` | `label` | Target file | Valid? |
|---|---|---|---|
| `site_settings` | Paramètres du site | `src/_data/site.json` | ✅ correct `files:` array |
| `faq` | FAQ | `src/_data/faq.json` | ❌ **`file:` at collection level** |
| `services` | Services | `src/_data/services.json` | ❌ **`file:` at collection level** |
| `trust` | Barre de confiance | `src/_data/trust.json` | ❌ **`file:` at collection level** |
| `process` | Étapes du processus | `src/_data/process.json` | ❌ **`file:` at collection level** |
| `values` | Valeurs / Pourquoi ORION | `src/_data/values.json` | ❌ **`file:` at collection level** |

Five of six collections use exactly the invalid pattern `CLAUDE.md` warns about — a `file:` key directly
on the collection instead of a `files:` array. Only `site_settings` is well-formed. Logged as **D-05**.

There is a second, subtler bug in the same five: each declares a wrapper field
(`name: "sections"`, `"services"`, `"steps"`, `"items"`, `"values"`) around a `list` widget, but the
underlying JSON files are **bare top-level arrays**, not objects with that key. The CMS would write
`{"values": [...]}` where Eleventy expects `[...]`, breaking every template that iterates them.
Logged as **D-06**.

---

## 8. Additional findings (not requested, materially relevant)

### D-07 — Stale pre-rebrand palette still shipping
`src/css/style.css` lines 3–4 carry a header comment declaring a **completely different brand**:
```
Brand: Deep Blue #275A7D | Green #598435
Forest #487357 | Sage #B6BF93 | Off-White #F2F2F2
```
None of those five values is an ORION token. The comment is stale, but two live assets still use the old palette:
- `src/images/logo.svg` — renders "ORION" in `#275A7D` and "energy" in `#598435`
- `src/js/main.js:207` — the form-success tick is stroked `#598435`

The nav does not use `logo.svg` (it loads the correct logotype from Cloudinary), so the SVG is a fallback
asset that would render off-brand if ever used. The success tick renders off-brand **today**.

### `:root` tokens vs. `CLAUDE.md`
All eleven `CLAUDE.md` tokens are present and **exact**. No approximations. Naming differs
(`--blue-institutional` vs `--inst`, `--off-white` vs `--wash`, `--dark` vs `--ink`, etc.).

Five extensions exist beyond the eleven: `--blue-dark: #0E2A6E`, `--blue-light: #4BA0F5`,
`--green-dark: #3AB843`, `--green-light: #8DE06A`, `--lime-foundation: #CAC343`. The first two match the
`--deep-blue` / `--light-blue` declared in the client questionnaire (`docs/reference/index.html`) and are
legitimate. The other three are undeclared derivations — flagged for the Lot 8 colour audit, not a defect.

`#25D366` (`style.css:545`) is WhatsApp's own brand green on the float button — correctly outside the
palette, exactly as `CLAUDE.md` requires of non-brand status colours.

### D-08 — `alert()` in the date validator
`src/js/main.js:161` calls `alert()` when a user picks a Sunday or Monday. Blocking modal, poor UX,
and it will freeze any browser-automation verification run. Replace with inline validation.

### D-09 — Declared favicon does not exist
`.eleventy.js` passes through `src/favicon.ico`; the file is absent. Silent no-op — Eleventy does not warn.

### D-10 — No structured data anywhere
No JSON-LD, no `Organization`, no `LocalBusiness`. OG tags exist but are thin (`og:title`,
`og:description`, `og:type`, `og:url` — no `og:image`, no `og:locale`, and `og:url` is the site root on
every page rather than the canonical page URL). No `<link rel="canonical">` at all. Lot 2e work.

### D-11 — Unpinned third-party script
`base.njk:22` loads `https://unpkg.com/lucide@latest/dist/umd/lucide.min.js`. `@latest` is unpinned —
a supplier-side release can break the icon layer of every page with no commit on this repo.

### Coverage mismatch
`site.json:22` declares `"cities": ["Douala", "Yaoundé"]`. `CLAUDE.md` confirms six:
Douala, Yaoundé, Bafoussam, Bertoua, Edéa, Garoua. The data is not wrong, it is incomplete —
expanded in Lot 1 via the `city` collection.

---

## 9. Defect register (carried into `docs/DECISIONS.md`)

| # | Defect | Severity | Lot |
|---|---|---|---|
| D-01 | Form submit uses `no-cors`, never reads `result.ok`, fakes success, discards data when endpoint is a placeholder | **Critical** — silent data loss | 2a |
| D-02 | 21 × `href="#"`, duplicated per page | High | 2b |
| D-03 | Phone / WhatsApp numbers are `XXXX` placeholders — every `tel:` and `wa.me` link is broken | **Critical** | 2d |
| D-04 | Sveltia `base_url` points at a per-client auth host, not `auth.wouree.com` | High | 1 |
| D-05 | 5 of 6 CMS collections use invalid collection-level `file:` | High | 1 |
| D-06 | Those 5 collections declare a wrapper key over bare top-level JSON arrays | High | 1 |
| D-07 | Pre-rebrand palette in `logo.svg` and the form-success tick | Medium | 2c |
| D-08 | `alert()` in the date validator | Medium | 2a |
| D-09 | Passthrough for a non-existent `favicon.ico` | Low | 2e |
| D-10 | No JSON-LD, no canonical, thin/incorrect OG | Medium | 2e |
| D-11 | `lucide@latest` unpinned | Medium | 2e |

## 10. Claim-removal scoreboard

| Target | Brief predicted | Actually found |
|---|---|---|
| `Pionnier` | 1 | **4** |
| `Premier réseau` | 1 | 2 |
| `-40%` | 1 | 1 (+2 CSS false positives) |
| `Garantie complète` | 1 | 2 |
| `Ingénieurs certifiés` | 1 | 3 (+17 further `certifi*` claims) |
| `IEC 61851` | 1 | 6 (+ `IEC 62196`, + `NF C 15-100`) |
| response-time figure | 1 | **12** |
| `application` (session tracking) | 1 | 5 |
| **Total** | ~8 | **~53** |

The remediation surface is roughly six times what the brief scoped. Nothing here contradicts the brief —
it is the same defect classes, at greater density, spread across `_data` JSON as well as templates.

---

## 11. Decision rule applied

Per the brief: *"if a value is inherited from `_data` or a layout, fix it there once; if duplicated per
page, fix per page and log the duplication as a defect."*

| Item | Location | Fix strategy |
|---|---|---|
| form endpoint | `_data/site.json` → `base.njk` | **once, in `_data`** |
| WhatsApp number | `_data/site.json` | **once, in `_data`**; message text becomes page-aware in `base.njk` |
| response-time figures | 6 × `_data`, 6 × templates | `_data` once each; templates per page (D-02 class) |
| `certifi*` claims | 6 × `_data`, 14 × templates | same split |
| `IEC` claims | 3 × `_data`, 6 × templates | same split |
| `href="#"` | 21 × templates only | **per page**, logged as D-02 |
| `Pionnier` / `Premier réseau` | templates only | **per page** |
