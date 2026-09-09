# PENDING — client data required

Every slot where a page is structurally complete but renders nothing, because the fact is not confirmed.
Each entry corresponds to one or more `{# PENDING_DATA: … #}` markers in the source.

**The rule (`CLAUDE.md`): no placeholder numbers, no "à partir de X", no lorem. The slot renders nothing.**

25 markers across 21 files. The loader strips markers from Markdown bodies, and Nunjucks strips them from
templates, so none reaches the published page — `scripts/verify.js` asserts this.

**Grouped by who has to supply the answer**, because that is how it gets unblocked.

---

## A. Contact details — blocks basic function of the site

**One of the two items in this section was resolved during the merge, from work done on `main` in
parallel with this run. P-02 remains, and is now the single item blocking lead capture.**

| # | Field | Where | Why it matters |
|---|---|---|---|
| ~~**P-01**~~ | ~~Public voice number~~ | — | **RESOLVED 2026-09-09.** Supplied on `main` while this branch was in flight (commit `456ce66`) and carried across in the merge: `+237 692 439 292`, the same line as WhatsApp. `phone_clean` was normalised to `+237692439292` — no spaces, because it is what goes inside `href="tel:"`. `site.has_phone` is now true, so every footer, `/contact/`, and the `LocalBusiness` structured data render the number. |
| **P-02** | **Form endpoint** | `content/site_settings/general.md` → every form | The site forms need **their own Google Apps Script deployment and backing sheet, separate from the questionnaire backend**. Digitaall to supply the `/exec` URL. Until then every form shows an explicit error and a WhatsApp fallback — it no longer fakes success and discards the submission, which is what it did before. **Nothing on this site can capture a lead until this exists.** |

---

## B. Pricing — blocks published figures on four pages

| # | Field | Where | Note |
|---|---|---|---|
| **P-03** | **11 kW and 22 kW installed price bands** | `/particuliers/tarifs-installation/`, FAQ *Combien coûte l'installation* | The 7 kW band (500 000–700 000 FCFA) is published in full with its inclusion and exclusion lists. The higher powers show a visible notice explaining that the figures are not settled, rather than an "à partir de". |
| **P-04** | **Solar and storage pricing** | `/technologie/solaire-et-stockage/` | No range, no payback period, no worked example. The page states why: cost varies by roughly a factor of five across sites. |
| **P-05** | **Preventive maintenance contract price** | FAQ *Y a-t-il des frais mensuels* | The contract is described as optional and separate; no price. |
| **P-06** | **Instalment / payment-facility terms** | FAQ *Proposez-vous des facilités de paiement* | The previous copy promised "paiement échelonné". No terms are confirmed, so the answer now invites a conversation and promises nothing. |
| **P-07** | **Business audit pricing** | `/entreprises/methode/` | Business pricing is quotation-only (confirmed client instruction). No grid is published. The free initial visit is stated. |

---

## C. Warranty and contract terms

| # | Field | Where | Note |
|---|---|---|---|
| **P-08** | **Full warranty exclusion list and territorial scope** | `/securite/garantie/`, FAQ *Quelle garantie* | Durations (12 + 12 months) and the travel exclusion are confirmed and published. The page states plainly that the remaining exclusions are not settled, that they arrive in writing with the quote, and that the reader should demand them if they do not. |
| **P-09** | **Site-partner contract duration, exit and renewal terms** | `/site-partenaire/programme/` | The page says the term is set by contract and shown in writing before signature. No duration is stated. |
| **P-10** | **Host revenue share, and the charging tariff ORION applies** | `/site-partenaire/modeles-economiques/`, `/outils/calculateur-revenus-site/` | Two consequences. The economics page publishes no revenue figure, payback period or worked example. The revenue calculator has **no default charging tariff** — a default there would become a promise — and stops at the **margin before sharing**, telling the reader explicitly that it is not showing their share. |

---

## D. Team and credentials

