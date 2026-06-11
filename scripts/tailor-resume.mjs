#!/usr/bin/env node
/**
 * tailor-resume.mjs - JD-ranked resume generator (Jake's Resume LaTeX -> PDF).
 *
 * Source of truth / evidence bank: output/stuti-shah-cv.tex (full multi-page master).
 *
 * Method (see memory: resume-default-generation-method):
 *   The master is a FULL evidence bank, not a one-page template to compress.
 *   For each role we identify the JD's signals (priority tags), rank every real
 *   master bullet / project / skill line by how directly it proves those signals,
 *   keep only the strongest evidence, and emit a clean one-page Jake's Resume in
 *   the master's own natural language. No synthetic "Achieved X measured by Y"
 *   bullets, no keyword stuffing, no "Impact:/Proof:/ATS focus:" labels, no
 *   unsupported tools. The Jake structure, spacing, section order, and bullet
 *   style are preserved verbatim from the master preamble.
 *
 * Usage:
 *   node scripts/tailor-resume.mjs <role-slug>     # one role
 *   node scripts/tailor-resume.mjs --all           # every role in ROLES
 *   node scripts/tailor-resume.mjs --list          # list role slugs
 *
 * Output: output/resumes/stuti-shah-<slug>.{tex,pdf}
 */
import { readFile, writeFile, mkdir, rm } from 'fs/promises';
import { execFileSync } from 'child_process';

const ROOT = new URL('..', import.meta.url).pathname;
const SOURCE_TEX = ROOT + 'output/stuti-shah-cv.tex';
const OUTDIR = ROOT + 'output/resumes';

const COMMON_DROP = ['finance', 'badminton'];

const VOLVO_ID = 'software-engineering-data-science-intern-volvo-group';

