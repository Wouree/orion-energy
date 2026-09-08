# CLAUDE.md — ORION Energy site build

Standing rules. These survive compaction; re-read this file after any context compaction before continuing.

---

## Authority

Within branch `build/phase-0-1`:
- Investigate, decide, edit, commit, push freely.
- Do not merge to `main`. Ever.
- Do not touch DNS, Cloudflare project settings, environment secrets, or the Apps Script deployment.
- Do not run `wrangler deploy` or any production deploy command.
- One session at a time against this working tree.

Decide and continue. Do not stall waiting for input. If a decision is genuinely ambiguous, pick the most conservative option, log it in `docs/DECISIONS.md`, and move on.

**Stop the run only for:** anything irreversible, anything outside the branch, anything requiring a credential you do not have, or a discovery that invalidates the brief itself (e.g. the repo is not what the brief assumes).

---

## The one rule that outranks everything

**Never invent client data.**

This project exists because the live site publishes claims it cannot prove. Do not add to them.

If a page needs a fact you do not have — a price, a warranty exclusion, a certification, a station status, a date, a person's qualification — you write:

```njk
{# PENDING_DATA: 11kW price band — awaiting client, see docs/PENDING.md #}
```

and you render nothing in that slot. Not a placeholder number. Not "à partir de X". Not lorem. Nothing.

Log every instance in `docs/PENDING.md` with the page, the field, and what is needed. That file is a deliverable.

A page that is structurally complete with three empty data slots is a success. A page with three invented figures is a failure that has to be found and unpicked later.

---

## Data you may use

These are confirmed by the client (ref `ORION-20260809-4M59`) and safe to publish:

**Hardware** — four models, ORION-branded, made in China, supplied via Eagle South Capital, 4-week lead time, permission granted to publish all references. Certifications: **CE and RoHS only**.

| Model | Type | kW | Connector | IP/IK | Warranty | Availability | Use |
|---|---|---|---|---|---|---|---|
| XD-AC-G07-P | AC wallbox | 7 | GB/T | IP54/IK08 | 12 mo | In stock | Residential |
| TA-AC-G22-ALD3 | AC pedestal | 44 | GB/T | IP54/IK10 | 12 mo | To order | *(unstated)* |
| TA-DC-WD20kW | DC rapid | 20 | GB/T | IP54/IK08 | 12 mo | To order | Fleet |
| TA-DC-DD60kW | DC rapid | 60 | GB/T | IP54/IK10 | 26 mo | To order | Public station |

**Never write "IEC 61851" anywhere.** It is not among these certifications.

**Warranty** — 12 months hardware, 12 months installation, covers parts and labour. Travel not covered. Exclusions and territorial scope are PENDING.

**Pricing** — 7 kW installed: 500 000–700 000 FCFA. Includes charge point + installation. Excludes: cable beyond 15 m, switchboard rework, earthing, civil works, trenching. Residential prices publishable; business pricing on quotation only. 11 kW and 22 kW are PENDING.

**Site partner model** — signed revenue-share. ORION carries equipment, civil works, grid connection, consumed electricity, maintenance, insurance, signage. Host contributes land. ORION sets the tariff. Write this generically: **do not name MRS or Corley anywhere** — naming requires written agreement not yet given.

**Payment** — Mobile Money first (Orange Money, MTN MoMo), then VISA/MasterCard. Acquirers Access Bank and CCA, aggregator MANSA.

**Team** — Mike Njia (Chef des opérations, 10 yrs), Ayeg Théo (Technicien, 15 yrs). Build the page; **do not publish it**. No certifications and no publication consent yet. Set `draft: true`.

**Coverage** — Douala, Yaoundé, Bafoussam, Bertoua, Edéa, Garoua. 10 staff, no subcontracting.

**Do not publish any response-time figure.** The client's stated 1-hour commitment is under review. Ship pages with no number.

**Do not build the station map.** All sites are confidential.

---

## Connectors — handle with care

All four models are **GB/T** (Chinese standard). This is incompatible with Type 2 and CCS2 fitted to European, Japanese and Korean vehicles. The client has not yet decided how to present this.

Until that decision lands:
- State connector types factually in spec tables.
- Do **not** write that ORION works with all vehicles, all brands, or every EV.
- Do **not** build the vehicle compatibility checker.
- Do **not** claim the public network serves all drivers.

Log any copy where this constraint forced a rewrite.

---

## Brand tokens — exact, never approximated

```
--inst:    #14328C   Institutional Blue   PMS 2748 C
--primary: #0B47BF   Primary Blue         PMS 2728 C
--tech:    #1383F2   Technology Blue      PMS 2175 C
--blue:    #0F79F2   Energy Blue
--green:   #48D951   Primary Green        PMS 2270 C
--green2:  #73D844   Secondary Green      PMS 2275 C
--lime:    #D3D936   Energy Lime          PMS 389 C
--ink:     #0E1A2B   Dark / primary text
--body:    #3D5068   Medium / body text
--mute:    #6B839A   Light
--wash:    #F4F6FA   Off-white background
--rule:    #DDE3EB   Borders
```

Display: **Montserrat** (600–800). Body: **Inter** (400–600).

The blue-to-green gradient is the signature — one moment per page, never a general fill. Status colours (errors, station statuses, badges) sit **outside** the brand palette so an open station never reads as a primary button.

Authoritative source: `brand.orionenergycmr.com`. Never sample colours from logo files — JPEG/WebP compression shifts values.

---

## Stack and known traps

Eleventy + Sveltia CMS + GitHub + Cloudflare Pages. Cloudinary for media.

- **Apps Script always returns HTTP 200.** Frontend must branch on `result.ok` from the JSON body, never `response.ok`.
- **eleventy-img path trap:** Sveltia writes web-absolute paths with a leading `/`; `path.isAbsolute()` reads these as filesystem-absolute and the build fails. Use a defensive wrapper.
- **`filenameFormat`:** always pass eleventy-img's `id` argument, or re-uploaded same-name files produce identical URLs and serve stale assets.
- **Sveltia config:** a `file:` key at collection level is invalid — use a `files:` array.
- **auth.wouree.com** is the standing shared OAuth worker for all Digitaall client sites. Never deploy a per-client Worker.
- **Cloudflare Pages build failures are silent.** After any config change, confirm the build actually succeeded.

---

## Content governance

Every published figure or superlative must exist as an entry in the `claim` collection with: text, class (`fait_verifie` / `spec_fabricant` / `donnee_externe` / `estimation` / `ambition`), evidence URL, evidence date, owner, and `approved: true`. **Unapproved claims must not render.** Enforce this in the template, not by editorial discipline.

`testimonial` requires `consent_on_file: true` before render. `partner` requires `verified: true`. `city` and `station` publish only where coverage is real.

---

## Working conventions

- Copy is **French**. English mirror is a later phase — build the i18n architecture, do not write English copy.
- Docs: `docs/NN-SLUG.md`.
- Commits: `type(scope): message`, present tense, one logical unit per commit. Commit after every lot — never let more than ~45 minutes of work sit uncommitted.
- Verification: Playwright screenshots at **390 / 768 / 1440** into `docs/screenshots/NN/`.
- Report before fixing when blast radius is unknown; fix freely when it is known and contained.

---

## Files you maintain throughout

| File | Purpose |
|---|---|
| `docs/DECISIONS.md` | Every judgement call, one line each, with reasoning |
| `docs/PENDING.md` | Every PENDING_DATA slot: page, field, what is needed |
| `docs/PROGRESS.md` | Lot status. Update on entry and exit of each lot |

`docs/PROGRESS.md` is how you recover after compaction. Read it first when context resets.
