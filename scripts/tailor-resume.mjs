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
 * Output: output/resumes/fortune-500/stuti-shah-<slug>.{tex,pdf} for Fortune 500
 *         targets (see FORTUNE_500_PREFIXES below), otherwise
 *         output/resumes/other/stuti-shah-<slug>.{tex,pdf}
 */
import { readFile, writeFile, mkdir, rm } from 'fs/promises';
import { execFileSync } from 'child_process';

const ROOT = new URL('..', import.meta.url).pathname;
const SOURCE_TEX = ROOT + 'output/stuti-shah-cv.tex';
const OUTDIR = ROOT + 'output/resumes';

const COMMON_DROP = ['finance', 'badminton'];

// Role slugs prefixed with one of these go to output/resumes/fortune-500/;
// everything else goes to output/resumes/other/. Keep in sync with the
// "Big Tech / Fortune 500" block in portals.yml.
const FORTUNE_500_PREFIXES = [
  'google', 'nvidia', 'amazon', 'adobe', 'apple', 'meta',
  'microsoft', 'jpmorgan', 'capitalone', 'walmart', 'ibm', 'oracle',
];

function resolveOutDir(slug) {
  const isFortune500 = FORTUNE_500_PREFIXES.some(
    (p) => slug === p || slug.startsWith(`${p}-`),
  );
  return `${OUTDIR}/${isFortune500 ? 'fortune-500' : 'other'}`;
}

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
  'glean-context-platform': {
    focus: 'Has shipped backend services and REST APIs in production (Python/Flask/PostgreSQL/Docker/Kubernetes/Argo CD via GitOps) and brings AI-agent and cloud-native experience, a strong base for building platform APIs, SDKs, and context services that power AI agents.',
    priority: ['backend', 'infra', 'ai', 'ml', 'automation', 'swe', 'systems'],
  },
  'glean-agentic-runtime': {
    focus: 'Has shipped production backend services with Python, Docker, Kubernetes, and Argo CD GitOps, and brings hands-on AI Agents and RAG skills, a strong base for building the distributed-systems runtime that powers AI agents.',
    priority: ['infra', 'backend', 'ai', 'systems', 'swe', 'ml', 'automation'],
    dropExp: ['aquaorange'],
  },
  'glean-billing': {
    focus: 'Has shipped reliable backend services and REST APIs with quantified cost-savings impact, plus hands-on pricing-model work that maps directly to consumption-based billing and revenue platform systems.',
    priority: ['backend', 'pricing', 'swe', 'data', 'automation', 'infra', 'ai'],
    dropExp: ['aquaorange'],
  },
  'glean-llm-evals': {
    focus: 'Brings rigorous model-evaluation methodology -- multi-baseline calibration, ablations, and coverage metrics on a multimodal ML project -- plus production backend and data-pipeline experience, a strong base for building LLM evaluation and observability infrastructure.',
    priority: ['eval', 'ml', 'ai', 'backend', 'data', 'systems', 'infra'],
  },
  'glean-developer-productivity': {
    focus: 'Has hands-on CI/CD, Docker, Kubernetes, Argo CD, GitOps, backend services, and AI-agent tooling exposure, a strong early-career base for developer productivity work that improves build, test, and deployment workflows.',
    priority: ['ci', 'infra', 'systems', 'automation', 'backend', 'swe', 'testing', 'ai'],
    dropExp: ['aquaorange'],
  },
  'glean-fullstack': {
    focus: 'Has shipped backend services, REST APIs, SQL-backed systems, ML workflows, and React-facing product features, a good fit for full-stack product engineering where backend strength and fast product ownership matter.',
    priority: ['fullstack', 'backend', 'swe', 'data', 'automation', 'ai', 'product'],
    dropExp: ['aquaorange'],
  },
  'glean-product-backend': {
    focus: 'Has built Python backend services, REST APIs, relational data models, PostgreSQL workflows, and production-aligned ML/data systems, a strong fit for product backend work that needs stable APIs and scalable server-side implementations.',
    priority: ['backend', 'swe', 'data', 'systems', 'automation', 'infra', 'product'],
    dropExp: ['aquaorange'],
  },
  'ramp-data': {
    focus: 'Has built data pipelines and warehouse-backed flows in SQL, Python, and Spark, which suits the reliable data infrastructure this team depends on.',
    priority: ['data', 'infra', 'backend', 'automation', 'swe', 'bi'],
  },
  'ramp-core-product': {
    focus: 'Has shipped backend services, REST APIs, and data workflows with Python, Flask, PostgreSQL, AWS, Docker, Kubernetes, and Argo CD, a strong early-career base for product backend systems that need reliability, data consistency, and automation.',
    priority: ['backend', 'swe', 'infra', 'automation', 'data', 'ai', 'systems'],
    dropExp: ['aquaorange'],
  },
  'ramp-credit': {
    focus: 'Combines backend services, data modeling, ML workflows, and quantified automation impact, which maps well to credit systems that turn business rules, risk signals, and AI workflows into reliable software.',
    priority: ['backend', 'data', 'automation', 'ml', 'ai', 'swe', 'systems'],
    dropExp: ['aquaorange'],
  },
  'ramp-production-engineering': {
    focus: 'Brings hands-on Kubernetes, Argo CD, Docker, REST API, PostgreSQL, and cloud deployment experience from production-aligned internship work, a strong foundation for infrastructure and reliability engineering.',
    priority: ['infra', 'systems', 'backend', 'swe', 'automation', 'perf', 'data'],
    dropExp: ['aquaorange'],
  },
  'notion-ai': {
    focus: 'Focused on applied AI, with natural-language and multimodal pipelines deployed behind real services and careful evaluation built into the process.',
    priority: ['ai', 'swe', 'backend', 'fullstack', 'ml', 'eval', 'product'],
  },
  'notion-ai-capture': {
    focus: 'Has built transcript and multimodal pipelines that turn unstructured conversational and visual input into structured, evaluated output, a direct fit for a team building AI Meeting Notes and conversation-capture features.',
    priority: ['ai', 'ml', 'eval', 'backend', 'swe', 'fullstack', 'data'],
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
  'bland-multimodal-llms': {
    focus: 'Has built multimodal modeling and evaluation pipelines, worked with AI agents and RAG, and shipped backend/data systems that connect models to usable workflows, a stretch but relevant base for conversational AI and multimodal LLM work.',
    priority: ['ai', 'ml', 'nlp', 'eval', 'backend', 'data', 'automation'],
    dropExp: ['aquaorange'],
  },
  'runpod-fullstack': {
    focus: 'Has shipped Python backend services, REST APIs, ML workflows, Docker/Kubernetes deployments, and React-facing product work, a strong fit for an early-career full-stack role on AI infrastructure tooling.',
    priority: ['backend', 'fullstack', 'swe', 'infra', 'ml', 'ai', 'automation'],
    dropExp: ['aquaorange'],
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
  'affirm-swe-ml-training-serving': {
    focus: 'Has built and deployed backend services and machine-learning-adjacent data systems with Python, PostgreSQL, Docker, Kubernetes, and Argo CD, a strong fit for ML training and serving infrastructure that needs reliable distributed systems fundamentals.',
    priority: ['infra', 'backend', 'ml', 'data', 'swe', 'systems', 'automation', 'eval'],
    dropExp: ['aquaorange'],
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
  'sierra-platform': {
    focus: 'Has shipped Python backend services, REST APIs, Kubernetes/GitOps deployments, and AI-agent/RAG work, a useful base for platform primitives that help teams build and deploy reliable AI agents.',
    priority: ['infra', 'backend', 'ai', 'systems', 'automation', 'swe', 'data'],
    dropExp: ['aquaorange'],
  },
  'sierra-agent': {
    focus: 'Has hands-on AI Agents, RAG, model evaluation, Python backend services, and workflow automation experience, a relevant base for production-grade agents that solve customer workflows.',
    priority: ['ai', 'eval', 'backend', 'automation', 'ml', 'product', 'fullstack'],
    dropExp: ['aquaorange'],
  },
  'sierra-intelligence': {
    focus: 'Has built ML analytics, model-evaluation pipelines, data systems, and backend services on real industrial data, a strong base for agent-quality measurement, experimentation, and feedback-loop systems.',
    priority: ['eval', 'ml', 'data', 'ai', 'backend', 'bi', 'systems'],
    dropExp: ['aquaorange'],
  },
  'sierra-agent-healthcare': {
    focus: 'Has built AI-agent/RAG workflows, backend services, and measurable automation tools, a relevant base for compliant healthcare agents that need evaluation, reliability, and customer workflow understanding.',
    priority: ['ai', 'eval', 'backend', 'automation', 'product', 'data', 'fullstack'],
    dropExp: ['aquaorange'],
  },
  'wayve-runtime-platform': {
    focus: 'Brings hands-on backend, Kubernetes/GitOps deployment, observability-adjacent systems work, and low-level systems fundamentals, a relevant early-career base for runtime platform tooling that profiles and improves autonomous-vehicle software.',
    priority: ['systems', 'perf', 'infra', 'backend', 'sensor', 'swe', 'data'],
    dropExp: ['aquaorange'],
  },
  'mistral-research-ml': {
    focus: 'Has built ML-adjacent backend services, data pipelines, model evaluation workflows, and Kubernetes deployments, a useful foundation for research engineering work that turns large-model experiments into reliable training and evaluation systems.',
    priority: ['ml', 'ai', 'data', 'infra', 'eval', 'backend', 'systems'],
    dropExp: ['aquaorange'],
  },
  'mistral-backend-ny': {
    focus: 'Has shipped Python backend services, REST APIs, PostgreSQL-backed workflows, Docker/Kubernetes deployments, and AI-agent/RAG projects, a strong fit for backend systems that power AI products, developer tooling, billing, and observability.',
    priority: ['backend', 'infra', 'ai', 'swe', 'data', 'systems', 'automation'],
    dropExp: ['aquaorange'],
  },
  'google-ml-swe-travel-ads': {
    focus: 'Has built ML workflows, model evaluation, data pipelines, and production backend services with Python and Kubernetes, a useful base for ranking, retrieval, GenAI inference, and experimentation work on large-scale ads systems.',
    priority: ['ml', 'ai', 'eval', 'data', 'backend', 'infra', 'experimentation'],
    dropExp: ['aquaorange'],
  },
  'google-application-engineer-fullstack': {
    focus: 'Has built full-stack internal tooling, REST APIs, web-scale data pipelines, and financial pricing models, plus validation pipelines around a third-party vendor platform (Zoho CRM), a solid base for an Application Engineer role building internal financial-planning tools that integrate with vendor systems and deploy to the cloud.',
    priority: ['fullstack', 'data', 'pricing', 'backend', 'infra', 'automation', 'impact', 'testing'],
  },
  'google-cloud-data-engineer-ps': {
    focus: 'Has built ETL/Spark pipelines, REST APIs, and ML-driven analytics with query optimization on Python, PostgreSQL/MySQL, and cloud platforms (AWS, Azure), plus a track record of translating technical work for cross-functional and non-specialist audiences, a relevant base for data engineering and technical delivery work on Google Cloud.',
    priority: ['data', 'backend', 'ml', 'infra', 'bi', 'automation', 'swe'],
    dropExp: ['aquaorange'],
  },
  'google-parallel-fs-storage': {
    focus: 'Has shipped production backend services and REST APIs deployed through Kubernetes and Argo CD GitOps pipelines, and brings systems-level performance reasoning from coursework and a 250x inference-speedup project, a relevant base for building and optimizing the distributed file-system layer behind Google Cloud\'s AI/ML storage infrastructure.',
    priority: ['infra', 'systems', 'perf', 'backend', 'swe', 'impact', 'data'],
    dropExp: ['aquaorange'],
  },
  'google-deepmind-genai-swe': {
    focus: 'Has built and optimized a multimodal diffusion and transformer generative pipeline achieving up to 250x faster inference, alongside production Python backend services and test-automation experience, a direct fit for prototyping GenAI solutions for generative media, multimodal understanding, and ML pipelines at Google DeepMind.',
    priority: ['ai', 'ml', 'inference', 'eval', 'systems', 'testing', 'backend'],
  },
  'google-pixel-ai-test-infra': {
    focus: 'Has built test automation using BrowserStack and testRigor for cross-device functional and regression testing, and has optimized and evaluated a machine-learning pipeline achieving up to 250x faster inference, a direct fit for building AI-powered cross-device test infrastructure.',
    priority: ['testing', 'ml', 'eval', 'inference', 'ai', 'systems', 'backend'],
  },
  'google-sustainability-data': {
    focus: 'Has built a GHG emissions prediction pipeline in Power BI for sustainability and regulatory reporting, alongside production data pipelines and analytics platforms using Spark/PySpark, ETL, and cloud data warehouses, a direct fit for building and optimizing data pipelines and data marts for sustainability datasets.',
    priority: ['data', 'bi', 'ds', 'infra', 'backend', 'eval', 'impact'],
  },
  'google-site-reliability': {
    focus: 'Has deployed production backend services through GitOps-based Kubernetes and Argo CD pipelines for reliable, reproducible environments, and has automated manual workflows for measurable operational savings, a relevant base for developing and improving code for reliability, scalability, and automation in a Site Reliability Engineering role.',
    priority: ['infra', 'systems', 'automation', 'perf', 'backend', 'impact', 'eval'],
  },
  'nvidia-applied-ml-circuit-ncg': {
    focus: 'Has hands-on Python ML, model evaluation, AI-agent exposure, and systems fundamentals, a relevant new-grad base for AI-driven design automation even though circuit/VLSI domain depth is the main gap.',
    priority: ['ml', 'ai', 'systems', 'perf', 'automation', 'eval', 'backend'],
    dropExp: ['aquaorange'],
  },
  'nvidia-systems-ncg': {
    focus: 'Brings low-level systems fundamentals, performance reasoning, ML workflow experience, and production-aligned Kubernetes/GitOps deployment, a good base for new-college-grad systems software work with an AI/computational methods edge.',
    priority: ['systems', 'perf', 'ml', 'infra', 'swe', 'automation', 'ai'],
    dropExp: ['aquaorange'],
  },
  'amazon-demand-forecasting-ds': {
    focus: 'Combines forecasting-model project work, Python/SQL data pipelines, model evaluation, and production analytics experience, a strong thematic fit for large-scale demand forecasting despite the 3+ year requirement.',
    priority: ['forecasting', 'ml', 'ds', 'data', 'eval', 'experimentation', 'impact'],
    dropExp: ['aquaorange'],
  },
  'adobe-ug-mle': {
    focus: 'Has built ML workflows, backend APIs, model evaluation, and deployed data/ML systems with Python, Docker, Kubernetes, and SQL, a strong fit for Adobe Firefly university-grad work on GenAI services, inference pipelines, and model productization.',
    priority: ['ml', 'ai', 'inference', 'backend', 'eval', 'data', 'infra'],
    dropExp: ['aquaorange'],
  },
  'apple-foundationdb': {
    focus: 'Has production-aligned backend services, PostgreSQL workflows, Kubernetes/GitOps deployment, low-level systems fundamentals, and performance reasoning, a relevant base for distributed database engineering even though C++ database internals are a stretch.',
    priority: ['systems', 'backend', 'perf', 'data', 'infra', 'swe', 'testing'],
    dropExp: ['aquaorange'],
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
  'coreweave-data-infra': {
    focus: 'Has built backend services, REST APIs, PostgreSQL-backed workflows, Spark/PySpark ETL pipelines, and Kubernetes/GitOps deployments, a strong early-career base for data infrastructure services on an AI cloud platform.',
    priority: ['data', 'infra', 'backend', 'swe', 'systems', 'automation', 'ml'],
    dropExp: ['aquaorange'],
  },
  'coreweave-devex': {
    focus: 'Has hands-on CI/CD, Docker, Kubernetes, Argo CD, GitOps, backend services, and AI-agent tooling exposure, a strong foundation for developer experience work across CI, artifacts, cloud-native services, and agentic developer integrations.',
    priority: ['ci', 'infra', 'backend', 'automation', 'systems', 'swe', 'ai', 'testing'],
    dropExp: ['aquaorange'],
  },
  'coreweave-inference-aiml': {
    focus: 'Has built and deployed ML-adjacent backend systems with Python, Kubernetes, GitOps, model evaluation, and inference-optimization project work, a strong fit for an IC1 model-serving role on GPU infrastructure.',
    priority: ['inference', 'ml', 'backend', 'infra', 'systems', 'perf', 'ai'],
    dropExp: ['aquaorange'],
  },
  'coreweave-observability': {
    focus: 'Has deployed backend services with Docker, Kubernetes, Argo CD, GitOps, debugging, logging, monitoring, and ML workflow experience, a good base for observability systems on AI infrastructure.',
    priority: ['infra', 'systems', 'backend', 'data', 'automation', 'ml', 'swe'],
    dropExp: ['aquaorange'],
  },
  'deepgram-active-learning': {
    focus: 'Has built Python backend services, data pipelines, ML workflows, and Kubernetes/GitOps deployments, a strong base for internal data and ML training systems that improve researcher productivity.',
    priority: ['data', 'ml', 'backend', 'infra', 'automation', 'systems', 'swe'],
    dropExp: ['aquaorange'],
  },
  'deepgram-ml-systems': {
    focus: 'Has hands-on ML lifecycle, data engineering, internal tooling, and Kubernetes deployment experience, a strong fit for accelerating model research through scalable training and evaluation systems.',
    priority: ['ml', 'data', 'infra', 'eval', 'backend', 'systems', 'automation'],
    dropExp: ['aquaorange'],
  },
  'deepgram-voice-agent': {
    focus: 'Has shipped backend services and ML-adjacent systems with Python, REST APIs, Kubernetes, and AI-agent experience, a useful base for voice-agent services that orchestrate models and production integrations.',
    priority: ['backend', 'ai', 'ml', 'infra', 'systems', 'automation', 'swe'],
    dropExp: ['aquaorange'],
  },
  'deepgram-mlops': {
    focus: 'Has deployed machine-learning-adjacent services with Python, Docker, Kubernetes, Argo CD, and evaluation workflows, a strong early-career base for MLOps pipelines, model validation, and production monitoring.',
    priority: ['infra', 'ml', 'backend', 'eval', 'automation', 'systems', 'data'],
    dropExp: ['aquaorange'],
  },
  'cohere-agentic-workflows': {
    focus: 'Has built AI-agent and RAG workflows alongside production backend services, model evaluation, and customer-facing product translation, a relevant base for reliable enterprise agentic systems.',
    priority: ['ai', 'eval', 'backend', 'automation', 'ml', 'data', 'systems'],
    dropExp: ['aquaorange'],
  },
  'cohere-data-foundations': {
    focus: 'Has built Python and SQL data pipelines, Spark/PySpark workflows, analytics services, and deployed backend systems, a strong early-career base for data foundations work around AI products.',
    priority: ['data', 'backend', 'infra', 'ml', 'automation', 'swe', 'bi'],
    dropExp: ['aquaorange'],
  },
  'cohere-data-infra': {
    focus: 'Has built data pipelines and deployed backend services with Python, Spark/PySpark, Docker, Kubernetes, Argo CD, and cloud storage, a relevant base for AI data infrastructure work.',
    priority: ['data', 'infra', 'backend', 'ml', 'systems', 'automation', 'swe'],
    dropExp: ['aquaorange'],
  },
  'langchain-observability-evals': {
    focus: 'Has built ML evaluation pipelines, backend services, REST APIs, PostgreSQL-backed workflows, and AI-agent/RAG projects, a strong base for developer-facing AI observability and evals work.',
    priority: ['eval', 'ai', 'backend', 'data', 'fullstack', 'systems', 'automation'],
    dropExp: ['aquaorange'],
  },
  'langchain-applied-ai': {
    focus: 'Has hands-on AI Agents, RAG, model evaluation, Python backend services, and workflow automation experience, a relevant base for production-grade applied AI agents and internal automation.',
    priority: ['ai', 'eval', 'automation', 'backend', 'ml', 'fullstack', 'product'],
    dropExp: ['aquaorange'],
  },
  'glacis-agentic-ai': {
    focus: 'Has shipped Python backend services, AI-agent and RAG workflows, PostgreSQL systems, cloud deployments, and quantified automation impact, a useful base for agentic AI products in supply-chain workflows.',
    priority: ['ai', 'backend', 'automation', 'fullstack', 'data', 'product', 'infra'],
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
  'aurus-llm-ds-intern': {
    focus: 'Has built a transformer-based pipeline that encodes text with FinBERT and trains a custom PyTorch fusion model with rigorous evaluation, plus production machine learning on millions of real industrial records, a relevant base for training and evaluating models against internal datasets.',
    priority: ['ai', 'ml', 'eval', 'data', 'nlp', 'backend', 'infra'],
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

  const outDir = resolveOutDir(slug);
  await mkdir(outDir, { recursive: true });
  const texPath = `${outDir}/stuti-shah-${slug}.tex`;
  const pdfPath = `${outDir}/stuti-shah-${slug}.pdf`;

  let pages = null;
  for (let i = 0; i < CAP_SEQUENCE.length; i += 1) {
    const tex = renderTex(master, parsed, role, CAP_SEQUENCE[i]);
    await writeFile(texPath, tex);
    execFileSync('tectonic', [texPath, '-o', outDir], { stdio: 'pipe' });
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