// Per-role config. `summary` is a natural 1-2 line lede shown in the top third.
// `priority` is the ranked list of JD signal tags (see TAG_RULES) used to score
// every bullet/project/skill. Highest-value evidence wins the limited space.
const ROLES = {
  master: {
    summary: 'Computer Science MEng new grad at Virginia Tech, graduating May 2026, with internship experience across software engineering, machine learning, and data. Has built and deployed production systems on real data and is comfortable owning work from the data and backend through to deployment, shipping across the stack.',
    priority: ['swe', 'ml', 'backend', 'data', 'ai', 'infra', 'pricing', 'forecasting', 'bi', 'systems'],
  },
  scaleai: {
    focus: 'Builds full-stack product features on Python and Flask with React front ends and machine learning behind them, and enjoys shipping things customers actually use.',
    priority: ['swe', 'backend', 'fullstack', 'automation', 'ml', 'infra', 'data'],
  },
  'spotify-mle': {
    focus: 'Strongest in applied machine learning and model evaluation, with production modeling and multimodal deep-learning work that translates naturally to personalization and recommendation.',
    priority: ['ml', 'ai', 'forecasting', 'eval', 'sensor', 'infra', 'backend'],
  },
  'doordash-mktpl': {
    focus: 'Has real experience with pricing, forecasting, and optimization modeling, which maps naturally to marketplace bidding, pacing, and auction problems.',
    priority: ['pricing', 'forecasting', 'ml', 'ai', 'eval', 'optimization', 'sensor', 'data'],
  },
  'doordash-sevenrooms-da': {
    focus: 'Pairs SQL-driven analysis and dashboard storytelling with direct product-manager collaboration and quantified business impact, a good fit for building data products and feature-launch analytics for product teams.',
    priority: ['impact', 'bi', 'ds', 'data', 'product', 'pricing', 'automation', 'ml'],
    dropExp: ['aquaorange'],
  },
  glean: {
    focus: 'Comfortable across backend, machine learning, and cloud deployment, and ready to grow into scalable platform work.',
    priority: ['swe', 'backend', 'infra', 'automation', 'ml', 'data', 'systems'],
  },
  'ramp-data': {
    focus: 'Has built data pipelines and warehouse-backed flows in SQL, Python, and Spark, which suits the reliable data infrastructure this team depends on.',
    priority: ['data', 'infra', 'backend', 'automation', 'swe', 'bi'],
  },
  'notion-ai': {
    focus: 'Focused on applied AI, with natural-language and multimodal pipelines deployed behind real services and careful evaluation built into the process.',
    priority: ['ai', 'swe', 'backend', 'fullstack', 'ml', 'eval', 'product'],
  },
  'mongodb-devprod': {
    focus: 'Brings CI/CD and GitOps experience along with solid systems fundamentals from teaching computer systems, a good base for build tooling and developer productivity.',
    priority: ['infra', 'systems', 'ci', 'swe', 'backend', 'perf', 'testing'],
    dropExp: ['finance'],
  },
  'mongodb-migration': {
    focus: 'Comfortable with backend data modeling, ETL, and relational databases, and drawn to data-intensive systems work.',
    priority: ['backend', 'data', 'systems', 'swe', 'infra', 'perf'],
  },
  'lyft-pricing': {
    focus: 'Has hands-on pricing and forecasting modeling backed by an economics minor, a strong base for dynamic pricing and offer-selection work.',
    priority: ['pricing', 'forecasting', 'ml', 'ai', 'eval', 'optimization', 'sensor'],
  },
  'lyft-opt': {
    focus: 'Enjoys optimization-minded modeling across pricing and forecasting, backed by an economics minor, and is drawn to matching and fulfillment problems.',
    priority: ['forecasting', 'pricing', 'ml', 'ai', 'optimization', 'eval', 'ds'],
  },
  disney: {
    focus: 'Combines pricing and revenue modeling with clear analytical storytelling and an economics minor, a good fit for pricing and revenue management.',
    priority: ['pricing', 'forecasting', 'ds', 'bi', 'ml', 'data', 'ai'],
  },
  'spotify-ds': {
    focus: 'Pairs forecasting and pricing modeling with analytical storytelling and an economics minor, well suited to subscriptions, growth, and retention analytics.',
    priority: ['pricing', 'forecasting', 'ds', 'bi', 'ml', 'data'],
  },
  'discord-ds': {
    focus: 'Comfortable in SQL and Python with forecasting, modeling, and dashboarding experience, a natural fit for metrics, experimentation, and product analytics.',
    priority: ['ds', 'bi', 'pricing', 'forecasting', 'data', 'ml'],
  },
  'discord-de': {
    focus: 'Has built ETL and Spark pipelines feeding analytics warehouses, well suited to analytics and experimentation data infrastructure.',
    priority: ['data', 'backend', 'bi', 'infra', 'swe', 'automation'],
  },
  'figma-de': {
    focus: 'Has built ETL and Spark pipelines with warehouse-backed SQL and Python flows, a good fit for building an analytics and machine learning data platform.',
    priority: ['data', 'backend', 'bi', 'infra', 'automation', 'swe'],
  },
  'figma-dpe': {
    focus: 'Brings Spark, AWS, and real Kubernetes and GitOps infrastructure experience for building and scaling a core data platform.',
    priority: ['infra', 'data', 'backend', 'swe', 'automation', 'perf'],
  },
  'robinhood-be': {
    focus: 'Has shipped reliable backend services and REST APIs in production with Python, Flask, and PostgreSQL, a solid base for credit and banking systems.',
    priority: ['backend', 'infra', 'swe', 'data', 'systems'],
  },
  'flexport-swe': {
    focus: 'Combines backend, pricing, and forecasting work with production machine learning, well suited to pricing, routing, and forecasting systems.',
    priority: ['pricing', 'backend', 'forecasting', 'swe', 'fullstack', 'ml', 'data'],
  },
  'baseten-mp': {
    focus: 'Has hands-on inference-optimization experience and production model workflows, a strong base for improving large-scale model performance.',
    priority: ['inference', 'perf', 'ml', 'ai', 'systems', 'sensor'],
  },
  'dropbox-ds': {
    focus: 'Brings revenue and product analytics with pricing modeling and an economics minor, a natural fit for growth and monetization work.',
    priority: ['pricing', 'ds', 'bi', 'forecasting', 'data', 'ml'],
  },
  'dropbox-infra': {
    focus: 'Has real Kubernetes and GitOps deployment experience plus solid systems fundamentals, ready for scalable infrastructure work.',
    priority: ['infra', 'systems', 'backend', 'swe', 'perf', 'data'],
  },
  'gitlab-ai': {
    focus: 'Builds AI and automation end to end, from machine-learning and language pipelines to internal tooling that pays for itself.',
    priority: ['automation', 'ai', 'ml', 'swe', 'backend', 'impact'],
  },
  'vercel-be': {
    focus: 'Brings backend services, AWS, infrastructure-as-code, and REST API design for building secure, scalable systems.',
    priority: ['backend', 'infra', 'swe', 'data', 'systems'],
  },
  'nuro-ng': {
    focus: 'Has built an end-to-end machine learning platform with training, evaluation, and deployment, a direct fit for autonomous-driving ML infrastructure.',
    priority: ['ml', 'sensor', 'platform', 'infra', 'ai', 'eval', 'data'],
  },
  'nuro-dataplat': {
    focus: 'Turns raw vehicle sensor data into usable insight through analytics pipelines and ETL, a direct fit for a large-scale autonomous-driving data platform.',
    priority: ['data', 'sensor', 'platform', 'backend', 'infra', 'automation'],
  },
  'upstart-agentic': {
    focus: 'Builds internal AI tooling and natural-language systems, well suited to internal agents and agentic workflows.',
    priority: ['automation', 'ai', 'ml', 'swe', 'backend', 'nlp'],
  },
  launchdarkly: {
    focus: 'Ships end to end across Flask backends, React front ends, and the machine learning behind them, with AI-agent experience for early-stage product work.',
    priority: ['fullstack', 'ai', 'swe', 'backend', 'ml', 'automation'],
  },
  braintrust: {
    focus: 'Brings genuine evaluation discipline, building language and multimodal pipelines and measuring them carefully, a direct fit for an evaluation and observability platform.',
    priority: ['eval', 'ai', 'ml', 'nlp', 'fullstack', 'backend'],
  },
  'loop-swe': {
    focus: 'Ships end to end across backend, front end, and the machine learning behind it, with AI-agent experience for deploying production AI systems.',
    priority: ['fullstack', 'swe', 'ai', 'backend', 'automation', 'ml'],
  },
  'perpay-swe': {
    focus: 'Has production experience with Flask, Python, PostgreSQL, and REST APIs along with front-end work, a strong fit for building customer-facing features.',
    priority: ['backend', 'fullstack', 'swe', 'data', 'automation'],
  },
  'tiktok-mle': {
    focus: 'Strongest in natural-language work and model evaluation, with production modeling experience that translates to search, ranking, and personalization.',
    priority: ['ml', 'ai', 'forecasting', 'eval', 'backend', 'data'],
  },
  'wbd-mle': {
    focus: 'Strong in applied machine learning and evaluation, with production modeling and multimodal work relevant to content and recommendation.',
    priority: ['ml', 'ai', 'forecasting', 'eval', 'backend', 'data'],
  },
  'milwaukee-mle': {
    focus: 'Combines computer-vision and deep-learning projects with production machine learning on real industrial data, a close analog to embedding ML in physical products.',
    priority: ['ml', 'ai', 'cv', 'sensor', 'eval', 'backend'],
  },
  'torc-mle-app': {
    focus: 'Brings inference-optimization work and low-level systems depth, a good base for autonomous-vehicle ML runtime and SDK work.',
    priority: ['ml', 'sensor', 'inference', 'infra', 'systems', 'perf', 'backend'],
  },
  'torc-mle-accel': {
    focus: 'Combines inference-optimization work with strong low-level systems fundamentals, well suited to accelerating AI inference.',
    priority: ['inference', 'perf', 'systems', 'ml', 'sensor', 'backend'],
  },
  'nvidia-mle-compiler': {
    focus: 'Combines inference-optimization work with systems fundamentals in memory, caching, and compilers, a base for machine learning application and compiler tooling.',
    priority: ['inference', 'perf', 'ml', 'systems', 'ai', 'sensor'],
  },
  'amazon-sde-2026': {
    focus: 'Has built cloud-native backend services and ML pipelines in production using Python, distributed data flows, and Kubernetes with CI/CD via Argo CD, a direct fit for Amazon\'s SDE program and ML specialization track.',
    priority: ['backend', 'infra', 'swe', 'ml', 'data', 'systems', 'automation', 'ai'],
  },
  'pinterest-swe-i-backend': {
    focus: 'Has shipped production backend services and REST APIs at scale with Python, Flask, and PostgreSQL, and is comfortable owning distributed systems end-to-end from design through deployment.',
    priority: ['backend', 'swe', 'data', 'infra', 'ml', 'automation', 'systems'],
  },
  'sierra-agentdataplat': {
    focus: 'Has built end-to-end data pipelines and analytics platforms on Python, Flask, and PostgreSQL with Kubernetes deployment, delivering measurable operational savings — a strong fit for agent data infrastructure work.',
    priority: ['data', 'backend', 'infra', 'ml', 'automation', 'swe', 'ai'],
  },
  'sierra-agentbuilder': {
    focus: 'Combines backend API engineering, AI and prompt tooling, and Streamlit-based user interfaces, a natural fit for building the tooling that lets teams configure and deploy AI agents.',
    priority: ['ai', 'backend', 'automation', 'swe', 'data', 'fullstack', 'ml'],
  },
  'robinhood-mle': {
    focus: 'Strongest in applied machine learning with production modeling on real data, tabular ML pipelines, and Kubernetes deployment experience, well positioned for a fintech ML engineering role.',
    priority: ['ml', 'ai', 'forecasting', 'eval', 'infra', 'backend', 'data'],
  },
  'robinhood-agenticai': {
    focus: 'Has shipped production backend services and ML pipelines on Python with Kubernetes and AWS, and is comfortable owning cloud systems end-to-end from design through GitOps deployment.',
    priority: ['infra', 'backend', 'swe', 'ml', 'data', 'ai', 'automation', 'systems'],
  },
  'stripe-swe': {
    focus: 'Has shipped backend services, REST APIs, and data pipelines in production with Python, Flask, PostgreSQL, and AWS, and is comfortable working across the stack from data models through cloud deployment.',
    priority: ['backend', 'infra', 'swe', 'data', 'systems', 'automation'],
    dropExp: ['aquaorange'],
  },
  'doppel-infra': {
    focus: 'Has deployed backend services through Kubernetes and Argo CD GitOps pipelines across dev, staging, and production-aligned environments, and built internal automation tooling that measurably supported engineering team scale.',
    priority: ['impact', 'infra', 'backend', 'swe', 'automation', 'systems', 'data'],
    dropExp: ['aquaorange'],
  },
  'oracle-oci-loadbalancer': {
    focus: 'Has built backend services and internal tooling that improved reliability and operational efficiency for engineering teams, with hands-on production experience across Python, Flask, PostgreSQL, Docker, and Kubernetes, and is comfortable working as a generalist across the stack.',
    priority: ['impact', 'backend', 'infra', 'automation', 'systems', 'swe', 'data'],
    dropExp: ['aquaorange'],
  },
  'magnolia-inventory': {
    focus: 'Has used data analysis, automation, and BI tooling including Excel, Power BI, and Streamlit to turn operational data into measurable process improvements, and is comfortable maintaining accurate databases and translating data into actionable operational decisions.',
    priority: ['bi', 'data', 'pricing', 'automation', 'backend', 'systems'],
    dropExp: ['aquaorange'],
  },
  'loma-linda-pace': {
    focus: 'Has used data analysis, automation, and BI tooling including Excel, Power BI, and Streamlit to support leadership with performance-improvement efforts, identify operational opportunities, and turn data into measurable, actionable results.',
    priority: ['bi', 'data', 'pricing', 'automation', 'backend', 'systems'],
    dropExp: ['aquaorange'],
  },
  'uline-data-analyst': {
    focus: 'Has built SQL-driven data systems and automation tools that replace manual processes with measurable results, including an automation tool that cut a 4-hour manual workflow to under 6 minutes and saved $176,980 annually, and is comfortable scoping a problem and shipping a working solution end to end.',
    priority: ['bi', 'data', 'pricing', 'automation', 'backend', 'systems'],
    dropExp: ['aquaorange'],
  },
};

