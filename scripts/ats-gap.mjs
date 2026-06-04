#!/usr/bin/env node
/**
 * ats-gap.mjs - ATS keyword/compliance analysis: each role's tailored resume vs
 * its JD keywords (from the evaluation report's `## Keywords` section).
 *
 * For every role it computes which JD keywords the resume already matches and
 * which are missing, classifies the misses (exact tool the ATS hard-matches vs a
 * concept you can reframe truthfully), notes ATS-formatting status of the shared
 * Jake/tectonic template, and writes a per-role analysis to output/ats-analysis/.
 * A coverage summary is written to output/ats-analysis/_SUMMARY.md.
 *
 * Usage: node scripts/ats-gap.mjs
 * Re-run after editing resumes/master to refresh the analyses.
 */
import { readFile, writeFile, mkdir, readdir } from 'fs/promises';

const ROOT = new URL('..', import.meta.url).pathname;
const RESUMES = ROOT + 'output/resumes';
const REPORTS = ROOT + 'reports';
const OUTDIR = ROOT + 'output/ats-analysis';

// slug (resume) -> report number prefix
const SLUG_TO_REPORT = {
  scaleai: '002', 'spotify-mle': '009', 'doordash-mktpl': '004', glean: '007',
  'ramp-data': '015', 'notion-ai': '018', 'mongodb-devprod': '031', 'mongodb-migration': '032',
  'lyft-pricing': '026', 'lyft-opt': '027', disney: '001', 'spotify-ds': '010',
  'discord-ds': '022', 'discord-de': '023', 'figma-de': '019', 'figma-dpe': '020',
  'robinhood-be': '021', 'flexport-swe': '024', 'baseten-mp': '025', 'dropbox-ds': '028',
  'dropbox-infra': '029', 'gitlab-ai': '030', 'vercel-be': '033', 'nuro-ng': '034',
  'nuro-dataplat': '035', 'upstart-agentic': '036', launchdarkly: '037', braintrust: '038',
  'loop-swe': '039', 'perpay-swe': '040', 'tiktok-mle': '053', 'wbd-mle': '042',
  'milwaukee-mle': '043', 'torc-mle-app': '044', 'torc-mle-accel': '045', 'nvidia-mle-compiler': '046',
};

// Exact tools/frameworks an ATS hard-matches and that are NOT in Stuti's CV.
// A miss here is a real gap — only add to Skills if truthful (a new grad can list
// "familiar with" / "exposure to"); never claim deep experience.
const HARD_TOOLS = new Set([
  'typescript', 'node', 'nodejs', 'mongodb', 'snowflake', 'airflow', 'dbt', 'dagster',
  'kafka', 'debezium', 'cdc', 'cuda', 'tensorrt', 'vllm', 'sglang', 'quantization',
  'kvcache', 'speculativedecoding', 'bazel', 'rust', 'go', 'golang', 'kotlin', 'terraform',
  'oauth', 'scim', 'saml', 'flink', 'bigquery', 'gcp', 'ros', 'luau', 'ruby', 'rails',
  'graphql', 'grpc', 'redis', 'scala', 'hadoop', 'c++', 'gpu', 'ray', 'triton', 'onnx',
  'spanner', 'cassandra', 'elasticsearch', 'rag',
]);