| # | Field | Where | Note |
|---|---|---|---|
| **P-11** | **Publication consent for Mike Njia and Ayeg Théo** | `content/person/*` | Both exist as `draft: true` with `consent_on_file: false`. The loader withholds both; the roster renders empty. The page structure exists and will populate the moment consent is recorded. |
| **P-12** | **Professional qualifications of the technical team** | `/securite/`, FAQ *Quelles certifications* | No supporting documents supplied. **Twenty `certifi*` claims were removed** from the site. The pages now state what is verifiable — CE and RoHS on the hardware, ten staff, no subcontracting — and claim no individual credential. `certifications[]` on both person records is empty and must stay so until documents exist. |

---

## E. The connector decision — the largest single open question

| # | Field | Where | Note |
|---|---|---|---|
| **P-13** | **Commercial position on GB/T connectors** | 5 pages: `/technologie/materiel/`, `/particuliers/avant-achat/`, `/services/bornes-publiques/`, `/outils/verificateur-domicile/`, FAQ *Quel connecteur* | All four models are **GB/T**, incompatible with the Type 2 and CCS2 fitted to European, Japanese and Korean vehicles. The client has not decided how to present this. Every page now states the connector **as fact** and tells the reader to check their own vehicle's inlet. **No adapter, workaround or broadened compatibility is announced anywhere.** No vehicle-compatibility checker was built, and `/particuliers/avant-achat/` explains why in the open. |

**This is the item with the widest blast radius.** Copy on five pages was rewritten because of it — see section 3 of the run report. Two statements on the live site were the *opposite* of the truth and had to be corrected outright: `/services/bornes-publiques/` advertised "Compatibilité universelle — connecteurs Type 2 et CCS", and the FAQ claimed compatibility with every vehicle on the market.

---

## F. Response times — deliberately empty everywhere

| # | Field | Where | Note |
|---|---|---|---|
| **P-14** | **Response-time commitment** | site-wide | The client's stated one-hour commitment is under review, so **no response-time figure is published anywhere**. Fourteen were removed, including the form confirmation message and two "sous 48h" quote commitments the discovery grep had not looked for. A claim entry `delai-de-reponse` exists with `approved: false` so the data is traced without being published — it also gives `verify.js` something concrete to test the governance gate against. `form_definition` validation **fails the build** if any confirmation message contains a duration. |
| **P-15** | **Quote turnaround** | `/comment-ca-marche/` | The page previously promised a detailed quote "sous 48 heures". Removed, no substitute. |

---

## G. Smaller items

| # | Field | Where | Note |
|---|---|---|---|
| **P-16** | **Intended use of `TA-AC-G22-ALD3`** | `content/product/`, `/technologie/materiel/` | The supplier did not state one. The specification table renders an em-dash and the page explains the blank rather than inventing a use case. |
| **P-17** | **Expiry date of the 2025 Finance Law 50 % abatement** | `/entreprises/incitations-fiscales/` | Both sources confirm a 24-month duration; neither gives the start or end date. Since a reader in September 2026 may be inside a closing window, the page publishes the duration, flags the unknown, and says to have it confirmed before committing spend. |
| **P-18** | **Excise rate that applied *before* the 2025 exemption** | `/entreprises/incitations-fiscales/` | Two credible sources disagree — 12.5 % and 30 %. Not published; the page says so and why. The exemption itself is not in dispute and is published. |
| **P-19** | **Fleet operating-cost saving vs. thermal** | `/services/entreprises/`, `/entreprises/incitations-fiscales/` | The deleted `-40 %` figure had no source. No replacement figure is published. `/outils/calculateur-tco-flotte/` models the energy term instead, from sourced tariffs the visitor can edit. |
| **P-20** | **Co-ownership infrastructure financing terms** | `/immobilier/` | How a shared riser is split between the syndicate and the residents who want a charger. No offer confirmed. |

---

## What was confirmed and is published

For contrast — everything below is confirmed under ref `ORION-20260809-4M59` and appears on the site:
the four hardware models with full specifications, CE + RoHS certification, the 12-month hardware and
12-month installation warranty (parts and labour, travel excluded, 26 months on the 60 kW model), the
7 kW installed band of 500 000–700 000 FCFA with its inclusion and exclusion lists, the site-partner
revenue-share model stated generically, the payment rails, the six coverage cities, ten staff with no
subcontracting, and the four-week hardware lead time.

Plus five externally sourced facts that needed no client input: the 2025 and 2026 Finance Law measures,
the ARSEL low-voltage electricity tariff, and the administered pump prices for super and diesel.