const TAG_RULES = [
  ['experimentation', /\b(a\/b|experiment|experimentation|causal|cohort|metric|metrics|retention|growth|ltv|churn|conversion)\b/i],
  ['inference', /\b(inference|latency|generation speed|250x|ddpm|model serving)\b/i],
  ['perf', /\b(performance|optimization|optimized|latency|speed|cache|caching|memory hierarchy|low-level)\b/i],
  ['ml', /\b(machine learning|ml|model|models|random forest|pytorch|tensorflow|scikit|feature|prediction|predictive|yolo)\b/i],
  ['ai', /\b(ai|agent|agents|prompt|finbert|qwen|llm|nlp|transformer|multimodal|vision-language)\b/i],
  ['backend', /\b(backend|flask|rest|api|apis|postgresql|mysql|sqlalchemy|service|services|server)\b/i],
  ['data', /\b(data|etl|spark|pyspark|redshift|databricks|query|pipeline|pipelines|database|sql)\b/i],
  ['infra', /\b(kubernetes|docker|argo|gitops|ci\/cd|aws|azure|ec2|lambda|s3|deployment|deployed|cloud)\b/i],
  ['pricing', /\b(pricing|revenue|market positioning|monetization|leakage)\b/i],
  ['forecasting', /\b(forecast|forecasting|return|returns|quantile|conformal|calibration)\b/i],
  ['bi', /\b(power bi|tableau|dashboard|analytics|kpi|visualization|streamlit)\b/i],
  ['systems', /\b(systems|cache|caching|memory|processor|assembly|linux|register|stack|control flow|debugged|debugging)\b/i],
  ['testing', /\b(test|testing|qa|browserstack|testrigor|regression|validation)\b/i],
  ['automation', /\b(automated|automation|workflow|workflows|manual effort)\b/i],
  ['impact', /\b(saved|savings|\$|reduced|improving|improved|under 6 minutes)\b/i],
  ['fullstack', /\b(react|frontend|full-stack|full stack|dashboard)\b/i],
  ['cv', /\b(yolo|opencv|image|shelf|planogram|detection|visual)\b/i],
  ['mobile', /\b(android|ios|mobile|room|livedata|viewmodel|mvvm)\b/i],
  ['product', /\b(product|customer|requirements|leadership)\b/i],
  ['eval', /\b(evaluat|coverage|calibration|rmse|mae|baseline|ablation|directional accuracy)\b/i],
  ['sensor', /\b(sensor|vehicle|truck|complete vehicle|component)\b/i],
  ['ds', /\b(statistic|analysis|root-cause|insight|model)\b/i],
];

