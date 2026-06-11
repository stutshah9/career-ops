# Mode: pdf — Jake's LaTeX Resume (ATS-Optimized)

## Output rules (CRITICAL)

- ALL output goes to `output/resumes/drafts/`
- NEVER move or copy files to `output/resumes/submitted/` automatically
- The user will manually move files to `submitted/` when ready to apply

## Full pipeline

1. Read `cv.md` as the source of truth (NEVER hardcode metrics — read them fresh)
2. Read `article-digest.md` if it exists (supplementary proof points)
3. If JD is not already in context, ask the user: "Paste the JD text or URL."
4. Extract 15–20 keywords from the JD
5. Detect role archetype → adapt framing and bullet selection strategy
6. Detect company location → confirm `letterpaper` (US/Canada) or `a4paper` (rest of world)
7. Write a role-specific **Summary** paragraph (3–5 sentences, keyword-dense, no overclaiming)
8. **Rank and select experience bullets** by JD relevance:
   - Pick 4 most relevant Volvo bullets (from the full list in `cv.md`)
   - Pick 1 optional secondary role bullet (HERE! Wireless, AquaOrange, or TA) if it adds a proof point not covered by Volvo
   - Use natural language — no bullet stuffing, no keyword lists masquerading as sentences
9. **Rank and select projects** by JD relevance: top 3, 2 bullets each
10. Build a role-specific **Technical Skills** section (6 categories, JD-keyword-matched)
11. Inject JD keywords naturally into existing achievements (NEVER invent skills or metrics)
12. Derive the output filename: `stuti-shah-{company-slug}-{role-slug}.tex` (kebab-case lowercase, e.g. `stuti-shah-stripe-swe.tex`)
13. Generate the full `.tex` file using the Jake's LaTeX template below
14. Write to `output/resumes/drafts/{filename}`
15. Compile: `tectonic output/resumes/drafts/{filename}` (PDF lands in same folder automatically)
16. **Second Pass — ATS Alignment** (see section below — runs after initial compile, before final report)
17. Report: `.tex` path, PDF path, which bullets were selected and why (1 line each), before/after keyword match rate

## Jake's LaTeX template structure

Use `templates/cv-template.tex` as the base. The preamble, custom commands, and header are fixed — only replace the content sections. The structure is:

```
\documentclass[letterpaper,11pt]{article}
[fixed preamble — copy from templates/cv-template.tex verbatim]

\begin{document}
\begin{center}
    \textbf{\Huge \scshape {NAME}} \\ \vspace{1pt}
    \small {PHONE} $|$ \href{mailto:{EMAIL}}{\underline{{EMAIL}}} $|$
    \href{{LINKEDIN_URL}}{\underline{LinkedIn}} $|$
    \href{{GITHUB_URL}}{\underline{GitHub}} $|$
    \href{{PORTFOLIO_URL}}{\underline{Portfolio}}
\end{center}

% TAILORED: [one-line note on what was tailored and for which role]
\section{Summary}
 \small{{SUMMARY_TEXT}}
 \vspace{2pt}

\section{Technical Skills}
  [role-specific skills in 6 categories]

\section{Experience}
  [selected experience entries — 4 Volvo bullets + optional 1 secondary]

\section{Projects}
  [top 3 projects × 2 bullets each]

\section{Education}
  [education entries — always include both VT degrees, never change]

\end{document}
```

### LaTeX escaping rules (CRITICAL — compile errors break the PDF)

| Character | Escaped form | Example |
|-----------|-------------|---------|
| `$` in text | `\$` | `\$176,980` |
| `&` in text | `\&` | `S\&P 500` |
| `%` in text | `\%` | `80\%` |
| `#` in text | `\#` | |
| `_` in text | `\_` | |
| `~` in text | `\textasciitilde{}` | |
| `^` in text | `\textasciicircum{}` | |
| `--` (en-dash) | `--` | date ranges: `May 2025 -- Aug 2025` |
| `200+` | `200+` | fine in text |
| URLs | inside `\href{}{}` — no escaping needed | |

### One-page rule

The resume MUST fit on one page. If it overflows:
1. Tighten the Summary to 2–3 sentences
2. Cut the weakest secondary role bullet
3. Trim project bullets to the most impact-dense sentence
4. As a last resort, reduce `\textheight` by 0.1in increments

## Evidence-bank ranking principle

When selecting bullets, rank by this hierarchy:
1. **Quantified outcomes** — `$176,980 savings`, `4 hrs → 6 min`, `200+ students`
2. **Scale signals** — `millions of vehicle sensor records`, `production on K8s`
3. **Direct JD keyword match** — exact tech stack overlaps
4. **Transferable relevance** — adjacent skills the hiring manager will recognize

Never include a bullet just because it exists in `cv.md`. Every bullet on the page must earn its place against the JD.

## ATS rules (clean parsing)