// Concept keywords Stuti can support truthfully but may have phrased differently.
// If a JD keyword matches one of these, advise reframing with the JD's exact term.
const REFRAME = [
  [/inference|latency|throughput/, 'your HybridDiff project cut inference ~250x — surface latency/throughput/inference explicitly in that bullet'],
  [/modelserving|serving/, 'you built model-serving analytics at Volvo — use the literal phrase "model serving"'],
  [/experimentation|abtest|abtesting|causal/, 'frame your conformal evaluation and model comparisons as experimentation / A/B-style testing'],
  [/recommend|personalization|ranking/, 'frame your prediction/quantile-head work toward ranking, recommendation, or personalization'],
  [/distributedsystem|distributed/, 'your Kubernetes/Argo CD services are distributed-systems experience — say so'],
  [/etl|datapipeline|pipeline/, 'you built ETL/data pipelines at Volvo — use "ETL" / "data pipeline" verbatim'],
  [/restapi|api/, 'you built REST APIs — make sure the literal term "REST API" appears in a bullet'],
  [/fullstack/, 'you ship a backend plus a React front end — add the literal term "full-stack"'],
  [/cicd|continuousintegration/, 'your GitOps workflow is CI/CD — use the literal "CI/CD"'],
  [/mlops/, 'your training + evaluation + deployment loop is MLOps-adjacent — use "MLOps"'],
  [/datamodel|datamodeling|schema/, 'your relational schema design (JobHub, PostgreSQL) is data modeling'],
  [/evaluation|eval|calibration|coverage/, 'your conformal/coverage/calibration work is model evaluation — use the exact term'],
  [/featureengineering|features/, 'you list feature engineering — make sure it appears in an experience/project bullet, not just Skills'],
  [/forecast/, 'your time-series + quantile forecasting work supports this — use "forecasting"'],
  [/pricing|revenue|monetization/, 'your HERE! pricing models support this — use the JD term in a bullet'],
  [/warehouse|redshift|databricks/, 'you used Redshift/Databricks-style warehousing — name it'],
  [/optimization|optimize/, 'your inference-speedup and pricing/forecasting work both show optimization'],
  [/nlp|languagemodel|llm/, 'your FinBERT/Qwen2-VL work is NLP/LLM-adjacent — use the JD term where truthful'],
];

