# CONTENT-MODEL.md

The fourteen collections behind the ORION Energy site, their fields, and the governance rules that
decide whether an item is allowed to render.

Authored in Lot 1. `docs/BUILD_BRIEF.md` names the collections; this file is the specification.

---

## Where content lives

```
content/<collection>/<slug>.md      ← one Markdown file per item, YAML front matter + optional body
src/_data/content.js                ← loader: parses, validates, gates, exposes as global data
src/admin/config.yml                ← Sveltia CMS surface over the same files
```

`content/` sits at the repository **root, outside `src/`**. Eleventy's input directory is `src`, so it never
treats these files as templates: no stray routes, no `permalink: false` boilerplate on every item, no
`eleventyConfig.ignores` needed. Templates reach the data as `orion.product`, `orion.claim`, and so on.

Body copy is Markdown. Any field that is prose-with-emphasis is the body; everything else is front matter.

---

## The governance gate

`CLAUDE.md`: *"Unapproved claims must not render. Enforce this in the template, not by editorial discipline."*

This model enforces it one level lower still — **in the loader**. A gated item is dropped before it becomes
data, so no template can render it even by mistake, and a typo in a template cannot leak one.

| Collection | Gate | Effect when the gate fails |
|---|---|---|
| `claim` | `approved: true` | dropped from `orion.claim`; the `{% claim %}` shortcode renders nothing |
| `testimonial` | `consent_on_file: true` | dropped |
| `partner` | `verified: true` | dropped |
| `person` | `draft` not `true` | dropped |
| `station` | `publish: true` **and** `owner_type != "private"` | dropped |
| `city` | `coverage_real: true` | dropped |
| *(all)* | `draft: true` | dropped |

Every gated item is still counted. `orion._gated` carries the tally, and the build prints it, so a
disappearing item is visible rather than silent.

---

## `claim` — the spine of the content model

Every published figure or superlative on the site must exist here. Templates never hardcode a number.

| Field | Type | Required | Notes |
|---|---|---|---|
| `slug` | string | ✅ | filename; the key used by `{% claim "slug" %}` |
| `text` | string | ✅ | the claim exactly as it renders |
| `class` | enum | ✅ | `fait_verifie` · `spec_fabricant` · `donnee_externe` · `estimation` · `ambition` |
| `evidence_url` | url | ✅ except `estimation`/`ambition` | where the fact is proven |
| `evidence_date` | date | ✅ except `estimation`/`ambition` | ISO `YYYY-MM-DD` |
| `owner` | string | ✅ | who stands behind it |
| `approved` | boolean | ✅ | **false or missing → never renders** |
| `value` | number | | machine-readable figure, for calculators |
| `unit` | string | | `FCFA`, `%`, `kW`, `mois` |
| `note` | text | | caveats, scope limits |

**Class semantics.** `fait_verifie` — verifiable about ORION itself. `spec_fabricant` — from the supplier's
datasheet; publishable as a manufacturer specification, never as an independent test result.
`donnee_externe` — third-party fact (a Finance Law, a tariff) requiring a source and a date.
`estimation` — a modelled figure; must render with its assumptions visible. `ambition` — a stated
intention, never a promise; must read in the future tense.

**The shortcode.** `{% claim "slug" %}` returns the claim's `text`, or **nothing at all** if the claim is
missing or unapproved, plus an HTML comment naming the slug so an omission is debuggable in view-source.
`{% claimValue "slug" %}` returns the raw number for calculators. There is no "render anyway" escape hatch.

---

## `station` — built now, disabled now

The brief is explicit that `status` and `owner_type` must exist from day one so peer-to-peer sharing later
becomes a feature flag rather than a data migration.

| Field | Type | Required | Notes |
|---|---|---|---|
| `slug`, `name` | string | ✅ | |
| `status` | enum | ✅ | `ouverte` · `installation` · `annoncee` · `etude` |
| `owner_type` | enum | ✅ | `orion` · `partner` · `private` |
| `publish` | boolean | ✅ | defaults **false** |
| `city` | ref → `city` | ✅ | |
| `address`, `lat`, `lng` | string / number | | withheld while sites are confidential |
| `connectors[]` | list | | `{ type, kw, count }` — `type` is stated factually, never marketed |
| `access_hours`, `payment_methods[]`, `photo` | | | |

**No station is published in this phase and no map is built** — `CLAUDE.md` states all sites are
confidential. `owner_type: private` is hard-disabled in the loader on top of the `publish` gate, so
peer-to-peer listings cannot appear even if someone flips `publish`.

**Status colours sit outside the brand palette.** An `ouverte` station must never render in Primary Green,
or an open station reads as a primary button.

---

## `product` — the four models

Seeded in Lot 1 from `CLAUDE.md`, ref `ORION-20260809-4M59`. Permission to publish all references is given.