- Use the Jake's LaTeX preamble exactly — it produces ATS-parsable XeTeX output via Tectonic
- Standard section headers: Summary, Education, Experience, Projects, Technical Skills
- No graphics, no columns, no text boxes — all content in the main text flow
- Tectonic (XeTeX backend) embeds proper unicode mappings natively — no `\pdfgentounicode` needed

## Keyword injection strategy (ethical, truth-based)

Legitimate reformulation examples:
- JD says "RAG pipelines" and CV says "LLM workflows with retrieval" → rewrite as "RAG pipeline design and LLM orchestration workflows"
- JD says "MLOps" and CV says "observability, evals, error handling" → rewrite as "MLOps and observability: evals, error handling, cost monitoring"
- JD says "stakeholder management" and CV says "collaborated with team" → rewrite as "stakeholder management across engineering, operations, and business"

**NEVER add skills the candidate does not have. Only reword real experience using the exact JD vocabulary.**

## Second Pass — ATS Alignment

Run this pass after the initial .tex is compiled. It maximizes ATS keyword coverage while preserving natural language quality. Rewrite the .tex in-place, then recompile.

### Step A — ATS Keyword Extraction

Parse the JD as an ATS system would. Build two lists:

**Hard keywords (must appear — these directly affect ranking):**
- Programming languages: exact names (`Python`, `TypeScript`, `SQL`, `Go`, `Java`...)
- Frameworks/libraries: exact names (`PyTorch`, `scikit-learn`, `React`, `dbt`, `LangChain`...)
- Platforms/services: exact names (`AWS`, `GCP`, `Kubernetes`, `Databricks`, `Snowflake`...)
- Role-specific phrases: exact quoted phrases from the JD title and requirements (`"RAG pipeline"`, `"LLM fine-tuning"`, `"data warehouse"`, `"A/B testing"`...)
- Domain vocabulary: specialized terms that ATS systems filter for
- Certifications or degree requirements if explicitly stated

**Soft keywords (nice to appear — signal culture fit and seniority):**
- Ownership verbs: `"end-to-end"`, `"led"`, `"owned"`, `"designed"`, `"deployed"`
- Scale signals: `"production"`, `"large-scale"`, `"distributed"`, `"high-throughput"`
- Collaboration: `"cross-functional"`, `"stakeholder"`, `"ambiguous"`

Deduplicate and normalize synonyms (e.g., `K8s` = `Kubernetes`, `Postgres` = `PostgreSQL`, `ML` = `machine learning`).

### Step B — Before Score

Scan the current .tex file content for each hard keyword (case-insensitive substring match).

Report:
```
Before: X / N hard keywords matched (Y%)
Missing: [list each unmatched hard keyword]
```

### Step C — Gap Analysis

For each missing hard keyword, determine:
1. **Can Stuti honestly claim this?** Cross-check against `cv.md` and `article-digest.md`. If the underlying skill or experience exists but uses different vocabulary → **rewritable**. If the skill is genuinely absent → **skip, do not force**.
2. **Which existing bullet is the best candidate for the rewrite?**

Only proceed to Step D for keywords where there is a genuine claim.

### Step D — Natural Rewrite

For each rewritable keyword gap:
- Find the single best existing bullet to rewrite
- Incorporate the keyword naturally using the underlying evidence
- Keep the original accomplishment intact — only change vocabulary to mirror JD phrasing
- One keyword gap per bullet max — do not stack multiple new terms into one sentence

**Rewrite quality rules:**
- The rewritten bullet must still make sense if the JD did not exist
- Preferred: a rewrite that improves clarity AND adds the keyword simultaneously
- Acceptable: a rewrite that adds the keyword without awkwardness
- Reject: a rewrite that makes the bullet feel like a keyword list

**Legitimate reformulation examples:**
- JD says `"RAG pipelines"`, CV says `"LLM workflows with retrieval"` → `"RAG pipeline design and LLM orchestration workflows"`
- JD says `"MLOps"`, CV says `"observability, evals, error handling"` → `"MLOps and observability: evals, error handling, cost monitoring"`
- JD says `"LangChain"`, CV shows only AWS Bedrock → **skip** — do not claim LangChain if it is not in cv.md

### Step E — Stuffing Audit

Flag any rewritten bullet that:
- Crams 3+ new JD terms into a single sentence
- Uses a keyword in a way that technically misrepresents the accomplishment
- Would read as word-salad to a human reviewer

Mark flagged bullets with `⚠️ STUFFING RISK` and suggest a cleaner alternative. If no clean alternative exists, revert the bullet to the original.

### Step F — After Score

Rescan the updated .tex for hard keywords. Report:
```
After: X / N hard keywords matched (Y%)
Delta: +Z keywords added (+W%)
```

### Step G — Recompile and Output

1. Write the updated .tex back to `output/resumes/drafts/{filename}` (overwrite)
2. Recompile: `tectonic output/resumes/drafts/{filename}`
3. Verify one-page rule still holds after rewrites
4. Print a diff summary: each changed bullet (before → after), the keyword gap it addressed, and any ⚠️ flags

## Post-generation

Update tracker if the job is already registered: change PDF column from ❌ to ✅.
