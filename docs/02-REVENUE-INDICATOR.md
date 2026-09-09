# 02 — SITE REVENUE INDICATOR

Branch `feat/revenue-indicator`, cut from `main` @ `2a0653c`.

---

## Step 1 — Discovery (before any edit)

### (a) What exists at `/outils/calculateur-revenus-site/` today

`src/outils/calculateur-revenus-site/index.njk`, 89 lines, built in Lot 7.

| | |
|---|---|
| Form | `<form data-calculator="siteRevenue">` |
| Inputs | `sessions_per_day` (6), `kwh_per_session` (15), `charging_tariff` (**deliberately empty**), `electricity_tariff` (79, from the `tarif-electricite-bt-domestique` claim) |
| Output | One headline — monthly margin — plus four rows: energy delivered, turnover, energy cost, margin |
| CTA | T3 to `/demande/site-partenaire/` |

**Exactly where it stops:** at the **margin before sharing**. It computes the pool and states in its caveat that it is *not* telling the host their share. There is no host figure, no time dimension, no band, no model comparison, and no print path.

### (b) The shell contract

Registered formulas live in `FORMULAS` in `src/js/calculator.js`. A consumer must supply:

```
<div class="calc-layout">
  <form data-calculator="<formulaName>">        ← named number/text inputs
    <input name="x" data-assumption="…" data-unit="…" data-source="…">
  </form>
  <div data-calculator-result>       </div>     ← required; shell returns early without it
  <div data-calculator-assumptions>  </div>     ← optional
  <div data-calculator-cta hidden>   </div>     ← optional; revealed after first run
</div>
```

The formula receives `(values, formEl)` and returns
`{ headline, headlineLabel, rows[], caveat, blockers?[], notes?[] }`.
The shell re-runs on every `input` event once a result exists, and writes the result to
`sessionStorage` as `tool_result` for the next form.

**Two naming discrepancies in the task brief — reported, not guessed:**

1. **There is no `lp-calculator`.** `grep -rn 'lp-calculator' src/` returns nothing. The shell described
   above is the one the brief means; it is named `data-calculator` / `.calc-*`. The *contract* matches, the
   name does not.
2. **There is no `lp-claim-badge`.** Nothing matching `lp-claim-badge` exists anywhere in the repository.
   The nearest existing component is `.claim-cite`, which is a source-citation line, not a badge. The
   instruction "use the existing `lp-claim-badge` component, do not build a new badge" therefore cannot be
   followed literally. See the decision below.

### (c) Where calculator assumptions live today

Split, and that is the problem this task fixes. Defaults come from the `claim` collection via
`| claimValue`, but everything else — session counts, kWh per session, step sizes — is a literal
`value="…"` attribute in the template. There is no `calculator_assumptions` collection.

### (d) Loader validation contract — `src/_data/orion.js`

Per collection: `required[]`, `enums{}`, `requireBody`, `gate()`, `validate()`, `refs{}`.
Errors accumulate across every collection and then **`throw`**, which fails the build with the file and
the reason. Gated items are dropped before becoming data and counted. `estimation` and `ambition` claims
are exempt from the evidence requirement; the other three classes are not.

### (e) Print stylesheet

**None.** `grep '@media print' src/css/style.css` returns nothing. There are no print styles anywhere on
the site. The leave-behind is built from zero.

### (f) What is genuinely new, against the reference

| Capability | Exists today | In the reference |
|---|---|---|
| Margin before sharing | ✅ | ✅ |
| Electricity cost from a cited claim | ✅ | hardcoded |
| **Host share at all** | ✗ *(deliberate)* | ✅ |
| **Banded output, lo–hi** | ✗ single figure | ✅ |
| **Time dimension — 3/6/9/12 months** | ✗ | ✅ |
| **Utilisation ramps, three paces** | ✗ | ✅ |
| **Both share models visible at once** | ✗ | ✅ |
| **Site type and hardware model selectors** | ✗ | ✅ |
| **Efficiency factor** | ✗ | ✅ 0.85 |
| **Payment fees** | ✗ | ✅ |
| **Detail table** | ✗ | ✅ |
| **Print leave-behind + date stamp** | ✗ | ✅ |

---

## Port decision — extend, do not rebuild

**Extending the existing page.** It already carries the shell wiring, the ARSEL-cited electricity tariff,
the T3 CTA, and the PENDING framing around the charging tariff. Rebuilding would duplicate all four and
throw away the one thing the existing page does better than the reference: sourcing its electricity
default from a dated claim rather than hardcoding it.

### Blast radius of the shell change — reported before making it

The shell renders `headline` plus `rows[]`. A band fits in `headline` as a string, but four milestone
cards, a two-model comparison and a detail table do not fit `rows[]`.

