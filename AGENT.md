<!-- BEGIN:career-ops-agent-rules -->
# Read this before touching anything

This workspace is **career-ops** — an AI job-search pipeline. Two doc files already own the "how the system works" layer: **`AGENTS.md`** and **`CLAUDE.md`** (system-layer, auto-updatable, do NOT put user data in them). **This file (`AGENT.md`) is different**: it's the running log of what coding agents have actually *done* for this user (Stuti Shah), so the next agent doesn't re-derive context or repeat mistakes. Update it when you do material work.
<!-- END:career-ops-agent-rules -->

---

# Agent guide — Stuti Shah's job search (career-ops workspace)

## What this is

A live job search run on top of the career-ops system. The user is **Stuti Shah**, MEng CS @ Virginia Tech (grad **May 2026**), targeting **US new-grad / early-career SWE, ML, and Data Science** roles. The agent's job: scan boards → evaluate fit (A–G) → generate tailored resumes → write application packs → track everything. **The agent never submits applications** — the user reviews and clicks submit (hard rule, see CLAUDE.md "Ethical Use").

## Who the user is (load before any tailoring)

Source of truth, in priority order: `cv.md` → `config/profile.yml` → `modes/_profile.md`.
- **Strengths to lead with:** Volvo Group internship (production ML on millions of vehicle sensor records; DMIS automation = 4hr→6min, **$176,980/yr saved**; K8s/Argo CD GitOps); HERE! Wireless **four pricing models** (revenue leakage); academic **forecasting** project (FinBERT multimodal + conformal calibration); **Economics minor**.
- **Excites (score up):** applied ML, data/analytics engineering, pricing/forecasting/optimization.
- **Drains (score down / SKIP):** pure frontend/UI, QA-only seats.
- **HARD FILTER — visa:** will need sponsorship after OPT. JD says "no sponsorship / US citizens only / no future sponsorship" → **auto-SKIP** regardless of score. This is the #1 disqualifier and is unconfirmed on most roles — flag it every time.
- **Comp:** target $120–160K base, **walk-away floor $110K**. US, open to relocation, remote/hybrid fine.

## Key invariants to preserve