// ---------------------------------------------------------------------------
// LaTeX parsing (the master is valid Jake's Resume LaTeX; we keep raw slices so
// emitted bullets stay byte-for-byte faithful and compile cleanly).
// ---------------------------------------------------------------------------

function slugify(text) {
  return decodeLatex(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function stripLineComments(input) {
  return String(input).split('\n').filter((line) => !/^\s*%/.test(line)).join('\n');
}

function decodeLatex(input = '') {
  return stripLineComments(input)
    .replace(/\\href\{([^{}]*)\}\{\\underline\{([^{}]*)\}\}/g, '$2')
    .replace(/\\textbf\{([^{}]*)\}/g, '$1')
    .replace(/\\textit\{(?:\\small)?\s*([^{}]*)\}/g, '$1')
    .replace(/\\emph\{([^{}]*)\}/g, '$1')
    .replace(/\\underline\{([^{}]*)\}/g, '$1')
    .replace(/\\small\b/g, '')
    .replace(/\\&/g, '&')
    .replace(/\\%/g, '%')
    .replace(/\\\$/g, '$')
    .replace(/--/g, '-')
    .replace(/~/g, ' ')
    .replace(/\\[a-zA-Z]+\b/g, '')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function findCommand(source, command, start = 0) {
  let at = start;
  while (true) {
    at = source.indexOf(command, at);
    if (at < 0) return -1;
    const next = source[at + command.length];
    if (!next || !/[A-Za-z]/.test(next)) return at;
    at += command.length;
  }
}

function readBraced(source, start) {
  let i = start;
  while (i < source.length && /\s/.test(source[i])) i += 1;
  if (source[i] !== '{') throw new Error(`expected { at offset ${i}`);
  let depth = 0;
  let out = '';
  for (; i < source.length; i += 1) {
    const ch = source[i];
    const prev = source[i - 1];
    if (ch === '{' && prev !== '\\') {
      if (depth > 0) out += ch;
      depth += 1;
    } else if (ch === '}' && prev !== '\\') {
      depth -= 1;
      if (depth === 0) return { value: out, end: i + 1 };
      out += ch;
    } else {
      out += ch;
    }
  }
  throw new Error(`unterminated braced group at offset ${start}`);
}

function readCommandArgs(source, command, count, start = 0) {
  const at = findCommand(source, command, start);
  if (at < 0) return null;
  const raw = [];
  let cursor = at + command.length;
  for (let i = 0; i < count; i += 1) {
    const group = readBraced(source, cursor);
    raw.push(group.value);
    cursor = group.end;
  }
  return { at, end: cursor, raw, values: raw.map(decodeLatex) };
}

function sectionRange(tex, title) {
  const marker = `\\section{${title}}`;
  const start = tex.indexOf(marker);
  if (start < 0) return null;
  const bodyStart = start + marker.length;
  const next = tex.indexOf('\\section{', bodyStart);
  const endDoc = tex.indexOf('\\end{document}', bodyStart);
  const end = next >= 0 ? next : endDoc >= 0 ? endDoc : tex.length;
  return { start, bodyStart, end, body: tex.slice(bodyStart, end) };
}

function firstSectionStart(tex) {
  const start = tex.indexOf('\\section{');
  if (start < 0) throw new Error('master resume is missing section headers');
  return start;
}

function extractItems(block) {
  const items = [];
  let cursor = 0;
  while (true) {
    const item = readCommandArgs(block, '\\resumeItem', 1, cursor);
    if (!item) break;
    items.push({ raw: item.raw[0].trim(), text: item.values[0] });
    cursor = item.end;
  }
  return items;
}

function inferTags(...parts) {
  const text = parts.filter(Boolean).join(' ');
  return TAG_RULES.filter(([, re]) => re.test(text)).map(([tag]) => tag);
}

function parseExperience(tex) {
  const body = sectionRange(tex, 'Experience').body;
  const entries = [];
  let cursor = 0;
  while (true) {
    const entry = readCommandArgs(body, '\\resumeSubheading', 4, cursor);
    if (!entry) break;
    const next = findCommand(body, '\\resumeSubheading', entry.end);
    const itemBlock = body.slice(entry.end, next >= 0 ? next : body.length);
    const [role, period, company, location] = entry.raw;
    const bullets = extractItems(itemBlock).map((b) => ({ ...b, tags: inferTags(b.text) }));
    const id = slugify(`${decodeLatex(role)} ${decodeLatex(company)}`);
    entries.push({
      id,
      raw: { role, period, company, location },
      core: !COMMON_DROP.some((drop) => id.includes(drop)),
      bullets,
    });
    cursor = entry.end;
  }
  return entries;
}

function parseProjects(tex) {
  const body = sectionRange(tex, 'Projects').body;
  const projects = [];
  let cursor = 0;
  while (true) {
    const project = readCommandArgs(body, '\\resumeProjectHeading', 2, cursor);
    if (!project) break;
    const next = findCommand(body, '\\resumeProjectHeading', project.end);
    const itemBlock = body.slice(project.end, next >= 0 ? next : body.length);
    const bullets = extractItems(itemBlock).map((b) => ({ ...b, tags: inferTags(b.text) }));
    const title = decodeLatex(project.raw[0]);
    projects.push({
      id: slugify(title),
      rawHeading: project.raw[0].trim(),
      rawMeta: project.raw[1].trim(),
      bullets,
      tags: inferTags(title, ...bullets.map((b) => b.text)),
    });
    cursor = project.end;
  }
  return projects;
}

function parseSkills(tex) {
  const body = sectionRange(tex, 'Technical Skills').body;
  const skills = [];
  const re = /\\textbf\{([^{}]+)\}\{:\s*([\s\S]*?)(?=\\\\\s*\\textbf|\\\\\s*\}\}|\n\s*\}\})/g;
  let match;
  while ((match = re.exec(body))) {
    const rawCat = match[1].trim();
    // The non-greedy value capture includes the closing brace of `{: ...}`; drop it.
    const rawVal = match[2].trim().replace(/\}$/, '').trim();
    const cat = decodeLatex(rawCat);
    const val = decodeLatex(rawVal);
    if (cat && val) skills.push({ rawCat, rawVal, tags: inferTags(cat, val) });
  }
  return skills;
}

