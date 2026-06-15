# Pipeline Run Notes — 2026-06-12

Tracking the `/career-ops pipeline` run processing the 178 URLs in `data/pipeline.md`
(`batch/batch-input.tsv` ids 1-178). This file is a running log for this run only —
not part of the system layer.

## Status as of this note

- `data/applications.md`: 242 entries, max report #260
- `data/pipeline.md`: 199 checked, 64 pending, 5 attention-needed
- Next unprocessed item: Wayve | Machine Learning Engineer, App SW

## Template fix (batch 6)

`batch/batch-prompt.md`'s "Formato del report" template (Paso 3) had **Spanish section
headers** ("Resumen del Rol", "Match con CV", "Nivel y Estrategia", "Comp y Demanda",
"Plan de Personalización", "Plan de Entrevistas", "Keywords extraídas", "Score Global"
table) baked into the literal output template, even though the rule is "generate
content in JD language, EN default." Two batch-6 reports (#212, #213) copied these
Spanish headers verbatim into otherwise-English reports. Fixed both reports by hand
and **patched `batch/batch-prompt.md`** (Block A-G headers, table headers, "Extracted
Keywords", "Score Breakdown") to English so future batches (7+) don't repeat this.

## What's been done

| Batch | IDs | Reports | Companies | Notes |
|---|---|---|---|---|
| 1 (pilot) | 1-3 | 136-138 | DoorDash, etc. | |
| 2 | 4-13 | 139-148 | Anthropic | Full A-G eval |
| 3 (fast-track) | 14-21 | 149-156 | Anthropic (remaining) | Systemic seniority mismatch → fast-track SKIP |
| 4 | 22-31 | 157-166 | Airtable, Notion | Airtable fast-tracked (explicit YOE in title) |
| 5 | 32-41 | 177-186 | Notion, Vercel | |
| 6 | 42-65 | 187-211 | Vercel, Ramp (full set), Bland, RunPod | See "Concurrent session" below |
| 7 | Glean remainder | 222-227 | Glean | Finished remaining Glean rows after Claude batch; all US hybrid; Product Backend scored 4.0/5 |
| 8 | CoreWeave/W&B block | 228-236 | CoreWeave | Used Greenhouse API because CoreWeave page shell hid JD body; all US locations; Inference AI/ML scored 4.4/5 |
| 9 | Deepgram block | 237-242 | Deepgram | Verified with Playwright; all roles were US remote or US hybrid. ML Systems scored 4.1/5; Restaurants and Billing/Analytics were SKIP due seniority/specialization. |
| 10 | Decagon/Cohere block | 243-247 | Decagon, Cohere | Decagon roles were US but non-engineering SKIPs. Cohere roles were remote-friendly with US locations; Agentic Workflows scored 3.5/5, Data Foundations 3.2/5, Data Infra 3.1/5. |
| 11 | LangChain/Glacis/Helsing block | 248-251 | LangChain, Glacis AI, Helsing | LangChain roles were US on-site and good AI/evals stretches; Glacis was remote but country unspecified, flagged for confirmation; Helsing was Washington DC but skipped for senior regulated-infra/clearance bar. |
| 12 | Sierra block | 252, 254-260 | Sierra | All eight were live US on-site roles. Agent scored 3.8/5 and was assigned tracker #260 after fuzzy dedupe skipped #253; Intelligence and Healthcare Agent scored 3.6/5; Frontend/SRE/Security/Identity were SKIPs. |
| 13 | Wayve/Isomorphic/Legora/Mistral block | 261-268 | Wayve, Isomorphic Labs, Legora, Mistral AI | Enforced US-only filter. Isomorphic Lausanne was skipped for non-US location; Wayve senior/lead AV roles mostly skipped for seniority; Wayve Runtime Platform scored 3.2/5; Mistral Research ML scored 3.4/5; Mistral Backend NY scored 3.9/5 and is the strongest batch target. |
| 14 | Fortune 500 priority block | 269-276 | Google, NVIDIA, Amazon, Adobe, Apple | Scanned configured Fortune 500/big-tech portals first, then processed the highest-signal US roles. Adobe 2026 University Graduate MLE scored 4.2/5 and is the standout. Google ML SWE scored 3.6/5; Amazon Demand Forecasting DS 3.4/5; Apple FoundationDB 3.3/5; NVIDIA new-grad systems/ML roles 3.1-3.2/5. Google AI Agents and PhD Early Career were skipped for level/degree mismatch. |

Strongest new roles so far:
- **#231 CoreWeave Software Engineer, Inference AI/ML, 4.4/5** — IC1, model-serving, Python/K8s/inference fit; confirm export-control eligibility before applying.
- **#275 Adobe 2026 University Graduate Machine Learning Engineer, 4.2/5** — best Fortune 500 scan result; explicit 0-2+ university-grad GenAI services role in Seattle.
- **#239 Deepgram Research Engineer, Machine Learning Systems, 4.1/5** — best Deepgram target; USA remote, ML lifecycle, data engineering, Kubernetes/Docker, evaluation, and internal tooling.
- **#211 RunPod SWE Full-Stack, 4.1/5, Apply** —
PDF generated (`output/resumes/stuti-shah-runpod-fullstack.tex/.pdf`, opened in IDE).
- **#227 Glean Product Backend, 4.0/5** — strong backend/API/product fit; Glean University Grad SWE remains the cleaner entry point if already applied.
Also notable: **#268 Mistral Backend NY, 3.9/5**, **#248 LangChain AI Observability & Evals, 3.9/5**, **#260 Sierra Agent, 3.8/5**, **#249 LangChain Applied AI, 3.7/5**, **#270 Google Machine Learning Software Engineer, 3.6/5**, **#255 Sierra Intelligence, 3.6/5**, **#259 Sierra Agent - Healthcare, 3.6/5**, **#237 Deepgram Active Learning, 3.6/5**, **#240 Deepgram Voice Agent, 3.5/5**, **#274 Amazon Demand Forecasting Data Scientist, 3.4/5**, **#267 Mistral Research ML, 3.4/5**, **#276 Apple FoundationDB, 3.3/5**, **#210 Bland AI MLR Multimodal LLMs, 3.5/5, Evaluated**, **#201 Ramp
Credit, 3.4/5, Stretch**, **#246 Cohere Data Foundations, 3.2/5**, **#247 Cohere Data Infrastructure, 3.1/5**, **#199 Ramp Core Product, 3.2/5**, **#208 Ramp Production
Engineering, 3.1/5, Stretch** — all worth a look even though below the auto-apply bar.

Location rule update from user: **SKIP roles that are not US-based, especially Argentina.**
As of this note, the explicit Argentina Ramp role remains checked/tracked as SKIP (#196). The
Glean, CoreWeave, Deepgram, Decagon, Cohere, LangChain, Helsing, Sierra, Wayve, Legora, and Mistral
blocks processed in batches 7-13 were US-based, US-hybrid, US on-site, or remote-friendly with US
locations, except **#265 Isomorphic Labs Lausanne**, which was skipped for non-US location. Glacis was listed as "Remote" without a country; it
was evaluated but flagged for US/time-zone confirmation before applying.

## Sierra merge note

`merge-tracker.mjs` fuzzy-deduped `Software Engineer, Agent` against older Sierra agent-family
rows (`Agent Data Platform` / `Agent Builder`) because the shared tokens crossed its threshold.
The actual report was moved to **#260** and the tracker role label is `Core AI Agent Delivery`
with the real title in notes. In `data/pipeline.md`, the Sierra Agent row correctly points to
`#260` and `reports/260-sierra-agent-2026-06-12.md`. Report number #253 is intentionally unused.

## Concurrent session collision (resolved)

While this session was working through batch 5 (ids 42-51, intended reports
187-196), a **second concurrent session** was independently running the same
pipeline starting from roughly id 46 onward, writing reports **in Spanish**
(`# Evaluación`, `**Fecha:**`, `**Arquetipo:**`) and racing ahead to report #211
(covering the rest of Ramp's ~14 roles, plus Bland and RunPod — ids ~46-65).

This caused two report-number collisions (#191, #192) where both sessions wrote
different files for the same or overlapping postings, with diverging scores:

- **#191** (Ramp SWE Frontend, same role): ES version 1.6/5 SKIP (already merged,
  applications.md row 22) vs. this session's EN version 1.8/5 SKIP (duplicate,
  same conclusion). **Resolution:** deleted the duplicate EN report + its tracker
  TSV (46.tsv); ES version stands.
- **#192** (Ramp SWE Data Platform, same URL `bca0346c-...`): ES version 2.3/5
  "Proceed with Caution" (speculative Staff-level read) vs. this session's EN
  version 4.1/5 "High Confidence" (recognized this URL as a re-eval of report
  **#15**, already scored 4.1/5 and marked **Applied** back on 2026-05-30).
  **Neither version was ever merged into applications.md** (no row #192 exists).
  **Resolution:** deleted both #192 report files and the unmerged 47.tsv —
  this posting is already correctly tracked under #15 (Applied, 4.1/5); #192
  was pure duplicate re-work. *Recommendation: the 4.1/EN analysis was the more
  accurate one if this ever needs re-doing — trust prior-evaluation evidence
  (#15) over a fresh speculative title/level guess.*
- **#194** (Ramp SWE Banking): duplicate of **#197** (same URL, same 1.8/5 SKIP,
  already merged row 18). Deleted report 194 + 49.tsv.
- **#195** (Ramp SWE Argentina) vs **#196** (Ramp SWE "Accounting (Argentina)"):
  same URL (`9320454f-...`), two different scraped titles, both SKIP for the
  same root cause (Argentina-remote role, hard location mismatch for US-based
  candidate). #196 already merged (row 24, 1.6/5). Deleted report 195 + 51.tsv
  as a duplicate of the same posting.

After cleanup: `node merge-tracker.mjs --dry-run` confirms 195 entries, max #211,
**no pending additions**. `data/pipeline.md` is already checked off through id 65.

**Lesson for the rest of this run:** if another session is active in parallel,
expect more report-number collisions in the 212+ range — check
`reports/{num}-*.md` for multiple files per number, and cross-check
`data/applications.md` before assuming a report needs merging.

## Remaining companies (as of id 66)

Glean (17, ids 66-82), then per the original plan: Palantir(16), Sierra(8),
Spotify(7), PlanetScale(6), Hightouch(6), Deepgram(6), Clay Labs(6), WorkOS(4),
Wayve(4), Supabase(4), Resend(4), Cohere(3), Mistral AI(2), LangChain(2), etc.
— re-derive exact remaining list from `batch/batch-input.tsv` ids 66-178 as
batches progress, since the concurrent session may have already covered some.

## 2026-06-12: Refocus on Fortune 500, resume cleanup, scan recency filter

User redirected the search to focus on Fortune 500 targets only:

- **Resumes**: deleted all non-Fortune-500 resume files from `output/resumes/`
  (42 loose top-level `.tex`/`.pdf` pairs at the root, plus the entire `other/`
  directory — 72 files). Kept only `output/resumes/fortune-500/` (6 pairs:
  adobe-ug-mle, amazon-demand-forecasting-ds, apple-foundationdb,
  google-ml-swe-travel-ads, nvidia-applied-ml-circuit-ncg, nvidia-systems-ncg).
  `drafts/` and `submitted/` left untouched.
- **Pipeline**: trimmed `data/pipeline.md` from 353 to 72 lines — kept only the
  header (intro + `## Pendientes`) and the Fortune 500 priority block (Google,
  NVIDIA, Amazon, Adobe, Apple, IBM), which is also exactly the set of entries
  added by the most recent scan (2026-06-12, browser-careers-api). All other
  pending non-Fortune-500 URLs were removed. `reports/` and
  `data/applications.md` were left untouched.
- **Scan recency filter**: added `buildAgeFilter()` to `scan.mjs` and a new
  `recency_filter: { max_age_days: 7 }` block in `portals.yml` (documented
  example added to `templates/portals.example.yml`). Jobs older than
  `max_age_days` are dropped; jobs whose provider doesn't expose `postedAt`
  (e.g. browser-careers-api, used for Fortune 500 companies) pass through
  conservatively, same as the existing salary filter.
- **tailor-resume.mjs output routing**: added `FORTUNE_500_PREFIXES` and
  `resolveOutDir(slug)` so `build()` now writes new resumes to
  `output/resumes/fortune-500/` (Apple, Google, Meta, Amazon, Microsoft,
  NVIDIA, Adobe, JPMorgan Chase, Capital One, Walmart, IBM, Oracle slug
  prefixes) or `output/resumes/other/` for everything else — never to the flat
  `output/resumes/` root.