- **Never invent metrics or experience.** Resume/pack content should come from `output/stuti-shah-cv.tex` and/or `cv.md`; no fabricated bullets or metrics.
- **CV format is HTML (rich template), tailored per role.** `templates/cv-template.html` (gradient header, competency tags, DM Sans/Space Grotesk fonts); `config/profile.yml` has `cv.output_format: html`. Generate via **`node scripts/tailor-resume.mjs <slug> | --all | --list`**, which now parses `output/stuti-shah-cv.tex`, fills the HTML template, then calls `node generate-pdf.mjs <in.html> <out.pdf>` (Playwright/Chromium, installed).
- **Resume tailoring = JD-ranked emphasis, KEEP full content (don't gut it).** Each role gets: a role-specific summary, JD-relevant competency tags, and bullets/projects/skills **re-ordered** so the most JD-relevant evidence leads. Keep all strong technical bullets; only drop genuinely off-target items (e.g. `finance`, badminton). **Never** force fixed counts ("Volvo=3, projects=2"); it's fine for Volvo or a key project to carry more bullets. **~2 pages is acceptable and was the user's explicit choice** (full content over a forced one page). Each role's `priority` tag-order + `summary` + `competencies` live in the `ROLES` map in `scripts/tailor-resume.mjs`.
- **Page-count check (if needed):** decompress the PDF page tree (zlib), not `grep /Count` (compressed streams make grep lie). HTML PDFs are ~110–116 KB; the old LaTeX ones were ~36 KB — size is a quick format tell.
- **`output/stuti-shah-cv.tex`** — full Jake-LaTeX master (all experiences + projects + skills), rebuilt from `cv.md`; this is now the source parsed by `scripts/tailor-resume.mjs`. Keep section order as Technical Skills → Experience → Projects → Education, with Education at the bottom. User may edit it; don't delete without asking. (Was accidentally deleted once on 2026-05-31, then rebuilt.)
- **Tracker: never hand-add rows.** Write TSV to `batch/tracker-additions/` then `node merge-tracker.mjs`. You MAY edit `data/applications.md` to update status/notes of existing rows. Statuses must be canonical (`templates/states.yml`). Health check: `node verify-pipeline.mjs`.
- **Don't edit `AGENTS.md` / `CLAUDE.md` / `modes/_shared.md`** for user-specific content — those are system layer. User customization goes in `modes/_profile.md` or `config/profile.yml`.
- **SKIP/Discarded roles get no resume and no application pack** — they're not application materials.

## How sourcing actually works (the efficient path)

The zero-token way to pull JDs is hitting ATS public APIs directly — **far more reliable than WebFetch** on JS-rendered career pages:
- Greenhouse: `https://boards-api.greenhouse.io/v1/boards/{slug}/jobs` and `.../jobs/{id}?content=true`
- Ashby: `https://api.ashbyhq.com/posting-api/job-board/{slug}?includeCompensation=true`
- Lever: `https://api.lever.co/v0/postings/{slug}?mode=json`
- Greenhouse boards added in `portals.yml` need an explicit `api:` field (auto-derivation from `boards.greenhouse.io` doesn't work).
- **Vetting gate before evaluating:** real IC SWE/ML/DS title (not senior/manager/sales/frontend), US location, JD `years ≤ 2`, sponsorship not excluded. **Title alone is not enough** — always read the full JD (early mistakes came from title-only filtering letting senior/PERM/no-sponsorship roles through).

## What's been done so far (as of 2026-05-31)

- **38 evaluation reports** in `reports/` (`{NNN}-{company}-{date}.md`, blocks A–G).
- **42 tracker entries** in `data/applications.md` — 31 Evaluated, 9 SKIP, 2 Discarded, **0 Applied** (nothing submitted yet — by design). Verified clean (0 errors).
- **26 tailored resumes** in `output/resumes/` (`stuti-shah-{slug}.{html,pdf}`) — HTML format, JD-ranked emphasis, full content, ~2 pages. Generated by `scripts/tailor-resume.mjs`.
- **28 application packs** in `output/applications/` (`{NN}-{slug}.md`) — each: apply link, which resume to upload (.pdf), tailored cover letter, "why this company", "greatest strength". Shared fields (work auth, salary, EEO, start date) in `output/applications/_COMMON-answers.md`. (Note: 28 packs vs 26 resumes — packs include the 2 non-applied edge cases; reconcile if needed.)
- **`portals.yml` retuned** for Stuti: `title_filter` → new-grad SWE/ML/DS (was senior AI/FDE); `location_filter` → US-only; added big-tech + AI/ML + fintech boards.
- **Master CV format is Jake LaTeX.** `output/stuti-shah-cv.tex` is the full Jake-LaTeX master rebuilt from `cv.md` and is now parsed by the resume generator; don't delete without asking. The current master PDF is generated directly from this LaTeX source, with Education at the bottom.
- **Boards largely exhausted** for net-new US early-career SWE/ML/DS roles across Greenhouse/Ashby/Lever (4 rounds run). Further rounds hit diminishing returns — next net-new roles are mostly FAANG/Workday (paste URLs to evaluate individually).

## File map (artifacts this agent produced)

| Path | Purpose |
|---|---|
| `reports/{NNN}-*.md` | A–G evaluations (38 of them) |
| `data/applications.md` | Tracker (canonical statuses; edit-to-update only, add-via-TSV) |
| `scripts/tailor-resume.mjs` | **Resume generator** — parses `output/stuti-shah-cv.tex` + per-role ROLES map; `<slug>`/`--all`/`--list` |
| `output/resumes/stuti-shah-{slug}.{html,pdf}` | 26 JD-tailored HTML resumes (~2 pages) |
| `output/applications/{NN}-{slug}.md` | 28 application packs (cover letter + answers) |
| `output/applications/_COMMON-answers.md` | Reusable form fields (work auth, salary, EEO) |
| `output/stuti-shah-cv.pdf` | Generic master CV generated directly from the Jake-LaTeX master |
| `output/stuti-shah-cv.tex` | Full Jake-LaTeX master (rebuilt from cv.md); source for tailored HTML resumes |
| `templates/cv-template.html` | System CV template (HTML, current default) |
| `templates/cv-template.tex` | Jake LaTeX template (not the default) |
| `portals.yml` | Scanner config, retuned for new-grad US targets |
| `batch/tracker-additions/*.tsv` | Drop zone for new tracker rows (merge-tracker.mjs) |

## Caveats / gotchas the next agent must know

- **Resume engine is now PERSISTED** at `scripts/tailor-resume.mjs` (was ephemeral `/tmp` — fixed 2026-05-31). To tailor a new role: add one entry to the `ROLES` map (`summary` + `priority` tag-order + `competencies`) and run `node scripts/tailor-resume.mjs <slug>`. Content is parsed from `output/stuti-shah-cv.tex`, so update that master when adding/editing experiences or projects. Ignore any leftover `/tmp/tailor*.mjs` or `/tmp/gen*.mjs` — superseded.
- **Two Figma roles (Data Engineer #07, Data Platform #08)** — apply to one, not both.
- **Some roles are honest stretches** (2yr asks, MS-substitutes): Lyft ×2, Flexport, Reddit, DoorDash-ETA. Noted in their reports; not new-grad-clean.

## Open work / next steps

- **Master index** not yet built — a single file listing all 28 (score, resume path, apply link, status checkbox) for the user to track submissions. (User has asked about this twice; likely next.)
- **Nothing has been submitted yet** (by design — 0 rows `Applied`). When the user confirms a real submission, flip that row to `Applied` and update the date.
- **Re-scan Samsara & Instacart** for their real US IC roles — the earlier scan matched a Manager/EM posting (now Discarded), not an IC seat.
- **FAANG / Workday roles** (Google, Meta, Amazon, Apple, Microsoft) aren't reachable by the zero-token scanner — evaluate by pasting specific URLs.
- **Resumes are ~2 pages** by user's choice (full content). If a specific role needs a shorter version, prefer tuning the existing HTML generator/template rather than creating separate Jake one-page files.

## Quick commands

```bash
node generate-latex.mjs output/resumes/stuti-shah-{slug}.tex output/resumes/stuti-shah-{slug}.pdf  # compile a resume
node merge-tracker.mjs        # fold batch/tracker-additions/*.tsv into the tracker
node verify-pipeline.mjs      # tracker health check (statuses, links)
node scan.mjs                 # zero-token portal scan → data/pipeline.md
```