// ---------------------------------------------------------------------------
// Relevance ranking
// ---------------------------------------------------------------------------

function relevance(tags, priority) {
  let best = priority.length + 5;
  let matches = 0;
  for (const tag of tags) {
    const index = priority.indexOf(tag);
    if (index >= 0) {
      matches += 1;
      if (index < best) best = index;
    }
  }
  return { best, matches };
}

function rankByRelevance(items, priority) {
  return items
    .map((item, index) => ({ item, index, score: relevance(item.tags, priority) }))
    .sort((a, b) => a.score.best - b.score.best || b.score.matches - a.score.matches || a.index - b.index)
    .map((x) => x.item);
}

function experienceScore(exp, priority) {
  let best = priority.length + 5;
  let matches = 0;
  for (const bullet of exp.bullets) {
    const s = relevance(bullet.tags, priority);
    if (s.best < best) best = s.best;
    matches += s.matches;
  }
  return { best, matches };
}

function shouldDropExperience(exp, role) {
  const drop = new Set([...(role.dropExp || []), ...COMMON_DROP]);
  return [...drop].some((item) => exp.id.includes(item.toLowerCase()));
}

// ---------------------------------------------------------------------------
// LaTeX emission (Jake structure, master's natural language)
// ---------------------------------------------------------------------------