function norm(s = '') {
  return s.toLowerCase().replace(/[^a-z0-9+#]/g, '');
}

function stripLatex(tex) {
  const start = tex.indexOf('\\section{Summary}');
  const body = start >= 0 ? tex.slice(start) : tex;
  return body
    .replace(/\\[a-zA-Z]+\b/g, ' ')
    .replace(/[{}\\$~^]/g, ' ');
}

function extractKeywords(report) {
  const m = report.match(/^## Keywords(?: extracted)?\s*$/m);
  if (!m) return [];
  const after = report.slice(m.index + m[0].length);
  const end = after.search(/^## /m);
  const block = (end >= 0 ? after.slice(0, end) : after).trim();
  return block
    .split(/[,\n]/)
    .map((k) => k.replace(/^[-*\s]+/, '').trim())
    .filter((k) => k && !/^\(/.test(k) && k.length > 1);
}

async function reportPath(num) {
  const files = await readdir(REPORTS);
  const f = files.find((x) => x.startsWith(`${num}-`) && x.endsWith('.md'));
  return f ? `${REPORTS}/${f}` : null;
}

function reframeHint(kwNorm) {
  for (const [re, hint] of REFRAME) if (re.test(kwNorm)) return hint;
  return null;
}

const ATS_FORMAT_NOTE = `## ATS formatting check
This resume is generated from the Jake's-Resume LaTeX template and compiled with tectonic (XeTeX), which produces a real, selectable text layer with proper Unicode mapping — so ATS parsers read it as text, not an image. It is single-column, uses standard section headings (Summary, Education, Experience, Projects, Technical Skills), real bullet lists, and no images, text boxes, headers/footers, or multi-column blocks. That is about as ATS-safe as a formatted resume gets.

Minor watch-items (not errors): the contact line and the Experience/Education headings use a two-column \`tabular*\` layout — modern parsers (Greenhouse, Lever, Ashby, Workday) handle this fine, but a few strict legacy parsers read tabular rows in an odd order. If a specific portal mangles the parse preview, paste a plain-text version into any free-text box. Skills are written as "Category: items" lines, which parse cleanly. Date ranges use an en-dash, which is fine.`;

async function analyzeRole(slug, num) {
  const rp = await reportPath(num);
  const [tex, report] = await Promise.all([
    readFile(`${RESUMES}/stuti-shah-${slug}.tex`, 'utf8'),
    rp ? readFile(rp, 'utf8') : Promise.resolve(''),
  ]);
  const resumeNorm = norm(stripLatex(tex));
  const keywords = extractKeywords(report);

  const present = [];
  const missing = [];
  for (const kw of keywords) {
    const n = norm(kw);
    const hit = n.length > 1 && (resumeNorm.includes(n) || (n.endsWith('s') && resumeNorm.includes(n.slice(0, -1))));
    (hit ? present : missing).push(kw);
  }
  const coverage = keywords.length ? Math.round((present.length / keywords.length) * 100) : 0;

  const tools = [];
  const reframe = [];
  const generic = [];
  for (const kw of missing) {
    const n = norm(kw);
    if (HARD_TOOLS.has(n) || HARD_TOOLS.has(n.replace(/s$/, ''))) tools.push(kw);
    else {
      const hint = reframeHint(n);
      if (hint) reframe.push([kw, hint]);
      else generic.push(kw);
    }
  }

  const role = (report.match(/^# Evaluation: (.+)$/m) || [, slug])[1];
  const url = (report.match(/^\*\*URL:\*\* *(.+)$/m) || [, ''])[1].trim();

  const md = `# ATS Analysis — ${role}

**Resume:** output/resumes/stuti-shah-${slug}.pdf
**JD keywords source:** ${rp ? rp.replace(ROOT, '') : '(report not found)'}
${url ? `**JD URL:** ${url}\n` : ''}
## Compliance score
**${present.length}/${keywords.length} JD keywords matched (${coverage}%).**

**Already matched:** ${present.join(', ') || '(none)'}

**Missing:** ${missing.join(', ') || '(none — full coverage)'}

## Closing the gap — specific changes
${tools.length ? `**Exact tools the ATS scans for (only add if truthful):** ${tools.join(', ')}.
Add the ones you can honestly speak to as a Skills line such as "Familiar with: …" or "Exposure: …". For a new-grad role this is expected; do not claim deep experience with a tool you haven't used.\n` : ''}
${reframe.length ? `**You can support these — use the JD's exact wording:**
${reframe.map(([kw, hint]) => `- **${kw}** — ${hint}.`).join('\n')}\n` : ''}
${generic.length ? `**Weave in if accurate (move into the Summary or the first two bullets, where recruiters and ATS weight them most):** ${generic.join(', ')}.\n` : ''}
General phrasing rules that raise the score without overclaiming:
- Put the most important 3–5 JD terms in the Summary and the first one or two Experience bullets; top-of-page placement is weighted more.
- Mirror the JD's exact noun phrase (e.g. write "REST API" if the JD says "REST API", not "RESTful services").
- Keep one clean "Technical Skills" block — ATS does exact-string matching there, so it is the cheapest place to add a missing-but-true keyword.

${ATS_FORMAT_NOTE}
`;
  await writeFile(`${OUTDIR}/${slug}.md`, md);
  return { slug, role, coverage, present: present.length, total: keywords.length, missing, tools };
}

async function main() {
  await mkdir(OUTDIR, { recursive: true });
  const only = process.argv[2];
  if (only) {
    if (!SLUG_TO_REPORT[only]) { console.log(`unknown slug: ${only}`); return; }
    const r = await analyzeRole(only, SLUG_TO_REPORT[only]);
    console.log(`${only}: ${r.present}/${r.total} keywords (${r.coverage}%)`);
    console.log(`missing: ${r.missing.join(', ') || '(none)'}`);
    console.log(`-> output/ats-analysis/${only}.md`);
    return;
  }
  const rows = [];
  for (const [slug, num] of Object.entries(SLUG_TO_REPORT)) {
    try {
      rows.push(await analyzeRole(slug, num));
    } catch (e) {
      console.log(`FAIL ${slug}: ${e.message}`);
    }
  }
  rows.sort((a, b) => b.coverage - a.coverage);
  const summary = `# ATS Coverage Summary

One analysis file per role in this folder (\`<slug>.md\`). Coverage = share of the JD's extracted keywords already present in the tailored resume. Lower coverage is not "bad" — many missing terms are exact tools you should only add if truthful; see each file.

| Coverage | Role | Matched | Top missing |
|---:|---|---|---|
${rows.map((r) => `| ${r.coverage}% | ${r.role} | ${r.present}/${r.total} | ${r.missing.slice(0, 5).join(', ') || '—'} |`).join('\n')}

_Generated by \`scripts/ats-gap.mjs\` — re-run after editing resumes or the master._
`;
  await writeFile(`${OUTDIR}/_SUMMARY.md`, summary);
  console.log(`Wrote ${rows.length} analyses + _SUMMARY.md to output/ats-analysis/`);
  console.log(`Coverage range: ${Math.min(...rows.map((r) => r.coverage))}%–${Math.max(...rows.map((r) => r.coverage))}%`);
}

main();