| Field | Type | Notes |
|---|---|---|
| `slug`, `model`, `type` | string | `type`: `ac_wallbox` · `ac_pedestal` · `dc_rapide` |
| `power_kw` | number | |
| `connector` | string | **`GB/T` on all four.** Stated factually. See the connector rule below. |
| `ip_rating`, `ik_rating` | string | |
| `warranty_months` | number | |
| `availability` | enum | `en_stock` · `sur_commande` |
| `lead_time_weeks` | number | 4 |
| `certifications[]` | list | **`CE` and `RoHS` only.** `IEC 61851` must never appear. |
| `use_case` | string | omitted where unstated — `TA-AC-G22-ALD3` has no confirmed use case |
| `origin`, `supplier` | string | Chine / Eagle South Capital |

| Model | Type | kW | Connector | IP/IK | Warranty | Availability | Use |
|---|---|---|---|---|---|---|---|
| XD-AC-G07-P | AC wallbox | 7 | GB/T | IP54/IK08 | 12 mo | en stock | Résidentiel |
| TA-AC-G22-ALD3 | AC pedestal | 44 | GB/T | IP54/IK10 | 12 mo | sur commande | *(PENDING)* |
| TA-DC-WD20kW | DC rapide | 20 | GB/T | IP54/IK08 | 12 mo | sur commande | Flotte |
| TA-DC-DD60kW | DC rapide | 60 | GB/T | IP54/IK10 | 26 mo | sur commande | Station publique |

**The connector rule, enforced in the loader.** All four are GB/T, incompatible with the Type 2 and CCS2
fitted to European, Japanese and Korean vehicles. The client has not decided how to present this. Until it
does: connectors appear in spec tables as fact, and the loader refuses to build if any product carries a
`compatibility` claim of universality. No vehicle-compatibility checker is built.

---

## `person` — built, not published

Seeded with Mike Njia (Chef des opérations, 10 yrs) and Ayeg Théo (Technicien, 15 yrs), both `draft: true`.
No certifications are confirmed and no publication consent has been given, so the loader drops both and the
team page renders its roster empty. Fields: `slug`, `name`, `role`, `years_experience`, `bio`, `photo`,
`certifications[]`, `draft`, `consent_on_file`.

`certifications[]` stays empty. It is not a field to fill in optimistically.

---

## The remaining collections

| Collection | Purpose | Key fields |
|---|---|---|
| `site_settings` | one file, site-wide config | `form_endpoint` *(empty — see `docs/PENDING.md` P-02)*, `whatsapp`, `phone` *(P-01)*, `email`, `address`, `cities[]`, `analytics`, `social` |
| `cta` | reusable call-to-action blocks, so wording is edited once | `slug`, `label`, `href`, `style`, `form_type`, `segment`, `whatsapp_text` |
| `form_definition` | the four segmented forms of Lot 7 | `slug`, `segment`, `title`, `fields[]`, `success_message` *(**no SLA figure**)*, `endpoint_key` |
| `sector_solution` | drives the Lot 4 sector pages | `slug`, `sector`, `title`, `problem`, `solution`, `proof_points[]`, `related_products[]`, `cta` |
| `faq_item` | one question per file, replacing the monolithic `faq.json` | `slug`, `question`, `category`, `order`, `claim_refs[]`; the answer is the Markdown body |
| `guide` | evergreen how-to content | `slug`, `title`, `summary`, `category`, `updated`, body |
| `article` | dated editorial | `slug`, `title`, `date`, `author` → `person`, `summary`, body |
| `partner` | site hosts | `slug`, `name`, `type`, `logo`, `verified` *(gate)*, `consent_on_file` |
| `testimonial` | customer quotes | `slug`, `quote`, `attribution`, `role`, `consent_on_file` *(gate)*, `date` |
| `city` | coverage | `slug`, `name`, `region`, `coverage_real` *(gate)*, `population`, `order` |

`city` is seeded with the six confirmed cities — Douala, Yaoundé, Bafoussam, Bertoua, Edéa, Garoua — each
`coverage_real: true`. `site.json`'s existing two-city list was not wrong, only incomplete.

`partner` ships **empty**. `CLAUDE.md` forbids naming the two known hosts without written agreement.

---

## Referential integrity

Cross-references are slugs, resolved by the loader. A reference to a missing or gated item is dropped and
counted; it never renders as a broken link or an empty card. `orion._broken` carries the tally.

```
station.city        → city.slug
article.author      → person.slug
sector_solution.related_products[] → product.slug
faq_item.claim_refs[]              → claim.slug
```

---

## i18n

Every item may carry `lang` (default `fr`) and `ref` — a stable translation key shared by an item and its
translations. `orion.byRef(collection, ref, lang)` resolves one. Nothing is machine-translated and no
English copy is authored in this phase; the field exists so a translation is an added file rather than a
schema change. See `docs/DECISIONS.md` for why `/en/` routes are wired but not yet emitted.

---

## Adding a collection

1. Create `content/<name>/`.
2. Add the schema to `COLLECTIONS` in `src/_data/orion.js` — including its gate, if it has one.
3. Add the collection to `src/admin/config.yml` as a `folder:` collection.
4. Document it here.

The loader validates every item against its schema at build time. An unknown field is a warning; a missing
required field or a bad enum value **fails the build**. A CMS that can write invalid content is a CMS that
will.
