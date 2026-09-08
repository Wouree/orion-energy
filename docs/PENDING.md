# PENDING — client data required

Every slot where a page is structurally complete but renders nothing, because the fact is not confirmed.
Each entry marks a `{# PENDING_DATA: … #}` comment in the source.

**Rule (`CLAUDE.md`): no placeholder numbers, no "à partir de X", no lorem. The slot renders nothing.**

| # | Page / file | Field | What is needed | Blocks | Status |
|---|---|---|---|---|---|
| P-01 | `src/_data/site.json` | `phone`, `phoneClean` | The public voice number. Currently the placeholder `+237 6XX XXX XXX` / `+2376XXXXXXXX`, so every `tel:` link on the live site is dead. WhatsApp (`237692439292`) is confirmed and will be wired; the voice line is not. | Every page footer, `/contact/` | **OPEN** |
| P-02 | site-wide (`_data`) | `form_endpoint` | A Google Apps Script deployment **and backing sheet dedicated to the site forms**, separate from the questionnaire backend. Digitaall to supply the `/exec` URL. Until then the field stays empty and forms must fail loudly, not fake success. | All forms, Lot 7 | **OPEN** |

*(Entries P-03+ are added as later lots hit missing facts: 11 kW / 22 kW price bands, warranty exclusions and territorial scope, solar & storage pricing, response-time commitment, team certifications and publication consent, `TA-AC-G22-ALD3` intended use.)*

---

## Known-and-usable, for contrast (do **not** log these as pending)
Confirmed by the client under ref `ORION-20260809-4M59` and safe to publish: the four hardware models and
their specs, CE + RoHS certification, 12-month hardware / 12-month installation warranty (parts and labour,
travel excluded), the 7 kW installed band of 500 000–700 000 FCFA with its inclusion and exclusion lists,
the site-partner revenue-share model stated generically, the payment rails, the six coverage cities,
10 staff with no subcontracting, and the four-week hardware lead time.