**I am not reshaping the shell.** Three other calculators depend on it — `fleetTco`, `homeReadiness`, and
the existing `siteRevenue`. Instead the result object gains **one optional field, `html`**: when a formula
returns it, the shell renders that verbatim in place of the headline/rows block; when it does not, the
existing path runs unchanged. Purely additive. The other three calculators return no `html` and are
untouched, which the parity assertions confirm.

### The badge

`lp-claim-badge` does not exist, so "do not build a new badge" cannot be honoured as written. Rather than
invent a parallel component, the badge is added as `.claim-badge` **inside the existing `.claim-*`
family** — the same vocabulary as `.claim-cite`, which already marks provenance next to a figure. It is
an inline variant of an existing idea, not a new component, and it does not use the reference's CSS.

---

## What was ported from the reference

| From the reference | Kept as-is | Changed |
|---|---|---|
| The maths — `points × kW × hours × 30 × utilisation × efficiency`, then revenue, energy, fees, net, and the two host shares | ✅ exactly | Reads its constants from the content collection instead of module-level literals |
| Three utilisation ramps × four milestones | ✅ values identical | Moved into `calculator_assumptions`, validated at build time |
| Banded output; mid-point as a secondary line | ✅ | — |
| Both share models rendered at once | ✅ | — |
| Detail table, assumptions list, date stamp | ✅ | Assumptions rendered from the collection |
| French copy, framing paragraph, "ne constitue ni une offre ni un engagement de revenus" | ✅ verbatim | — |
| CSS | ✗ **none copied** | Written against the existing brand tokens and `.calc-*` shell |
| Hardware `<select>` | structure | Populated from the `product` collection, so the four models stay in step with the catalogue |
| Efficiency `0.85` as a module constant | value | Now `efficiency_factor` in the collection |
| Electricity cost `99` hardcoded | value | Now a `donnee_externe` claim citing the ARSEL 801–2000 kWh band |

### What is new, beyond the reference

- **Every number is content.** The reference hardcodes all of them. Replacing a guess with a measurement is now a CMS edit, and the build rejects a malformed one.
- **The electricity default is sourced.** The reference's `99` is the ARSEL 801–2000 kWh band; it now cites the regulator instead of appearing from nowhere.
- **The 7 kW warning.** The model selector says plainly that an AC wallbox earns a host very little. The reference offers the same option silently.
- **T1 email capture and the T3 pre-filled CTA**, neither of which the reference has.
- **The print stylesheet hides the capture** — the reference has no capture to hide.

---

## Arithmetic parity

Asserted permanently in `scripts/verify.js` via `scripts/parity.js`.

**Inputs:** 2 points · 60 kW · 14 h/day · tariff 200 · cost 99 · fees 2 % · efficiency 0.85 · moderate · month 12

| Model | Expected | Actual |
|---|---|---|
| Net, 30 % | 74 799 – 149 597 FCFA | **74 799 – 149 597 FCFA** ✅ |
| Gross, 10 % | 51 408 – 102 816 FCFA | **51 408 – 102 816 FCFA** ✅ |

Derivation of the low bound, for whoever has to re-verify this later:

```
kWh    = 2 × 60 × 14 × 30 × 0.060 × 0.85   = 2 570.4
revenue= 2 570.4 × 200                      = 514 080
energy = 2 570.4 × 99                       = 254 469.6
fees   = 514 080 × 0.02                     = 10 281.6
net    = 514 080 − 254 469.6 − 10 281.6     = 249 328.8
host   = 249 328.8 × 0.30                   = 74 798.64  → 74 799
```

---

## The superseded decision, and how the framing is preserved

Lot 7 stopped this calculator at the margin before sharing, on the grounds that a default share would
read as a promise. That reasoning was right then and is superseded now, but **only** because the split is
presented as an adjustable hypothesis rather than an offer. Four things hold that framing, and all four
are asserted:

1. The percentages are **inputs the visitor moves**, not fixed values.
2. Output is **always a band**, never a single figure — asserted in `verify.js` and in the browser tests.
3. **Both models stay visible**, so the page reads as a comparison of trade-offs rather than a proposal.
4. Every screen and every printout carries **"ne constitue ni une offre ni un engagement de revenus"**.

The underlying rule is unchanged: ORION's actual charging tariff is still unpublished, still carries the
*hypothèse* badge, and the page states in terms that the real split is a contract clause not published here.

---

## Verification

| | |
|---|---|
| `scripts/verify.js` | 14 assertions over 41 pages — the original ten plus parity, no-hardcoded-FCFA, print-hides-capture, no-single-figure |
| `scripts/parity.js` | arithmetic parity + framing, run inside `verify.js` |
| `scripts/smoke-revenue.js` | 22 browser assertions across screen and print emulation |
| `scripts/check-cms-schema.js` | CMS ↔ loader alignment, 16 collections |
| Screenshots | `docs/screenshots/02/` — 390 / 768 / 1440 plus the print leave-behind |
| Clean-clone Pages build | `npm ci` + `npm run build` → 40 pages, `.nvmrc` and `engines` intact, zero reference files in output |