function latexEscapeText(text = '') {
  return String(text)
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([&%$#_{}])/g, '\\$1')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

// Hybrid summary = stable identity anchor + one role-specific focus line.
// The anchor signals breadth + headline impact; the focus narrows to the role.
// No company-name flattery tail. ML-led roles open with the ML proof; everything
// else opens with the $176,980/yr automation + end-to-end ownership proof.
const SUMMARY_ANCHORS = {
  ml: 'Computer Science MEng new grad at Virginia Tech, graduating May 2026, with internship experience building and deploying machine learning systems on real production data. Comfortable taking a problem from the data and modeling all the way through to a deployed, reliable service.',
  impact: 'Computer Science MEng new grad at Virginia Tech, graduating May 2026, with internship experience building production software and data systems that made a real operational difference. Comfortable taking a problem from the backend and data all the way through to a deployed, reliable service.',
};
const ML_LED_TAGS = new Set(['ml', 'ai', 'inference', 'eval', 'forecasting', 'sensor']);

function summaryAnchor(role) {
  if (role.anchor) return SUMMARY_ANCHORS[role.anchor];
  return SUMMARY_ANCHORS[ML_LED_TAGS.has(role.priority[0]) ? 'ml' : 'impact'];
}

function renderSummary(role) {
  const text = role.focus ? `${summaryAnchor(role)} ${role.focus}` : role.summary;
  return `\\section{Summary}\n \\small{${latexEscapeText(text)}}\n \\vspace{2pt}`;
}

function renderExperience(exps, role, caps) {
  const kept = exps.filter((exp) => !shouldDropExperience(exp, role));
  const volvo = kept.find((exp) => exp.id === VOLVO_ID);
  const others = kept.filter((exp) => exp.id !== VOLVO_ID);
  const rankedOthers = others
    .map((exp) => ({ exp, score: experienceScore(exp, role.priority) }))
    .sort((a, b) => a.score.best - b.score.best || b.score.matches - a.score.matches)
    .slice(0, caps.maxSecExp)
    .map((x) => x.exp);
  const keepIds = new Set([volvo?.id, ...rankedOthers.map((e) => e.id)].filter(Boolean));
  const ordered = kept.filter((exp) => keepIds.has(exp.id)); // preserve master (reverse-chron) order

  const blocks = ordered.map((exp) => {
    const limit = exp.id === VOLVO_ID ? caps.volvoBullets : caps.secBullets;
    const bullets = rankByRelevance(exp.bullets, role.priority).slice(0, limit);
    const li = bullets.map((b) => `        \\resumeItem{${b.raw}}`).join('\n');
    return `    \\resumeSubheading\n      {${exp.raw.role}}{${exp.raw.period}}\n      {${exp.raw.company}}{${exp.raw.location}}\n      \\resumeItemListStart\n${li}\n      \\resumeItemListEnd`;
  });
  return `\\section{Experience}\n  \\resumeSubHeadingListStart\n${blocks.join('\n')}\n  \\resumeSubHeadingListEnd`;
}

function renderProjects(projects, role, caps) {
  const ranked = rankByRelevance(projects, role.priority).slice(0, caps.maxProjects);
  const blocks = ranked.map((project) => {
    const bullets = rankByRelevance(project.bullets, role.priority).slice(0, caps.projBullets);
    const li = bullets.map((b) => `            \\resumeItem{${b.raw}}`).join('\n');
    return `      \\resumeProjectHeading\n          {${project.rawHeading}}{${project.rawMeta}}\n          \\resumeItemListStart\n${li}\n          \\resumeItemListEnd`;
  });
  return `\\section{Projects}\n    \\resumeSubHeadingListStart\n${blocks.join('\n')}\n    \\resumeSubHeadingListEnd`;
}

function renderSkills(skills, role, caps) {
  const ranked = rankByRelevance(skills, role.priority).slice(0, caps.skillLines);
  const lines = ranked.map((s) => `     \\textbf{${s.rawCat}}{: ${s.rawVal}} \\\\`).join('\n');
  return `\\section{Technical Skills}\n \\begin{itemize}[leftmargin=0.15in, label={}]\n    \\small{\\item{\n${lines}\n    }}\n \\end{itemize}`;
}

// ---------------------------------------------------------------------------
// Build + one-page auto-fit
// ---------------------------------------------------------------------------

// Progressive trim sequence: drop the lowest-value evidence first.
const CAP_SEQUENCE = [
  { volvoBullets: 4, secBullets: 2, maxSecExp: 2, maxProjects: 2, projBullets: 2, skillLines: 7 },
  { volvoBullets: 4, secBullets: 2, maxSecExp: 2, maxProjects: 2, projBullets: 2, skillLines: 6 },
  { volvoBullets: 3, secBullets: 2, maxSecExp: 2, maxProjects: 2, projBullets: 2, skillLines: 6 },
  { volvoBullets: 3, secBullets: 2, maxSecExp: 2, maxProjects: 2, projBullets: 2, skillLines: 5 },
  { volvoBullets: 3, secBullets: 1, maxSecExp: 2, maxProjects: 2, projBullets: 2, skillLines: 5 },
  { volvoBullets: 3, secBullets: 1, maxSecExp: 2, maxProjects: 2, projBullets: 1, skillLines: 5 },
  { volvoBullets: 3, secBullets: 1, maxSecExp: 1, maxProjects: 2, projBullets: 1, skillLines: 5 },
];

function renderTex(master, parsed, role, caps) {
  const header = master.slice(0, firstSectionStart(master));
  const education = (() => {
    const r = sectionRange(master, 'Education');
    return master.slice(r.start, r.end).replace(/\s+$/, '');
  })();
  return [
    header.replace(/\s+$/, ''),
    '',
    renderSummary(role),
    '',
    renderSkills(parsed.skills, role, caps),
    '',
    renderExperience(parsed.experiences, role, caps),
    '',
    renderProjects(parsed.projects, role, caps),
    '',
    education,
    '',
    '\\end{document}',
    '',
  ].join('\n');
}

function countPages(pdfPath) {
  try {
    const out = execFileSync(
      'python3',
      ['-c', 'import sys,pypdf;print(len(pypdf.PdfReader(sys.argv[1]).pages))', pdfPath],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    );
    const n = parseInt(out.trim(), 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

async function build(slug) {
  if (!ROLES[slug]) throw new Error(`unknown role: ${slug}`);
  const role = { ...ROLES[slug], slug };
  const master = await readFile(SOURCE_TEX, 'utf8');
  const parsed = {
    experiences: parseExperience(master),
    projects: parseProjects(master),
    skills: parseSkills(master),
  };

  await mkdir(OUTDIR, { recursive: true });
  const texPath = `${OUTDIR}/stuti-shah-${slug}.tex`;
  const pdfPath = `${OUTDIR}/stuti-shah-${slug}.pdf`;

  let pages = null;
  for (let i = 0; i < CAP_SEQUENCE.length; i += 1) {
    const tex = renderTex(master, parsed, role, CAP_SEQUENCE[i]);
    await writeFile(texPath, tex);
    execFileSync('tectonic', [texPath, '-o', OUTDIR], { stdio: 'pipe' });
    pages = countPages(pdfPath);
    if (pages === null || pages <= 1) break;
  }
  return { pdfPath, pages };
}

const arg = process.argv[2];
if (arg === '--list') {
  console.log(Object.keys(ROLES).join('\n'));
} else if (arg === '--all') {
  const done = [];
  const overflow = [];
  for (const slug of Object.keys(ROLES)) {
    try {
      const { pages } = await build(slug);
      done.push(slug);
      if (pages && pages > 1) overflow.push(`${slug} (${pages}p)`);
    } catch (error) {
      console.log(`FAIL ${slug}: ${error.message}`);
    }
  }
  console.log(`built ${done.length}/${Object.keys(ROLES).length} resumes from ${SOURCE_TEX}`);
  if (overflow.length) console.log(`WARNING: still >1 page: ${overflow.join(', ')}`);
} else if (arg) {
  const { pdfPath, pages } = await build(arg);
  console.log(`built ${pdfPath}${pages ? ` (${pages} page${pages > 1 ? 's' : ''})` : ''}`);
} else {
  console.log('usage: node scripts/tailor-resume.mjs <slug> | --all | --list');
}
